import express from "express"
import { authenticate } from "../../middleware/authentication/authenticate.js"
import { requireRole } from "../../middleware/authorization/roleAuthorization.js"
import { checkIfResumeExistsById } from "../../middleware/resourceCheck/resume.js"
import { enforceResumeOwnership } from "../../middleware/authorization/resumeAuthorization.js"
import { validate } from "../../middleware/validation.js"
import { resumeIdSchema } from "../../validators/resumeValidator.js"
import { embeddingLimiter } from "../../middleware/security.js"
import { getResumeSalaryPredictionController, generateResumeSalaryPredictionController } from "../../controllers/resumes/resumeSalaryPredictionController.js"

const router = express.Router()

router.get('/:resumeId/salary-prediction', 
    validate(resumeIdSchema, 'params'),
    authenticate,
    requireRole('jobseeker'),
    checkIfResumeExistsById,
    enforceResumeOwnership,
    getResumeSalaryPredictionController
)

router.post('/:resumeId/salary-prediction', 
    validate(resumeIdSchema, 'params'),
    authenticate,
    requireRole('jobseeker'),
    checkIfResumeExistsById,
    enforceResumeOwnership,
    generateResumeSalaryPredictionController
)

export default router