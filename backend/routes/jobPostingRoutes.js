import express from "express"
import { getJobPostings, getJobPosting, createJobPosting, updateJobPosting, deleteJobPosting } from "../controllers/jobPostingController.js"

const router = express.Router()

router.get('/', getJobPostings)
router.get('/:id', getJobPosting)

router.post('/', createJobPosting)

router.patch('/:id', updateJobPosting)
router.delete('/:id', deleteJobPosting)

export default router