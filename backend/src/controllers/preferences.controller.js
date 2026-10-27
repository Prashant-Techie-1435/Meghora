import { UserPreference } from '../models/index.js';

export const getPreferences = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'userId is required.', status: 400 },
      });
    }

    const doc = await UserPreference.findOne({ userId: userId.trim() });

    if (!doc) {
      // Default preferences if record doesn't exist yet
      const defaults = {
        userId: userId.trim(),
        user_id: userId.trim(),
        profiles: ['health', 'commuter', 'outdoor_fitness'],
        preferred_city: 'Mumbai',
        city: 'Mumbai',
        temperature_unit: 'celsius',
        unit: 'celsius',
        language: 'en',
        categories: ['health', 'commute', 'fitness'],
        is_default: true,
      };

      return res.status(200).json({
        success: true,
        data: defaults,
      });
    }

    res.status(200).json({
      success: true,
      data: doc.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { profiles, preferred_city, city, temperature_unit, unit, language, categories } = req.body;

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'userId is required.', status: 400 },
      });
    }

    const tempUnit = temperature_unit || unit;
    if (tempUnit && !['celsius', 'fahrenheit'].includes(tempUnit)) {
      return res.status(400).json({
        success: false,
        error: { message: 'temperature_unit must be either celsius or fahrenheit.', status: 400 },
      });
    }

    const updateData = {};
    if (profiles && Array.isArray(profiles)) updateData.profiles = profiles;
    if (preferred_city || city) updateData.preferred_city = (preferred_city || city).trim();
    if (tempUnit) updateData.temperature_unit = tempUnit;
    if (language) updateData.language = language.trim();
    if (categories && Array.isArray(categories)) updateData.categories = categories;

    const updated = await UserPreference.findOneAndUpdate(
      { userId: userId.trim() },
      { $set: updateData },
      {
        returnDocument: 'after',
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: updated.toJSON(),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: { message: err.message, status: 400 },
      });
    }
    next(err);
  }
};

export default {
  getPreferences,
  updatePreferences,
};
