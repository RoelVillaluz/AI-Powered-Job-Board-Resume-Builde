import express from "express"
import { authenticate } from "../../middleware/authentication/authenticate.js";
import { validate } from "../../middleware/validation.js";
import { resumeIdSchema, resumeJobIdSchema } from "../../validators/resumeValidator.js";
import { requireRole } from "../../middleware/authorization/roleAuthorization.js";
import { checkIfResumeExistsById } from "../../middleware/resourceCheck/resume.js";
import { enforceResumeOwnership } from "../../middleware/authorization/resumeAuthorization.js";
import { generateResumeJobMatchController, getResumeJobMatchController, getSingleResumeJobMatchController, getTopJobController } from "../../controllers/resumes/resumeJobMatchController.js";
import { generateMatchInsightController, getMatchInsightController } from "../../controllers/resumes/resumeJobMatchInsightController.js";
import { insightLimiter } from "../../middleware/security.js";

const router = express.Router();

router.get('/:resumeId/top-job',
    validate(resumeIdSchema, 'params'),
    authenticate,
    requireRole('jobseeker'),
    checkIfResumeExistsById,
    enforceResumeOwnership,
    getTopJobController
)

router.get('/:resumeId/job-matches/:jobId',
    validate(resumeJobIdSchema, 'params'), 
    authenticate,
    requireRole('jobseeker'),
    checkIfResumeExistsById,
    enforceResumeOwnership,
    getSingleResumeJobMatchController
)

router.get('/:resumeId/job-matches/:jobId/insight',
    validate(resumeJobIdSchema, 'params'),
    authenticate,
    requireRole('jobseeker'),
    checkIfResumeExistsById,
    enforceResumeOwnership,
    getMatchInsightController
)

router.post('/:resumeId/job-matches/:jobId/insight',
    validate(resumeJobIdSchema, 'params'),
    authenticate,
    insightLimiter,
    requireRole('jobseeker'),
    checkIfResumeExistsById,
    enforceResumeOwnership,
    generateMatchInsightController
)

router.get('/:resumeId/job-matches', 
    validate(resumeIdSchema, 'params'),
    authenticate,
    requireRole('jobseeker'),
    checkIfResumeExistsById,
    enforceResumeOwnership,
    getResumeJobMatchController
)

router.post('/:resumeId/job-matches', 
    validate(resumeIdSchema, 'params'),
    authenticate,
    requireRole('jobseeker'),
    checkIfResumeExistsById,
    enforceResumeOwnership,
    generateResumeJobMatchController
)

export default router;