import { useState, useEffect } from "react";
import axios from "axios";
import { useData } from "../../contexts/DataProvider";
import { useResume } from "../../contexts/ResumesContext";
import { useJobDetails } from "../jobs/useJobDetails";
import { useParams } from "react-router-dom";
import { RESUME_ANALYSIS_MESSAGES } from "../../../../backend/constants";
import { SKILL_ANALYSIS_MESSAGES, EXPERIENCE_ANALYSIS_MESSAGES } from "../../../../backend/constants";

export const useResumeAnalysis = () => {
    const { jobId } = useParams();
    const { currentResume } = useResume();
    const { job, loading } = useJobDetails(baseUrl, jobId);

    const [isComparing, setIsComparing] = useState(false);
    const [error, setError] = useState(null);
    const [resumeScore, setResumeScore] = useState({
        skillSimilarity: 0,
        experienceSimilarity: 0,
        requirementsSimilarity: 0,
        totalScore: 0
    })
    const [strengths, setStrengths] = useState([]);
    const [improvements, setImprovements] = useState([]);

    // Function to map similarity score to the corresponding message
    const mapScoreToMessage = (score, analysisMessages) => {
        // Find the closest threshold
        const thresholds = [0, 0.25, 0.5, 0.75, 1];
        const closest = thresholds.reduce((prev, curr) =>
            Math.abs(curr - score) < Math.abs(prev - score) ? curr : prev
        );
        
        return analysisMessages[closest];
    };

    useEffect(() => {
        let isCancelled = false;

        const compareResumeAndJob = async () => {
            
            setIsComparing(true);
            try {
                const response = await axios.get(`${baseUrl}/ai/compare/${currentResume._id}/${job._id}`);
                console.log("Feedback:", response.data);

                if (!isCancelled) {
                    const skillSim = response.data.skill_similarity;
                    const expSim = response.data.experience_similarity;

                    setResumeScore({
                        skillSimilarity: skillSim,
                        experienceSimilarity: expSim,
                        requirementsSimilarity: response.data.requirements_similarity,
                        totalScore: response.data.total_score,
                    });

                    // Determine strengths and improvements dynamically
                    const newStrengths = [];
                    const newImprovements = [];

                    // Map skill similarity
                    const skillMsg = mapScoreToMessage(skillSim, SKILL_ANALYSIS_MESSAGES);
                    if (skillMsg) {
                        if (skillSim >= 0.5) {
                            newStrengths.push(skillMsg.message);
                        } else {
                            newImprovements.push(skillMsg.message);
                        }
                    }

                    // Map experience similarity
                    const expMsg = mapScoreToMessage(expSim, EXPERIENCE_ANALYSIS_MESSAGES);
                    if (expMsg) {
                        if (expSim >= 0.5) {
                            newStrengths.push(expMsg.message);
                        } else {
                            newImprovements.push(expMsg.message);
                        }
                    }

                    // Update the state
                    setStrengths(newStrengths);
                    setImprovements(newImprovements);

                    console.log("Strengths:", newStrengths);
                    console.log("Improvements:", newImprovements);
                }
            } catch (err) {
                if (!isCancelled) {
                    console.error("Error comparing resume:", err);

                     // Handle different error types from backend
                    let errorMessage = "Failed to analyze resume";
                    
                    if (err.response) {
                        // Backend returned an error response
                        const { status, data } = err.response;
                        
                        if (status === 404) {
                            errorMessage = data.message || "Resume or job not found";
                        } else if (status === 500) {
                            // Check if it's a Python script error
                            if (data.error === "Python script error") {
                                errorMessage = "Analysis service is temporarily unavailable";
                            } else if (data.error === "Failed to parse Python response") {
                                errorMessage = "Analysis completed but results couldn't be processed";
                            } else {
                                errorMessage = "Server error occurred while analyzing resume";
                            }
                        } else {
                            errorMessage = data.message || "An unexpected error occurred";
                        }
                    } else if (err.request) {
                        // Request was made but no response received
                        errorMessage = "Network error. Please check your connection.";
                    } else {
                        // Something else happened
                        errorMessage = err.message || "An unexpected error occurred";
                    }
                    
                    setError(errorMessage);
                    
                    // Reset scores on error
                    setResumeScore({
                        skillSimilarity: 0,
                        experienceSimilarity: 0,
                        requirementsSimilarity: 0,
                        totalScore: 0,
                    });

                    setStrengths([]);
                    setImprovements([]);
                }
            } finally {
                setIsComparing(false);
            }
        };

        // Only run once both job and resume are ready and loading has *just finished*
        if (!loading && currentResume?._id && job?._id) {
            compareResumeAndJob();
        }

        return (() => {
            isCancelled = true;
        })

    }, [currentResume?._id, job?._id, loading, baseUrl])

    return { resumeScore, isComparing, messages: RESUME_ANALYSIS_MESSAGES, strengths, improvements, error }
}