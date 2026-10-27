import { getWeatherData } from '../services/weather.service.js';
import { rankPersonalizedCards, attachAlertsToDashboard, PROFILES } from '../services/personalization.service.js';
import { UserPreference, WeatherAlert } from '../models/index.js';

export const getHomepageData = async (req, res, next) => {
  try {
    const userId = (req.query.userId || 'demo-user').trim();
    let city = req.query.city;

    // 1. Fetch user preferences from MongoDB
    const prefDoc = await UserPreference.findOne({ userId });

    let userPreferences = {
      userId,
      user_id: userId,
      profiles: ['health', 'commuter', 'outdoor_fitness'],
      preferred_city: 'Mumbai',
      temperature_unit: 'celsius',
      language: 'en',
    };

    if (prefDoc) {
      userPreferences = prefDoc.toJSON();
    }

    // Determine target city
    const targetCity = city && city.trim() ? city.trim() : userPreferences.preferred_city || 'Mumbai';

    // 2. Fetch weather telemetry
    const weather = await getWeatherData(targetCity);

    // 3. Fetch active verified alerts from MongoDB
    const now = new Date();
    const alertDocs = await WeatherAlert.find({
      city: new RegExp(`^${targetCity}$`, 'i'),
      $or: [
        { effective_to: { $exists: false } },
        { effective_to: null },
        { effective_to: { $gt: now } },
      ],
    }).sort({ createdAt: -1 });

    const severityRank = { severe: 1, warning: 2, watch: 3, advisory: 4 };
    const sortedAlerts = alertDocs
      .map((a) => a.toJSON())
      .sort((a, b) => (severityRank[a.severity] || 5) - (severityRank[b.severity] || 5));

    // 4. Rank personalized cards using the 8-profile scoring algorithm
    const rankedCards = rankPersonalizedCards(weather, userPreferences.profiles);

    // 5. Attach pinned severe alerts
    const dashboard = attachAlertsToDashboard(rankedCards, sortedAlerts);

    res.status(200).json({
      success: true,
      meta: {
        timestamp: new Date().toISOString(),
        targetCity,
        userId,
        profilesAvailable: PROFILES,
        activeProfiles: userPreferences.profiles,
        temperatureUnit: userPreferences.temperature_unit,
      },
      data: {
        weather,
        severeAlerts: dashboard.severeAlerts,
        personalizedCards: dashboard.personalizedCards,
      },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getHomepageData,
};
