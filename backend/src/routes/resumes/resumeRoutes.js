import express from "express"
import { createResume, deleteResume, getResume, getResumes, getResumesByUser, updateResume } from "../../controllers/resumes/resumeController.js"
import { authenticate } from "../../middleware/authentication/authenticate.js"
import { requireRole } from "../../middleware/authorization/roleAuthorization.js"
import { checkIfResumeExistsById } from "../../middleware/resourceCheck/resume.js"
import { enforceResumeOwnership } from "../../middleware/authorization/resumeAuthorization.js"
import { validate } from "../../middleware/validation.js"
import { createResumeSchema, resumeIdSchema } from "../../../src/validators/resumeValidator.js"

const router = express.Router()

// Static routes first
router.get('/user/:userId', getResumesByUser)

router.get('/:id', getResume)
router.get('/', getResumes)

router.post('/', 
    authenticate, 
    requireRole('jobseeker'), 
    validate(createResumeSchema, 'body'), 
    createResume
)

router.patch('/:id', 
    validate(resumeIdSchema, 'params'),
    authenticate,
    requireRole('jobseeker'),
    checkIfResumeExistsById,
    enforceResumeOwnership,
    updateResume
)

router.delete('/:id', 
    validate(resumeIdSchema, 'params'),
    authenticate,
    requireRole('jobseeker'),
    checkIfResumeExistsById,
    enforceResumeOwnership,
    deleteResume
)

export default router