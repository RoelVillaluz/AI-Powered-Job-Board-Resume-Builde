import { useState, useEffect } from "react";
import axios from "axios";
import { useData } from "../../contexts/DataProvider";
import { useResume } from "../../contexts/ResumesContext";
import { useJobDetails } from "../jobs/useJobDetails";
import { useParams } from "react-router-dom";

export const useResumeAnalysis = () => {
    const { baseUrl } = useData();
    const { jobId } = useParams();
    const { currentResume } = useResume();
    const { job, loading } = useJobDetails(baseUrl, jobId);

    const [isComparing, setIsComparing] = useState(false);
    const [resumeScore, setResumeScore] = useState({
        skillSimilarity: 0,
        experienceSimilarity: 0,
        requirementsSimilarity: 0,
        totalScore: 0
    })

    useEffect(() => {
        const compareResumeAndJob = async () => {
            
            setIsComparing(true);
            try {
                const response = await axios.get(`${baseUrl}/ai/compare/${currentResume._id}/${job._id}`);
                console.log("Feedback:", response.data);

                setResumeScore({
                    skillSimilarity: response.data.skill_similarity,
                    experienceSimilarity: response.data.experience_similarity,
                    requirementsSimilarity: response.data.requirements_similarity,
                    totalScore: response.data.total_score,
                });
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setIsComparing(false);
            }
        };

        // Only run once both job and resume are ready and loading has *just finished*
        if (!loading && currentResume?._id && job?._id) {
            console.log("🚀 Comparing resume and job...");
            compareResumeAndJob();
        }
    }, [currentResume?._id, job?._id, loading])

    return { resumeScore, isComparing, messages }
}