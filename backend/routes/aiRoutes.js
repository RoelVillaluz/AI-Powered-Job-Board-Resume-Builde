import express from "express"
import { getJobRecommendations, getRecommendedSkills } from "../controllers/aiController.js";

const router = express.Router();

router.get('/job-recommendations/:id', getJobRecommendations)
router.get('/skill-recommendations/:userId', getRecommendedSkills)

export default router