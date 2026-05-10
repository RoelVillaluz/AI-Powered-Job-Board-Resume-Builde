import express from "express";
import { authenticate } from "../../middleware/authentication/authenticate.js";
import { requireRole } from "../../middleware/authorization/roleAuthorization.js";
import { getJobPostingEmbeddingsController, generateJobPostingEmbeddingsController } from "../../controllers/jobPostings/jobPostingEmbeddingController.js";
import { embeddingLimiter } from "../../middleware/security.js";

const router = express.Router();

router.get('/:jobId/embeddings',
    authenticate,                             
    requireRole('employer'),   
    embeddingLimiter,  
    getJobPostingEmbeddingsController,             
)

router.post('/:jobId/embeddings',
    authenticate,                             
    requireRole('employer'),
    embeddingLimiter,                  
    generateJobPostingEmbeddingsController,
)

export default router;