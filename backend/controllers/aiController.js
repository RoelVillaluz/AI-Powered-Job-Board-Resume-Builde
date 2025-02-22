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

        const resumeSkillSet = new Set(resume.skills.map(skill => skill.name.toLowerCase()))

        const jobScores = jobs.map(job => {
            if (!Array.isArray(job.skills) || job.skills.length === 0) return null;

            // extract only names from job.skills
            const jobSkillNames = job.skills.map(skill => skill.name.toLowerCase())

            // Only keep resume skills that match the job's required skills
            const relevantResumeSkills = [...resumeSkillSet].filter(skill => jobSkillNames.includes(skill))

            const resumeTokens = tokenizer.tokenize(relevantResumeSkills.join(" "));
            const jobTokens = tokenizer.tokenize(jobSkillNames.join(" "));

            const allTokens = new Set([...jobTokens]) // Only job tokens matter
            const resumeVector = [...allTokens].map(token => resumeTokens.includes(token) ? 1 : 0)
            const jobVector = [...allTokens].map(() => 1) // All job skills are relevant

            console.log("Resume tokens:", resumeTokens)
            console.log("Job tokens:", jobTokens)

            console.log("Resume Vector:", resumeVector); // Debugging
            console.log("Job Vector:", jobVector); // Debugging

            const similarity = cosineSimilarity(resumeVector, jobVector).toFixed(2) || 0
            return { ...job.toObject(), similarity }
        }).filter(Boolean); // Remove null values if any jobs had missing skills

        const recommendedJobs = jobScores.filter(job => job.similarity >= 0.5).sort((a, b) => b.similarity - a.similarity).slice(0, 10)

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: recommendedJobs }, "Recommended Jobs");
    } catch (error) {
        console.error(error)
    }
}