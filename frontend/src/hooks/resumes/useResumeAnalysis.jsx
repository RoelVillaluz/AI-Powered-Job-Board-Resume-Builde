import { useState, useEffect } from "react";

export const useResumeAnalysis = () => {

    const messages = {
        0: {
            rating: "No Resume yet",
            message: "You haven't uploaded a resume for this job. Consider adding one to improve your chances.",
        },
        0.25: {
            rating: "Poor",
            message: "Your resume has very few matching skills for this job. Try updating it with relevant skills.",
        },
        0.5: {
            rating: "Average",
            message: "Your resume matches some of the job's skills. A few tweaks could make it stronger.",
        },
        0.75: {
            rating: "Good",
            message: "Your resume aligns well with this job posting. A couple more relevant skills would make it great.",
        },
        0.9: {
            rating: "Great",
            message: "Your resume is a strong match for this job. You're just a step away from an excellent fit.",
        },
        1: {
            rating: "Excellent",
            message: "Your resume perfectly matches the job posting. You’re a top candidate for this role!",
        },
    };


    useEffect(() => {
        const compareResumeAndJob = async () => {
            setIsComparing(true)
            try {
                const response = await axios.get(`${baseUrl}/ai/compare/${currentResume?._id}/${job?._id}`)

                console.log('Feedback: ', response.data)
                setResumeScore({
                    skillSimilarity: response.data.skill_similarity,
                    experienceSimilarity: response.data.experience_similarity,
                    requirementsSimilarity: response.data.requirements_similarity,
                    totalScore: response.data.total_score
                })
                
            } catch (error) {
                console.error('Error: ', error)
            } finally {
                setIsComparing(false)
            }
        }
        if (currentResume && job && !loading) {
            compareResumeAndJob();
        }
    }, [currentResume, job, loading])
}