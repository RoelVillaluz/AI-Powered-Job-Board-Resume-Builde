import Resume from "../models/resumeModel.js";
import JobPosting from "../models/jobPostingModel.js";
import { STATUS_MESSAGES, sendResponse } from '../constants.js';
import natural from "natural";
import cosineSimilarity from "compute-cosine-similarity";

export const getJobRecommendations = async (req, res) => {
    const { id } = req.params;

    try {
        const resume = await Resume.findById(id)
        if (!resume) {
            return sendResponse(res, {...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'Resume')
        }

        const jobs = await JobPosting.find({})
        if (!jobs.length) {
            return sendResponse(res, {...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'Jobs')
        }

        const tokenizer = new natural.WordTokenizer() 

        const resumeText = resume.skills.map(skill => skill.name).join(" ").toLowerCase()
        const resumeTokens = tokenizer.tokenize(resumeText)

        const jobScores = jobs.map(job => {
            const jobText = job.skills.map(skill => skill.name).join(" ").toLowerCase()
            const jobTokens = tokenizer.tokenize(jobText)

            // term frequency vectors
            const allTokens = new Set([...resumeTokens, ...jobTokens])
            const resumeVector = [...allTokens].map(token => resumeTokens.includes(token) ? 1 : 0)
            const jobVector = [...allTokens].map(token => jobTokens.includes(token) ? 1 : 0)

            console.log("Resume Vector:", resumeVector); // Debugging
            console.log("Job Vector:", jobVector); // Debugging

            // compute similarity
            const similarity = cosineSimilarity(resumeVector, jobVector).toFixed(2) || 0
            return { ...job.toObject(), similarity }
        });

        const recommendedJobs = jobScores.sort((a, b) => b.similarity - a.similarity).slice(0, 10)

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: recommendedJobs }, "Recommended Jobs");
    } catch (error) {
        console.error(error)
    }
}