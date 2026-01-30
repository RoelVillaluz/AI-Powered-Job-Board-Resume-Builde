import { useMemo } from "react";
import { useResumeStore } from "../../stores/resumeStore";
import { useJobDetails } from "../jobs/useJobDetails";
import { useParams } from "react-router-dom";
import { RESUME_ANALYSIS_MESSAGES, SKILL_ANALYSIS_MESSAGES, EXPERIENCE_ANALYSIS_MESSAGES } from "../../../../backend/constants";
import { useResumeJobSimilarityQuery } from "./useResumeQueries";

export const useResumeAnalysis = (jobId) => {
    const currentResume = useResumeStore(state => state.currentResume);
    const { job, isLoading: isJobLoading } = useJobDetails(jobId);

    // Use React Query to fetch comparison
    const { data: comparisonData, isLoading: isComparing, error } = useResumeJobSimilarityQuery(currentResume?._id, job?._id);

    // Compute strengths and improvements based on the fetched data
    const { resumeScore, strengths, improvements } = useMemo(() => {
        if (!comparisonData) {
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

        const skillSim = comparisonData.skill_similarity || 0;
        const expSim = comparisonData.experience_similarity || 0;

        const newStrengths = [];
        const newImprovements = [];

        const mapScoreToMessage = (score, analysisMessages) => {
        const thresholds = [0, 0.25, 0.5, 0.75, 1];
        const closest = thresholds.reduce((prev, curr) =>
            Math.abs(curr - score) < Math.abs(prev - score) ? curr : prev
        );
            return analysisMessages[closest];
        };

        const skillMsg = mapScoreToMessage(skillSim, SKILL_ANALYSIS_MESSAGES);
        if (skillMsg) {
            skillSim >= 0.5 ? newStrengths.push(skillMsg.message) : newImprovements.push(skillMsg.message);
        }

        const expMsg = mapScoreToMessage(expSim, EXPERIENCE_ANALYSIS_MESSAGES);
        if (expMsg) {
            expSim >= 0.5 ? newStrengths.push(expMsg.message) : newImprovements.push(expMsg.message);
        }

        return {
        resumeScore: {
            skillSimilarity: skillSim,
            experienceSimilarity: expSim,
            requirementsSimilarity: comparisonData.requirements_similarity || 0,
            totalScore: comparisonData.total_score || 0,
        },
            strengths: newStrengths,
            improvements: newImprovements,
        };
    }, [comparisonData]);

    return {
        resumeScore,
        isComparing: isComparing || isJobLoading,
        messages: RESUME_ANALYSIS_MESSAGES,
        strengths,
        improvements,
        error,
    };
}