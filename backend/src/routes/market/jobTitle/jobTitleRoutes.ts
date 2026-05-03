import express from "express"
import { authenticate } from "../../../middleware/authentication/authenticate.js";
import { requireRole } from "../../../middleware/authorization/roleAuthorization.js";
import { validate } from "../../../middleware/validation.js";
import * as JobTitleController from "../../../controllers/market/jobTitle/jobTitleController.js"
import { createJobTitleSchema, updateJobTitleSchema } from "../../../validators/jobTitleValidator.js";
import { checkIfJobTitleExistsById } from "../../../middleware/resourceCheck/jobTitle.js";

const router = express.Router();

// Search — public, used for autocomplete
router.get('/search/:title', JobTitleController.searchJobTitlesByName);

// Filter by industry — public
router.get('/industry/:industry', JobTitleController.getJobTitlesByIndustry);

// Single job title
router.get('/:id/metrics', authenticate, checkIfJobTitleExistsById, JobTitleController.getJobTitleMetrics);
router.get('/:id/embeddings', checkIfJobTitleExistsById, JobTitleController.getOrGenerateJobTitleEmbedding);
router.get('/:id/top-skills', checkIfJobTitleExistsById, JobTitleController.getJobTitleTopSkills);
router.get('/:id', checkIfJobTitleExistsById, JobTitleController.getJobTitleById);

// Admin only
router.post('/', authenticate, requireRole('admin'), validate(createJobTitleSchema), JobTitleController.createJobTitle);
router.patch('/:id', authenticate, requireRole('admin'), checkIfJobTitleExistsById, validate(updateJobTitleSchema), JobTitleController.updateJobTitle);
router.delete('/:id', authenticate, requireRole('admin'), checkIfJobTitleExistsById, JobTitleController.deleteJobTitle);

export default router