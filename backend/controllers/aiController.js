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

        const jobs = await JobPosting.find({});
        if (!jobs.length) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Jobs');
        }

        const tokenizer = new natural.WordTokenizer();

        // Extract unique skills across all jobs
        const allSkills = Array.from(new Set(jobs.flatMap(job => job.skills.map(skill => skill.name.toLowerCase()))));

        // Convert jobs into numerical vectors
        const jobVectors = jobs.map(job => skillToVector(job.skills.map(skill => skill.name.toLowerCase()), allSkills));

        // Apply K-Means clustering
        const k = Math.min(5, jobs.length); // Ensure k isn't greater than job count
        const clusters = kmeans(jobVectors, k);

        // Convert resume skills into a vector
        const resumeSkills = resume.skills.map(skill => skill.name.toLowerCase());
        const resumeVector = skillToVector(resumeSkills, allSkills);

        // Determine the best-matching cluster for the resume
        let bestClusterIndex = 0;
        let bestSimilarity = 0;

        clusters.centroids.forEach((centroid, index) => {
            const similarity = cosineSimilarity(resumeVector, centroid) || 0;
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestClusterIndex = index;
            }
        });

        let recommendedJobs = jobs.map(job => {
            // Get only the skills that are present in both resume and job
            const sharedSkills = resumeSkills.filter(skill => job.skills.some(js => js.name.toLowerCase() === skill));
        
            if (sharedSkills.length === 0) return null; // Skip jobs with no shared skills
        
            // Create vectors based on only the shared skills
            const reducedJobVector = sharedSkills.map(skill => job.skills.some(js => js.name.toLowerCase() === skill) ? 1 : 0);
            const reducedResumeVector = sharedSkills.map(skill => resumeSkills.includes(skill) ? 1 : 0);
        
            const similarity = cosineSimilarity(reducedResumeVector, reducedJobVector) || 0;
        
            return { ...job.toObject(), similarity: similarity.toFixed(2) };
        }).filter(job => job !== null);
        
        // Filter and sort recommended jobs
        recommendedJobs = recommendedJobs
            .filter(job => job.similarity >= 0.5)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10);

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: recommendedJobs }, "Recommended Jobs");
    } catch (error) {
        console.error(error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER_ERROR, success: false }, "Error fetching jobs");
    }
};
