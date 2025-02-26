import Resume from "../models/resumeModel.js";
import JobPosting from "../models/jobPostingModel.js";
import { STATUS_MESSAGES, sendResponse } from '../constants.js';
import natural from "natural";
import { kmeans } from "ml-kmeans";
import cosineSimilarity from "compute-cosine-similarity";

// Helper function: Convert skills into numerical vectors
const skillToVector = (skills, allSkills) => {
    return allSkills.map(skill => (skills.includes(skill) ? 1 : 0));
};

export const getJobRecommendations = async (req, res) => {
    const { id } = req.params;

    try {
        const resume = await Resume.findById(id);
        if (!resume) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Resume');
        }

        const jobs = await JobPosting.find({}).populate("company", "name logo");
        if (!jobs.length) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Jobs');
        }

        // Convert job postings into numerical vectors
        const recommendedJobs = jobs.map(job => {
            const jobSkills = job.skills.map(skill => skill.name.toLowerCase());
            
            // **Only include job-relevant skills in resume vector**
            const filteredResumeSkills = resume.skills
                .map(skill => skill.name.toLowerCase())
                .filter(skill => jobSkills.includes(skill)); 

            const jobVector = skillToVector(jobSkills, jobSkills);  // Use jobSkills as reference
            const resumeVector = skillToVector(filteredResumeSkills, jobSkills); // Ensure same length

            const similarity = ((cosineSimilarity(resumeVector, jobVector) || 0) * 100).toFixed(2);
            const matchedSkills =  resume.skills
                                        .map(skill => skill.name) 
                                        .filter(skill => jobSkills.includes(skill.toLowerCase())); 


            return { ...job.toObject(), similarity: similarity, matchedSkills: matchedSkills };
        }).filter(job => job.similarity > 0);

        // Sort and return top 10 jobs
        const sortedJobs = recommendedJobs
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10);

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: sortedJobs }, "Recommended Jobs");
    } catch (error) {
        console.error(error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER_ERROR, success: false }, "Error fetching jobs");
    }
};

export const getPredictedSalary = async (req, res) => {
    
}