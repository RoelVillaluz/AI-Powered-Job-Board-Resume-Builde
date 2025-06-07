import express from "express"
import { getApplications, getApplicationById, getApplicationsByUser } from "../controllers/applicationController.js";

const router = express.Router();

router.get('/', getApplications)
router.get('/:id', getApplicationById)
router.get('/user/:userId', getApplicationsByUser)

export default router