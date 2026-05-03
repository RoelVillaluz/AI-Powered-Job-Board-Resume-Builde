import express from "express";
import * as IndustryEmbeddingController from '../../../controllers/market/industry/industryEmbeddingController.js'

const router = express.Router();

router.get('/:id/embeddings', IndustryEmbeddingController.getIndustryEmbeddingControllerV2);

router.post('/:id/embeddings', IndustryEmbeddingController.generateIndustryEmbeddingControllerV2);

export default router;