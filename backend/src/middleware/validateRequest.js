/**
 * Request validation middleware helpers
 */

// Validate city query parameter
export const validateCityQuery = (req, res, next) => {
  const city = req.query.city;
  if (!city || typeof city !== 'string' || city.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'City parameter is required and must not be empty.',
        status: 400,
      },
    });
  }
  req.query.city = city.trim();
  next();
};

// Validate user ID parameter
export const validateUserId = (req, res, next) => {
  const { userId } = req.params;
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid userId parameter.',
        status: 400,
      },
    });
  }
  req.params.userId = userId.trim();
  next();
};

// Validate preferences body
export const validatePreferences = (req, res, next) => {
  const { profiles, preferred_city, temperature_unit } = req.body;

  if (profiles !== undefined && !Array.isArray(profiles)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Profiles must be an array of profile keys.',
        status: 400,
      },
    });
  }

  if (temperature_unit !== undefined && !['celsius', 'fahrenheit'].includes(temperature_unit)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'temperature_unit must be either "celsius" or "fahrenheit".',
        status: 400,
      },
    });
  }

  if (preferred_city !== undefined && (typeof preferred_city !== 'string' || preferred_city.trim().length === 0)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'preferred_city must be a non-empty string.',
        status: 400,
      },
    });
  }

  next();
};
