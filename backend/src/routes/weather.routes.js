import { Router } from 'express';
import { getWeather, searchCitySuggestions } from '../controllers/weather.controller.js';
import { validateCityQuery } from '../middleware/validateRequest.js';

const router = Router();

router.get('/weather/search', searchCitySuggestions);
router.get('/weather', validateCityQuery, getWeather);

export default router;
