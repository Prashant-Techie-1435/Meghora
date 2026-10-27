import { UserPreference, SavedLocation, WeatherAlert } from '../models/index.js';

export async function seedInitialData() {
  try {
    // 1. Seed Demo User Preferences if not exists
    const existingPref = await UserPreference.findOne({ userId: 'demo-user' });
    if (!existingPref) {
      await UserPreference.create({
        userId: 'demo-user',
        profiles: ['health', 'commuter', 'outdoor_fitness'],
        preferred_city: 'Mumbai',
        temperature_unit: 'celsius',
        language: 'en',
        categories: ['health', 'commute', 'fitness'],
      });
      console.log('[Seed] Default demo-user preferences created in MongoDB.');
    }

    // 2. Seed Default Saved Locations for demo-user if not exists
    const locationsCount = await SavedLocation.countDocuments({ userId: 'demo-user' });
    if (locationsCount === 0) {
      await SavedLocation.insertMany([
        {
          userId: 'demo-user',
          city_name: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          latitude: 19.076,
          longitude: 72.8777,
          is_favorite: true,
        },
        {
          userId: 'demo-user',
          city_name: 'New Delhi',
          state: 'Delhi',
          country: 'India',
          latitude: 28.6139,
          longitude: 77.209,
          is_favorite: false,
        },
        {
          userId: 'demo-user',
          city_name: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
          latitude: 12.9716,
          longitude: 77.5946,
          is_favorite: false,
        },
      ]);
      console.log('[Seed] Sample saved locations initialized in MongoDB.');
    }

    // 3. Seed Verified Advisory for Mumbai if not exists
    const alertsCount = await WeatherAlert.countDocuments({ city: new RegExp('^mumbai$', 'i') });
    if (alertsCount === 0) {
      await WeatherAlert.create({
        city: 'Mumbai',
        event: 'Coastal Marine & High Tide Advisory',
        headline: 'High Tide & Spring Swell Advisory for Greater Mumbai and Coastal Konkan',
        description: 'Astronomical spring high tide reaching 4.18 meters expected along Gateway of India, Marine Drive, and coastal promenades. Sea condition rough to very rough with swell waves.',
        severity: 'advisory',
        is_verified: true,
        source: 'Indian National Centre for Ocean Information Services (INCOIS)',
        precautions: [
          'Avoid swimming, wading, or water sports along unprotected beaches and rocky shores.',
          'Fishermen and small coastal craft operators are advised to stay moored in designated harbors.',
          'Avoid gathering on sea promenades during peak high tide hours (11:30 - 14:00).',
          'Monitor official meteorological bulletins for real-time swell updates.',
        ],
        effective_from: new Date(),
        effective_to: new Date(Date.now() + 86400000 * 3),
      });
      console.log('[Seed] Verified coastal alert seeded in MongoDB.');
    }
  } catch (err) {
    console.warn('[Seed Warning]: Unable to seed initial data:', err.message);
  }
}

export default seedInitialData;
