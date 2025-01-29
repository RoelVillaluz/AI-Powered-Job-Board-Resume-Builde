import express from "express"
import { getJobPostings, getJobPosting, createJobPosting } from "../controllers/jobPostingController.js"

const router = express.Router()

router.get('/', getJobPostings)
router.get('/:id', getJobPosting)
router.post('/', createJobPosting)

export default router