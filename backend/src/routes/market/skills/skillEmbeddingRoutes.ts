import express from "express"
import * as SkillEmbeddingsController from '../../../controllers/market/skills/skillEmbeddingsController.js'
const router = express.Router();

router.get('/:id/embeddings', SkillEmbeddingsController.getSkillEmbeddingControllerV2);

router.post('/:id/embeddings', SkillEmbeddingsController.generateSkillEmbeddingControllerV2);


export default router;