import express from "express"
import { validate } from "../../middleware/validation.js"
import { createJobPostingRequestSchema, createJobPostingSchema } from "../../validators/jobPostingValidators.js"
import { getJobPostings, getJobPosting, createJobPosting, updateJobPosting, deleteJobPosting } from "../../controllers/jobPostings/jobPostingController.js"
import { getJobCandidates } from "../../controllers/jobPostings/jobPostingCandidatesController.js"
import { authenticate } from "../../middleware/authentication/authenticate.js"
import { requireRole } from "../../middleware/authorization/roleAuthorization.js"
import { checkIfJobPostingExistsById } from "../../middleware/resourceCheck/jobPosting.js"
import { enforceJobPostingOwnership } from "../../middleware/authorization/jobPostingAuthorization.js"

const router = express.Router()

router.get('/', getJobPostings)
router.get('/:id', getJobPosting)

router.post('/', 
    authenticate,                             // 1. Check if user is logged in
    requireRole('employer'),                  // 2. Check if user is employer
    validate(createJobPostingRequestSchema, 'body'), // 3. Validate job posting format
    createJobPosting
)

router.patch('/:id', 
    authenticate,
    validate(createJobPostingSchema, 'body'),
    updateJobPosting
)

router.delete('/:id', 
    authenticate,
    deleteJobPosting
)

router.get('/:jobId/candidates',
    authenticate,
    requireRole('employer'),
    checkIfJobPostingExistsById,
    enforceJobPostingOwnership,
    getJobCandidates
)

export default router