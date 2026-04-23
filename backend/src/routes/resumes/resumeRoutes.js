import express from "express"
import { createResume, deleteResume, getResume, getResumes, getResumesByUser, updateResume } from "../../controllers/resumes/resumeController.js"
import { getOrGenerateResumeEmbeddings, getAllResumeEmbeddings } from "../../controllers/resumes/resumeEmbeddingController.js"
import { getOrGenerateResumeScore } from "../../controllers/ai/aiResumeController.js"
import { authenticate } from "../../middleware/authentication/authenticate.js"
import { requireRole } from "../../middleware/authorization/roleAuthorization.js"
import { validate } from "../../middleware/validation.js"
import { createResumeSchema } from "../../../src/validators/resumeValidator.js"

const router = express.Router()

// Static routes first
router.get('/embeddings', getAllResumeEmbeddings)
router.get('/user/:userId', getResumesByUser)

// Dynamic routes next
router.get('/:resumeId/embeddings', authenticate, getOrGenerateResumeEmbeddings)
router.get('/:resumeId/score', authenticate, getOrGenerateResumeScore)
router.get('/:id', getResume)
router.get('/', getResumes)

router.post('/', 
    authenticate, 
    requireRole('jobseeker'), 
    validate(createResumeSchema, 'body'), 
    createResume
)

router.patch('/:id', updateResume)
router.delete('/:id', deleteResume)

export default router