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

        // Get jobs from the best cluster
        const clusterJobIndices = clusters.clusters
            .map((cluster, index) => ({ index, cluster }))
            .filter(({ cluster }) => cluster === bestClusterIndex)
            .map(({ index }) => index);

        let recommendedJobs = clusterJobIndices.map(index => {
            const job = jobs[index];
            const jobVector = jobVectors[index];
            const similarity = cosineSimilarity(resumeVector, jobVector).toFixed(2) || 0;

            return { ...job.toObject(), similarity };
        });

        // Filter jobs by similarity threshold and sort
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
