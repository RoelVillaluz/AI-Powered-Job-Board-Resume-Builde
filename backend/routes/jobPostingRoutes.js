import express from "express"
import { getJobPostings, getJobPosting, createJobPosting, updateJobPosting, deleteJobPosting, toggleSaveJob } from "../controllers/jobPostingController.js"
import { authenticateUser } from "../controllers/userController.js"

const router = express.Router()

router.get('/', getJobPostings)
router.get('/:id', getJobPosting)

router.post('/', createJobPosting)
router.post('/:id/save-job', authenticateUser, toggleSaveJob)

router.patch('/:id', updateJobPosting)
router.delete('/:id', deleteJobPosting)

export default router