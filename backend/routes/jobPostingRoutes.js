import express from "express"
import { validate } from "../middleware/validation.js"
import { createJobPostingSchema } from "../validators/jobPostingValidators.js"
import { getJobPostings, getJobPosting, createJobPosting, updateJobPosting, deleteJobPosting } from "../controllers/jobPostingController.js"
import { authenticate } from "../middleware/authentication/authenticate.js"
import { authorizeJobPosting } from "../middleware/authorization/jobPosting.js"

const router = express.Router()

router.get('/', getJobPostings)
router.get('/:id', getJobPosting)

router.post('/', 
    authenticate,
    authorizeJobPosting,
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