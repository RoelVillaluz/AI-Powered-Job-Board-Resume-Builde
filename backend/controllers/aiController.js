import Resume from "../models/resumes/resumeModel.js";
import JobPosting from "../models/jobPostings/jobPostingModel.js";
import { STATUS_MESSAGES, sendResponse } from '../constants.js';
import natural from "natural";
import { kmeans } from "ml-kmeans";
import cosineSimilarity from "compute-cosine-similarity";
import { spawn } from "child_process";
import { json } from "stream/consumers";
import User from "../models/UserModel.js";

// Helper function: Convert skills into numerical vectors
const skillToVector = (skills, allSkills) => {
    return allSkills.map(skill => (skills.includes(skill) ? 1 : 0));
};

export const getJobRecommendations = async (req, res) => {
    try {
        // Get user
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, "User")
        }

        const { jobType, experienceLevel, salary } = user.preferences;

        // Get resumes
        const resumes = await Resume.find({ user: userId })
        if (!resumes) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, "Resumes")
        }

        const resumeSkills = [
            ...new Set(resumes.flatMap(resume => resume.skills.map(skill => skill.name.toLowerCase())))
        ]

        // Get jobs 
        const jobs = await JobPosting.find({ _id: {$nin: [...user.savedJobs, ...user.appliedJobs] } }).populate("company", "name logo industry");
        if (!jobs.length) {
            return sendResponse(res, { ...STATUS.ERROR.NOT_FOUND, success: false }, 'Jobs')
        }

        // Compute job recommendations
        const recommendedJobs = jobs.map(job => {
            const jobSkills = job.skills.map(skill => skill.name.toLowerCase())
            
            const matchedSkills = resumeSkills.filter(skill => jobSkills.includes(skill))
            
            const jobVector = skillToVector(jobSkills, jobSkills)
            const resumeVector = skillToVector(resumeSkills, jobSkills)

            let similarity = Math.round((cosineSimilarity(jobVector, resumeVector) || 0) * 100)

            // **Boost similarity score based on preference matches** 
            if (job.type === jobType) similarity += 10;  
            if (job.experienceLevel === experienceLevel) similarity += 10;  
            if (job.salary >= salary) similarity += 5;  

            return { ...job.toObject(), similarity, matchedSkills };

        }).filter(job => job.similarity >= 40) 
            .sort((a, b) => b.similarity - a.similarity) 
            .slice(0, 10);

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: recommendedJobs }, "Recommended Jobs");

    } catch (error) {
        console.error(error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER_ERROR, success: false }, "Error");
    }
}

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

export const getResumeScore = async (req, res) => {
    try {
        const { resumeId } = req.params;

        if (!resumeId) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND }, "Resume")
        }

        const resume = await Resume.findById(resumeId)
        if (!resume) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND }, "Resume")
        }

        if (resume.score !== 0) {
            return res.status(200).json({ score: resume.score })
        }

        const pythonProcess = spawn("py", ["backend/python_scripts/resume_scorer.py", "score", resumeId])

        let result = ""
        let errorOutput = ""

        pythonProcess.stdout.on("data", (data) => {
            result += data.toString()
        })

        pythonProcess.stderr.on("data", (data) => {
            errorOutput += data.toString()
        })

        pythonProcess.on("close", async (code) => {
            if (code === 0) {
                try {
                    const jsonResponse = JSON.parse(result)

                    // update resume score
                    resume.score = jsonResponse.score
                    await resume.save()

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

export const getPredictedSalary = async (req, res) => {
    try {
        const { resumeId } = req.params;

        if (!resumeId) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND }, "Resume")
        }

        const resume = await Resume.findByIdAndUpdate(resumeId)
        if (!resume) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND }, "Resume")
        }

        if (resume.predictedSalary !== 0) {
            return res.status(200).json({ predictedSalary: resume.predictedSalary })
        }

        const pythonProcess = spawn("py", ["backend/python_scripts/salary_predictor.py", resumeId])

        let result = ""
        let errorOutput = ""

        pythonProcess.stdout.on("data", (data) => {
            result += data.toString()
        })

        pythonProcess.stderr.on("data", (data) => {
            errorOutput += data.toString()
        })

        pythonProcess.on("close", async (code) => {
            if (code === 0) {
                try {
                    const jsonResponse = JSON.parse(result)
                    // update resume predicted salary

                    resume.predictedSalary = jsonResponse.predictedSalary
                    await resume.save();

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

export const recommendCompanies = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne({ _id: userId });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Start the Python process
        const pythonProcess = spawn("py", ["backend/python_scripts/company_recommender.py", userId]);

        let result = "";
        let errorOutput = "";

        // Listen for data from stdout
        pythonProcess.stdout.on("data", (data) => {
            result += data.toString();
            console.log("Python stdout:", data.toString());  // Debug logging stdout
        });

        // Listen for errors from stderr
        pythonProcess.stderr.on("data", (data) => {
            errorOutput += data.toString();
            console.error("Python stderr:", data.toString());  // Debug logging stderr
        });

        // When the Python process is finished
        pythonProcess.on("close", () => {
            if (errorOutput) {
                console.error("Python error output:", errorOutput); // If there's any error output, log it
            }

            try {
                // Parse the Python result into JSON
                const jsonResponse = JSON.parse(result);
                res.status(200).json(jsonResponse);  // Send the parsed result as the response
            } catch (error) {
                console.error("Error parsing Python result:", error.message);
                res.status(500).json({ error: "Failed to parse Python response", details: error.message });
            }
        });
    } catch (error) {
        console.error("Server error:", error.message);
        return res.status(500).json({ error: "Server error", details: error.message });
    }
};

export const compareResumeAndJob = async (req, res) => {
    try {
        const { resumeId, jobId } = req.params;
        console.log(`Received resumeId: ${resumeId}, jobId: ${jobId}`);

        // Ensure that resumeId and jobId are both provided
        if (!resumeId || !jobId) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, "Resume or Job");
        }

        // Fetch resume from the database
        const resume = await Resume.findById(resumeId);
        if (!resume) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, "Resume");
        }

        // Fetch job from the database
        const job = await JobPosting.findById(jobId);
        if (!job) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, "Job");
        }

        console.log(`Starting Python process for resume ${resumeId} and job ${jobId}`);

        // Spawn Python script to compare resume and job
        const pythonProcess = spawn("py", [
            "backend/python_scripts/resume_scorer.py", 
            "compare", 
            resumeId, 
            jobId
        ]);

        let result = "";
        let errorOutput = "";

        pythonProcess.stdout.on("data", (data) => {
            const output = data.toString();
            console.log("Python stdout:", output);
            result += output;
        });

        pythonProcess.stderr.on("data", (data) => {
            const error = data.toString();
            console.error("Python stderr:", error);
            errorOutput += error;
        });

        pythonProcess.on("error", (error) => {
            // This catches spawn errors (e.g., Python not found)
            console.error("Failed to start Python process:", error);
            return res.status(500).json({ 
                error: "Failed to start Python process", 
                details: error.message,
                hint: "Make sure Python is installed and 'py' command is available"
            });
        });

        pythonProcess.on("close", async (code) => {
            console.log(`Python process exited with code ${code}`);
            console.log(`Result length: ${result.length}`);
            console.log(`Error output length: ${errorOutput.length}`);

            if (code !== 0) {
                console.error("Python script failed with error:", errorOutput);
                return res.status(500).json({ 
                    error: "Python script error", 
                    details: errorOutput || "No error output captured",
                    exitCode: code,
                    stdout: result || "No output captured"
                });
            }

            if (!result || result.trim() === "") {
                console.error("Python script returned empty result");
                return res.status(500).json({ 
                    error: "Python script returned empty result",
                    details: errorOutput || "No error details",
                    exitCode: code
                });
            }

            try {
                // Parse Python response
                console.log("Attempting to parse Python response:", result);
                const jsonResponse = JSON.parse(result);
                
                // Check if the response contains an error
                if (jsonResponse.error) {
                    console.error("Python script returned error:", jsonResponse);
                    return res.status(500).json(jsonResponse);
                }
                
                console.log("Successfully parsed Python response");
                res.status(200).json(jsonResponse);
            } catch (error) {
                console.error("Failed to parse Python response:", error);
                console.error("Raw output:", result);
                res.status(500).json({ 
                    error: "Failed to parse Python response", 
                    details: error.message,
                    rawOutput: result,
                    stderr: errorOutput
                });
            }
        });

    } catch (error) {
        console.error("Unexpected error in compareResumeAndJob:", error);
        return sendResponse(res, { 
            ...STATUS_MESSAGES.ERROR.SERVER_ERROR, 
            success: false,
            details: error.message
        });
    }
};