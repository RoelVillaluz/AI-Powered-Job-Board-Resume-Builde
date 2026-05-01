import express from "express"
import { getResumeEmbeddingsControllerV2 } from "../../controllers/resumes/resumeEmbeddingControllerV2.js"
import { authenticate } from "../../middleware/authentication/authenticate.js"
import { requireRole } from "../../middleware/authorization/roleAuthorization.js"
import { checkIfResumeExistsById } from "../../middleware/resourceCheck/resume.js"
import { enforceResumeOwnership } from "../../middleware/authorization/resumeAuthorization.js"
import { validate } from "../../middleware/validation.js"
import { resumeIdSchema } from "../../../src/validators/resumeValidator.js"
import { embeddingLimiter } from "../../middleware/security.js"

const router = express.Router()

router.get('/:resumeId/embeddings',
    validate(resumeIdSchema, 'params'),
    authenticate,
    requireRole('jobseeker'),
    embeddingLimiter,
    checkIfResumeExistsById,
    enforceResumeOwnership,
    getResumeEmbeddingsControllerV2
)

export default router