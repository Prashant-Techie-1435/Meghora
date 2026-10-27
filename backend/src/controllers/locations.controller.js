import mongoose from 'mongoose';
import { SavedLocation } from '../models/index.js';
import { geocodeCity } from '../services/weather.service.js';

export const getSavedLocations = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'userId is required.', status: 400 },
      });
    }

    const locations = await SavedLocation.find({ userId: userId.trim() })
      .sort({ is_favorite: -1, createdAt: 1 });

    res.status(200).json({
      success: true,
      data: locations.map((loc) => loc.toJSON()),
    });
  } catch (err) {
    next(err);
  }
};

export const addSavedLocation = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const cityNameInput = req.body.city_name || req.body.city;
    const isFavorite = Boolean(req.body.is_favorite);

    if (!cityNameInput || typeof cityNameInput !== 'string' || cityNameInput.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'city_name is required.', status: 400 },
      });
    }

    // Resolve geographic coordinates
    const geo = await geocodeCity(cityNameInput.trim());
    if (!geo) {
      return res.status(404).json({
        success: false,
        error: { message: `Unable to locate "${cityNameInput}". Check spelling.`, status: 404 },
      });
    }

    // Upsert location for user to avoid duplicate entries
    const saved = await SavedLocation.findOneAndUpdate(
      {
        userId: userId.trim(),
        city_name: new RegExp(`^${geo.name}$`, 'i'),
      },
      {
        $set: {
          userId: userId.trim(),
          city_name: geo.name,
          state: geo.admin1 || '',
          country: geo.country || 'India',
          latitude: geo.latitude,
          longitude: geo.longitude,
          is_favorite: isFavorite,
        },
      },
      {
        returnDocument: 'after',
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Location saved successfully',
      data: saved.toJSON(),
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

export const deleteSavedLocation = async (req, res, next) => {
  try {
    const { userId, locationId } = req.params;

    if (!userId || !locationId) {
      return res.status(400).json({
        success: false,
        error: { message: 'userId and locationId are required.', status: 400 },
      });
    }

    // Support deletion by MongoDB _id OR by city name string
    const deleteFilter = {
      userId: userId.trim(),
      ...(mongoose.Types.ObjectId.isValid(locationId)
        ? { $or: [{ _id: locationId }, { city_name: new RegExp(`^${locationId}$`, 'i') }] }
        : { city_name: new RegExp(`^${locationId}$`, 'i') }),
    };

    const result = await SavedLocation.deleteMany(deleteFilter);

    res.status(200).json({
      success: true,
      message: 'Location removed from favorites',
      affectedRows: result.deletedCount || 0,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getSavedLocations,
  addSavedLocation,
  deleteSavedLocation,
};
