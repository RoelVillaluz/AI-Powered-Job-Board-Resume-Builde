import express from 'express';
import * as IndustryController from '../../controllers/market/industryController'

const router = express.Router();

router.get('/:id/embeddings', IndustryController.getIndustryEmbeddingsById);
router.get('/:id', IndustryController.getIndustryById);
router.get('/:name', IndustryController.getIndustryByName);
router.get('/', IndustryController.getAllIndustries);

router.post('/', IndustryController.createIndustry);

router.patch('/:id', IndustryController.updateIndustry);

router.delete('/:id', IndustryController.deleteIndustry);

export default router;