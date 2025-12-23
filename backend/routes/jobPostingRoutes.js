import express from "express"
import { validate } from "../middleware/validation.js"
import { createJobPostingSchema } from "../validators/jobPostingValidators.js"
import { getJobPostings, getJobPosting, createJobPosting, updateJobPosting, deleteJobPosting } from "../controllers/jobPostingController.js"
import { authenticate } from "../middleware/authentication/authenticate.js"

const router = express.Router()

router.get('/', getJobPostings)
router.get('/:id', getJobPosting)

router.post('/', 
    authenticate,
    validate(createJobPostingSchema, 'body'), // Validate job posting format
    createJobPosting
)

router.patch('/:id', 
    authenticate,
    updateJobPosting
)

router.delete('/:id', 
    authenticate,
    deleteJobPosting
)

export default router