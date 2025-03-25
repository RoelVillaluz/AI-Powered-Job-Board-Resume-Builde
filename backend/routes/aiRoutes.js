import express from "express"
import { getJobRecommendations, getRecommendedSkills, getResumeScore } from "../controllers/aiController.js";

const router = express.Router();

router.get('/job-recommendations/:id', getJobRecommendations)
router.get('/skill-recommendations/:userId', getRecommendedSkills)
router.get('/resume-score/:resumeId', getResumeScore)

export default router