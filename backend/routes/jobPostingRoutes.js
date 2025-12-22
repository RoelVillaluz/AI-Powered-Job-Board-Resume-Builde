import express from "express"
import { validate } from "../middleware/validation.js"
import { createJobPostingSchema } from "../validators/jobPostingValidators.js"
import { getJobPostings, getJobPosting, createJobPosting, updateJobPosting, deleteJobPosting } from "../controllers/jobPostingController.js"

const router = express.Router()

router.get('/', getJobPostings)
router.get('/:id', getJobPosting)

router.post('/', 
    validate(createJobPostingSchema, 'body'), // Validate job posting format
    createJobPosting
)

router.patch('/:id', updateJobPosting)
router.delete('/:id', deleteJobPosting)

export default router