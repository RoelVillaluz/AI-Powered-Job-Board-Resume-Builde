import express from "express"
import { getJobRecommendations, getRecommendedSkills, getResumeScore, getPredictedSalary, recommendCompanies } from "../controllers/aiController.js";

const router = express.Router();

router.get('/job-recommendations/:userId', getJobRecommendations)
router.get('/skill-recommendations/:userId', getRecommendedSkills)
router.get('/resume-score/:resumeId', getResumeScore)
router.get('/predicted-salary/:resumeId', getPredictedSalary)
router.get('/recommend-companies/:userId', recommendCompanies)

export default router