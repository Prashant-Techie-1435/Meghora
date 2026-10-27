import { WeatherAlert } from '../models/index.js';

export const getAlerts = async (req, res, next) => {
  try {
    const city = (req.query.city || 'Mumbai').trim();
    const now = new Date();

    const alerts = await WeatherAlert.find({
      city: new RegExp(`^${city}$`, 'i'),
      $or: [
        { effective_to: { $exists: false } },
        { effective_to: null },
        { effective_to: { $gt: now } },
      ],
    }).sort({ createdAt: -1 });

    // Sort by official severity level
    const severityRank = { severe: 1, warning: 2, watch: 3, advisory: 4 };
    const sortedAlerts = alerts.sort(
      (a, b) => (severityRank[a.severity] || 5) - (severityRank[b.severity] || 5)
    );

    res.status(200).json({
      success: true,
      city,
      count: sortedAlerts.length,
      alerts: sortedAlerts.map((a) => a.toJSON()),
      source: 'Verified Official Alerts Registry',
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getAlerts,
};
