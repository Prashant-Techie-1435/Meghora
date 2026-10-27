import { Router } from 'express';
import { getAlerts } from '../controllers/alerts.controller.js';
import { validateCityQuery } from '../middleware/validateRequest.js';

const router = Router();

router.get('/alerts', validateCityQuery, getAlerts);

export default router;
