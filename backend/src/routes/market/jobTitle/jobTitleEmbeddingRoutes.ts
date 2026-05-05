import express from "express";
import * as JobTitleEmbeddingController from '../../../controllers/market/jobTitle/jobTitleEmbeddingsController.js'

const router = express.Router();

router.get('/:id/embeddings', JobTitleEmbeddingController.getJobTitleEmbeddingControllerV2);

router.post('/:id/embeddings', JobTitleEmbeddingController.generateJobTitleEmbeddingControllerV2);

export default router;