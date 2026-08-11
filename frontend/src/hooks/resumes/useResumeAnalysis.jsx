import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/authStore";
import { useResumeStore } from "../../stores/resumeStore";
import { useJobDetails } from "../jobs/useJobDetails";
import { useSocket } from "../../contexts/SocketContext";
import { RESUME_ANALYSIS_MESSAGES, SKILL_ANALYSIS_MESSAGES, EXPERIENCE_ANALYSIS_MESSAGES } from "@shared/constants/jobs/constants";
import { useResumeJobMatchQuery, useGenerateMatchInsightMutation } from "./useResumeQueries";

export const useResumeAnalysis = (jobId) => {
    const currentResume = useResumeStore(state => state.currentResume);
    const resumeId = currentResume?._id;
    const token = useAuthStore(state => state.token);
    const { job, isLoading: isJobLoading } = useJobDetails(jobId);
    const { socket, connected } = useSocket();
    const queryClient = useQueryClient();

    const { data: matchData, isLoading: isComparing, error: matchError } =
        useResumeJobMatchQuery(resumeId, job?._id, token);

    const generateInsight = useGenerateMatchInsightMutation();
    const hasTriggeredInsight = useRef(false);

    useEffect(() => {
        hasTriggeredInsight.current = false;
    }, [resumeId, job?._id]);

    useEffect(() => {
        if (!resumeId || !job?._id || !token) return;
        if (!matchData) return;
        if (matchData.explanation) return;
        if (hasTriggeredInsight.current) return;

        hasTriggeredInsight.current = true;
        generateInsight.mutate({ resumeId, jobId: job._id, token });
    }, [resumeId, job?._id, token, matchData, generateInsight]);

    useEffect(() => {
        if (!socket || !connected || !resumeId || !job?._id) return;

        const handleInsightComplete = ({ data }) => {
            const updatedMatch = data?.matches?.find(
                (m) => m.jobId?.toString() === job._id?.toString()
            );
            if (!updatedMatch?.explanation) return;

            queryClient.setQueryData(
                ['resumeJobMatch', resumeId, job._id],
                (old) => old ? { ...old, explanation: updatedMatch.explanation } : old
            );
        };

        socket.on('matchInsight:complete', handleInsightComplete);
        return () => socket.off('matchInsight:complete', handleInsightComplete);
    }, [socket, connected, resumeId, job?._id, queryClient]);

    const { resumeScore, strengths, improvements } = useMemo(() => {
        if (!matchData) {
        return {
            resumeScore: {
            skillSimilarity: 0,
            experienceSimilarity: 0,
            requirementsSimilarity: 0,
            totalScore: 0,
            },
            strengths: [],
            improvements: [],
        };
        }

        const skillSim = (matchData.components?.skillMatch ?? 0) / 100;
        const expSim = (matchData.components?.experienceFit ?? 0) / 100;

        const mapScoreToMessage = (score, analysisMessages) => {
        const thresholds = [0, 0.25, 0.5, 0.75, 1];
        const closest = thresholds.reduce((prev, curr) =>
            Math.abs(curr - score) < Math.abs(prev - score) ? curr : prev
        );
            return analysisMessages[closest];
        };

        let newStrengths = matchData.strengths ?? [];
        let newImprovements = matchData.improvements ?? [];

        if (!newStrengths.length && !newImprovements.length) {
            const skillMsg = mapScoreToMessage(skillSim, SKILL_ANALYSIS_MESSAGES);
            if (skillMsg) {
                skillSim >= 0.5 ? newStrengths.push(skillMsg.message) : newImprovements.push(skillMsg.message);
            }
            const expMsg = mapScoreToMessage(expSim, EXPERIENCE_ANALYSIS_MESSAGES);
            if (expMsg) {
                expSim >= 0.5 ? newStrengths.push(expMsg.message) : newImprovements.push(expMsg.message);
            }
        }

        return {
        resumeScore: {
            skillSimilarity: skillSim,
            experienceSimilarity: expSim,
            requirementsSimilarity: (matchData.components?.semanticSim ?? 0) / 100,
            totalScore: matchData.finalScore ?? 0,
        },
            strengths: newStrengths,
            improvements: newImprovements,
        };
    }, [matchData]);

    const normalizeError = (err) => {
        if (!err) return null;
        if (err?.response?.status === 404) return null;
        if (typeof err === 'string') return err;
        return err?.response?.data?.message ?? err?.message ?? 'Something went wrong';
    };

    return {
        resumeScore,
        isComparing: isComparing || isJobLoading,
        messages: RESUME_ANALYSIS_MESSAGES,
        strengths,
        improvements,
        explanation: matchData?.explanation || null,
        isGeneratingExplanation: !matchData?.explanation && (generateInsight.isPending || (!!matchData && hasTriggeredInsight.current)),
        error: normalizeError(matchError),
    };
}