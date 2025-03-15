import Resume from "../models/resumeModel.js";
import JobPosting from "../models/jobPostingModel.js";
import { STATUS_MESSAGES, sendResponse } from '../constants.js';
import natural from "natural";
import { kmeans } from "ml-kmeans";
import cosineSimilarity from "compute-cosine-similarity";
import { spawn } from "child_process";

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

            const similarity = Math.round((cosineSimilarity(resumeVector, jobVector) || 0) * 100);
            const matchedSkills =  resume.skills
                                        .map(skill => skill.name) 
                                        .filter(skill => jobSkills.includes(skill.toLowerCase())); 


            return { ...job.toObject(), similarity: similarity, matchedSkills: matchedSkills };
        }).filter(job => job.similarity >= 50);

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

export const getRecommendedSkills = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND }, "User")
        }
        const pythonProcess = spawn("py", ["backend/python_scripts/skills_recommender.py", userId]);

        let result = ""
        let errorOutput = ""

        pythonProcess.stdout.on("data", (data) => {
            result += data.toString()
        })

        pythonProcess.stderr.on("data", (data) => {
            errorOutput += data.toString()
        })

        pythonProcess.on("close", (code) => {
            if (code === 0) {
                try {
                    const jsonResponse = JSON.parse(result);
                    res.status(200).json(jsonResponse)
                } catch (error) {
                    res.status(500).json({ error: "Failed to parse Python response", details: error.message });
                }
            } else {
                res.status(500).json({ error: "Python script error", details: errorOutput });
            }
        })
    } catch (error) {
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER_ERROR, success: false })
    }
}