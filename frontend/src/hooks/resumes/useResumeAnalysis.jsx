import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useResumeStore } from "../../stores/resumeStore";
import { useJobDetails } from "../jobs/useJobDetails";
import { useParams } from "react-router-dom";
import { RESUME_ANALYSIS_MESSAGES, SKILL_ANALYSIS_MESSAGES, EXPERIENCE_ANALYSIS_MESSAGES } from "../../../../backend/constants";
import { BASE_API_URL } from "../../config/api";

export const useResumeAnalysis = () => {
    const { jobId } = useParams();
    const currentResume = useResumeStore(state => state.currentResume);
    const { job, isLoading: jobLoading } = useJobDetails(jobId);

    const [isComparing, setIsComparing] = useState(false);
    const [error, setError] = useState(null);
    const [resumeScore, setResumeScore] = useState({
        skillSimilarity: 0,
        experienceSimilarity: 0,
        requirementsSimilarity: 0,
        totalScore: 0
    });
    const [strengths, setStrengths] = useState([]);
    const [improvements, setImprovements] = useState([]);

    // Keep track of last analyzed resume/job to prevent loops
    const lastAnalyzed = useRef({ resumeId: null, jobId: null });

    const mapScoreToMessage = (score, analysisMessages) => {
        const thresholds = [0, 0.25, 0.5, 0.75, 1];
        const closest = thresholds.reduce((prev, curr) =>
            Math.abs(curr - score) < Math.abs(prev - score) ? curr : prev
        );
        return analysisMessages[closest];
    };

    useEffect(() => {
        if (!currentResume?._id || !job?._id || jobLoading) return;

        // Only run if resume/job changed - compare IDs only
        if (
            lastAnalyzed.current.resumeId === currentResume._id &&
            lastAnalyzed.current.jobId === job._id
        ) return;

        lastAnalyzed.current = { resumeId: currentResume._id, jobId: job._id };

        let isCancelled = false;

        const compareResumeAndJob = async () => {
            setIsComparing(true);
            setError(null);

            try {
                const response = await axios.get(
                    `${BASE_API_URL}/ai/compare/${currentResume._id}/${job._id}`
                );

                if (isCancelled) return;

                const skillSim = response.data.skill_similarity || 0;
                const expSim = response.data.experience_similarity || 0;

                setResumeScore({
                    skillSimilarity: skillSim,
                    experienceSimilarity: expSim,
                    requirementsSimilarity: response.data.requirements_similarity || 0,
                    totalScore: response.data.total_score || 0,
                });

                const newStrengths = [];
                const newImprovements = [];

                const skillMsg = mapScoreToMessage(skillSim, SKILL_ANALYSIS_MESSAGES);
                if (skillMsg) {
                    if (skillSim >= 0.5) newStrengths.push(skillMsg.message);
                    else newImprovements.push(skillMsg.message);
                }

                const expMsg = mapScoreToMessage(expSim, EXPERIENCE_ANALYSIS_MESSAGES);
                if (expMsg) {
                    if (expSim >= 0.5) newStrengths.push(expMsg.message);
                    else newImprovements.push(expMsg.message);
                }

                setStrengths(newStrengths);
                setImprovements(newImprovements);

            } catch (err) {
                if (isCancelled) return;

                console.error("Error comparing resume:", err);
                setError("Failed to analyze resume");

                setResumeScore({
                    skillSimilarity: 0,
                    experienceSimilarity: 0,
                    requirementsSimilarity: 0,
                    totalScore: 0,
                });
                setStrengths([]);
                setImprovements([]);
            } finally {
                if (!isCancelled) setIsComparing(false);
            }
        };

        compareResumeAndJob();

        return () => { isCancelled = true; };
    }, [currentResume?._id, job?._id, jobLoading]); // Only depend on IDs, not the full objects

    return {
        resumeScore,
        isComparing,
        messages: RESUME_ANALYSIS_MESSAGES,
        strengths,
        improvements,
        error
    };
};