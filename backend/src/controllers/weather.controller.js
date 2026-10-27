import { getWeatherData, searchCities } from '../services/weather.service.js';

export const getWeather = async (req, res, next) => {
  try {
    const city = req.query.city || 'Mumbai';
    const weather = await getWeatherData(city);

    res.status(200).json({
      success: true,
      data: weather,
    });
  } catch (err) {
    next(err);
  }
};

export const searchCitySuggestions = async (req, res, next) => {
  try {
    const query = req.query.q || '';
    const results = await searchCities(query);
    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};
