import test from 'node:test';
import assert from 'node:assert/strict';
import { rankPersonalizedCards, attachAlertsToDashboard, PROFILES } from '../src/services/personalization.service.js';

// Mock weather object
const mockWeather = {
  location: { city: 'Mumbai', state: 'Maharashtra', country: 'India', latitude: 19.07, longitude: 72.87 },
  current: {
    temperature: 31.0,
    apparentTemperature: 35.0,
    relativeHumidity: 70,
    weatherCode: 1,
    weatherCondition: 'Mainly Clear',
    windSpeed: 15.0,
    windGusts: 22.0,
    rain: 0,
    precipitation: 0,
    isDay: 1,
    uvIndex: 7.5,
    aqi: { usAqi: 130, category: 'Moderate', isAvailable: true },
    marine: { waveHeight: 1.2, wavePeriod: 8, isAvailable: true },
  },
  daily: [
    { date: '2026-10-27', tempMax: 33, tempMin: 25, rainProbMax: 20, precipitationSum: 0, uvIndexMax: 8, sunset: '18:05' },
    { date: '2026-10-28', tempMax: 34, tempMin: 25, rainProbMax: 30, precipitationSum: 0, uvIndexMax: 8, sunset: '18:04' },
  ],
  hourly: [
    { time: '08:00', temperature: 26, precipitationProbability: 10, uvIndex: 2 },
    { time: '15:00', temperature: 33, precipitationProbability: 15, uvIndex: 8 },
  ],
};

test('1. Profiles count: Exactly 8 user profiles supported', () => {
  assert.equal(PROFILES.length, 8);
  const profileIds = PROFILES.map((p) => p.id);
  const expected = [
    'health',
    'outdoor_fitness',
    'beach',
    'travel',
    'family',
    'agriculture',
    'commuter',
    'event_planner',
  ];
  assert.deepEqual(profileIds.sort(), expected.sort());
});

test('2. Personalization Scoring: Cards are sorted descending by score', () => {
  const cards = rankPersonalizedCards(mockWeather, ['health']);
  assert.ok(cards.length > 0);
  for (let i = 0; i < cards.length - 1; i++) {
    assert.ok(cards[i].scores.raw >= cards[i + 1].scores.raw, 'Cards must be sorted descending');
  }
});

test('3. Single Profile Match: Matched profile card ranks higher than unselected', () => {
  const cards = rankPersonalizedCards(mockWeather, ['beach']);
  const topCard = cards[0];
  assert.equal(topCard.profile, 'beach');
  assert.equal(topCard.isSelectedProfile, true);
  assert.equal(topCard.scores.breakdown.profile, 5.0);
});

test('4. Multiple Profiles: Both selected profiles rank ahead of unselected without duplicating', () => {
  const cards = rankPersonalizedCards(mockWeather, ['commuter', 'outdoor_fitness']);
  // No duplicates
  const ids = cards.map((c) => c.id);
  const uniqueIds = new Set(ids);
  assert.equal(ids.length, uniqueIds.size, 'Card IDs must be strictly unique');

  const selectedCards = cards.filter((c) => c.isSelectedProfile);
  assert.equal(selectedCards.length, 2);
  assert.ok(cards[0].isSelectedProfile);
  assert.ok(cards[1].isSelectedProfile);
});

test('5. Empty Profiles: Falls back gracefully to default profiles without crashing', () => {
  const cards = rankPersonalizedCards(mockWeather, []);
  assert.equal(cards.length, 8);
  assert.ok(cards[0].scores.total > 0);
});

test('6. Missing Metrics: Inland location with missing marine data shows unavailable status', () => {
  const inlandWeather = {
    ...mockWeather,
    location: { city: 'Nagpur', state: 'Maharashtra', country: 'India' },
    current: {
      ...mockWeather.current,
      marine: { isAvailable: false, reason: 'Inland location' },
    },
  };

  const cards = rankPersonalizedCards(inlandWeather, ['beach']);
  const beachCard = cards.find((c) => c.profile === 'beach');
  assert.ok(beachCard);
  assert.equal(beachCard.dataStatus, 'unavailable');
  assert.equal(beachCard.content.metric1.value, 'Unavailable');
});

test('7. Alert Prioritization: Verified alerts are pinned and marked priority', () => {
  const cards = rankPersonalizedCards(mockWeather, ['health', 'commuter']);
  const mockAlerts = [
    {
      id: 99,
      city: 'Mumbai',
      event: 'Cyclone Warning',
      headline: 'Cyclone Alert for Coastal Konkan',
      description: 'Gale wind and heavy rainfall alert issued by IMD/MoES.',
      severity: 'severe',
      is_verified: true,
      effective_from: new Date().toISOString(),
    },
  ];

  const dashboard = attachAlertsToDashboard(cards, mockAlerts);
  assert.equal(dashboard.severeAlerts.length, 1);
  assert.equal(dashboard.severeAlerts[0].pinned, true);
  assert.equal(dashboard.severeAlerts[0].severity, 'severe');
});

test('8. Unverified Alerts: Never pinned to dashboard', () => {
  const cards = rankPersonalizedCards(mockWeather, ['health']);
  const unverifiedAlerts = [
    { id: 100, headline: 'Unconfirmed rumor', is_verified: false, severity: 'warning' },
  ];
  const dashboard = attachAlertsToDashboard(cards, unverifiedAlerts);
  assert.equal(dashboard.severeAlerts.length, 0);
});
