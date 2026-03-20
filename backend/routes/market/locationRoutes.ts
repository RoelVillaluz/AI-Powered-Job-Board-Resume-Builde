import express from "express";
import * as LocationController from "../../controllers/market/locationController";
import { authenticate } from "../../middleware/authentication/authenticate";
import { requireRole } from "../../middleware/authorization/roleAuthorization";
import { validate } from "../../middleware/validation";
import { createLocationSchema } from "../../validators/locationValidator";

const router = express.Router();

router.get('/search/:name', LocationController.searchLocationsByName); // move this UP
router.get('/:id/embeddings', LocationController.getLocationEmbeddingsById); // before generic :id
router.get('/:id/metrics');
router.get('/:id', LocationController.getLocationByIdController);
router.get('/:name', LocationController.getLocationsBName);

router.post('/', authenticate, requireRole('admin'), validate(createLocationSchema, 'body'), LocationController.createLocation);

router.patch('/:id', authenticate, requireRole('admin'), LocationController.updateLocation);


export default router