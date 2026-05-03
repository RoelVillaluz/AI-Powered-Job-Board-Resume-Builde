import express from "express";
import * as LocationEmbeddingController from '../../../controllers/market/location/locationEmbeddingsController.js'

const router = express.Router();

router.get('/:id/embeddings', LocationEmbeddingController.getLocationEmbeddingControllerV2);

router.post('/:id/embeddings', LocationEmbeddingController.generateLocationEmbeddingControllerV2);

export default router;