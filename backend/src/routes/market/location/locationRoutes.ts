import express from "express";
import * as LocationController from "../../../controllers/market/location/locationController.js";
import { authenticate } from "../../../middleware/authentication/authenticate.js";
import { requireRole } from "../../../middleware/authorization/roleAuthorization.js";
import { validate } from "../../../middleware/validation.js";
import { createLocationSchema } from "../../../validators/locationValidator.js";

const router = express.Router();

router.get('/search/:name', LocationController.searchLocationsByName); // move this UP
router.get('/:id/metrics');
router.get('/:id', LocationController.getLocationByIdController);
router.get('/:name', LocationController.getLocationsBName);

router.post('/', authenticate, requireRole('admin'), validate(createLocationSchema, 'body'), LocationController.createLocation);

router.patch('/:id', authenticate, requireRole('admin'), LocationController.updateLocation);


export default router