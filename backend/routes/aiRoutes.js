import express from "express"
import { getJobRecommendations } from "../controllers/aiController.js";

const router = express.Router();

router.get('/job-recommendations/:id', getJobRecommendations)

export default router