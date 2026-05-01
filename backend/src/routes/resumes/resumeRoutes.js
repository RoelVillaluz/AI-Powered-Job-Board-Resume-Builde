import express from "express"
import { createResume, deleteResume, getResume, getResumes, getResumesByUser, updateResume } from "../../controllers/resumes/resumeController.js"
import { getOrGenerateResumeEmbeddings, getAllResumeEmbeddings } from "../../controllers/resumes/resumeEmbeddingController.js"
import { getResumeEmbeddingsControllerV2 } from "../../controllers/resumes/resumeEmbeddingControllerV2.js"
import { getOrGenerateResumeScore } from "../../controllers/ai/aiResumeController.js"
import { authenticate } from "../../middleware/authentication/authenticate.js"
import { requireRole } from "../../middleware/authorization/roleAuthorization.js"
import { checkIfResumeExistsById } from "../../middleware/resourceCheck/resume.js"
import { enforceResumeOwnership } from "../../middleware/authorization/resumeAuthorization.js"
import { validate } from "../../middleware/validation.js"
import { createResumeSchema, resumeIdSchema } from "../../../src/validators/resumeValidator.js"
import { embeddingLimiter } from "../../middleware/security.js"

const router = express.Router()

// Static routes first
router.get('/user/:userId', getResumesByUser)

// Dynamic routes next

// TODO: split into GET /:resumeId/embeddings (read-only) + POST /:resumeId/embeddings/generate (trigger pipeline)
// Current GET triggers pipeline as side effect — works correctly but violates HTTP semantics
router.get('/:resumeId/embeddings', 
    validate(resumeIdSchema, 'params'),
    authenticate,
    requireRole('jobseeker'),
    embeddingLimiter,
    checkIfResumeExistsById,
    enforceResumeOwnership,
    getOrGenerateResumeEmbeddings
)

// TODO: split into GET /:resumeId/score (read-only) + POST /:resumeId/score/generate (trigger pipeline)
// Current GET triggers pipeline as side effect — works correctly but violates HTTP semantics
router.get('/:resumeId/score',
    validate(resumeIdSchema, 'params'),
    authenticate,
    requireRole('jobseeker'),
    embeddingLimiter,
    checkIfResumeExistsById,
    enforceResumeOwnership,
    getOrGenerateResumeScore
)

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