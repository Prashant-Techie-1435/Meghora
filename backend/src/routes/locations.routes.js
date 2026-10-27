import { Router } from 'express';
import { getSavedLocations, addSavedLocation, deleteSavedLocation } from '../controllers/locations.controller.js';
import { validateUserId } from '../middleware/validateRequest.js';

const router = Router();

router.get('/locations/:userId', validateUserId, getSavedLocations);
router.post('/locations/:userId', validateUserId, addSavedLocation);
router.delete('/locations/:userId/:locationId', validateUserId, deleteSavedLocation);

export default router;
