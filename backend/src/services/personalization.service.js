/**
 * Personalization Engine for Mausam Personalized
 * SIH Problem Statement ID: SIH26076
 *
 * Implements deterministic scoring:
 * score = 5 * profile_relevance + 2 * time_relevance + 2 * location_relevance + 3 * weather_relevance
 * Factors normalized between 0 and 5. Maximum raw score: 60.
 */

// Registered profiles list
export const PROFILES = [
  { id: 'health', name: 'Health-Conscious Users', icon: 'HeartPulse', description: 'Air quality, UV index, respiratory health alerts' },
  { id: 'outdoor_fitness', name: 'Outdoor Fitness Enthusiasts', icon: 'Activity', description: 'Best workout hours, heat stress, wind conditions' },
  { id: 'beach', name: 'Beachgoers & Surfers', icon: 'Waves', description: 'Marine wave heights, coastal breeze, UV index' },
  { id: 'travel', name: 'Travelers', icon: 'Compass', description: 'Packing suggestions, multi-day shifts, transit forecasts' },
  { id: 'family', name: 'Parents & Families', icon: 'Users', description: 'School commute conditions, outdoor play windows, rain' },
  { id: 'agriculture', name: 'Farmers & Gardeners', icon: 'Sprout', description: 'Rainfall forecast, spray feasibility, agricultural hints' },
  { id: 'commuter', name: 'Daily Commuters', icon: 'Car', description: 'Road visibility, rain timing, rush-hour conditions' },
  { id: 'event_planner', name: 'Event Planners', icon: 'CalendarDays', description: 'Outdoor comfort index, rain probability, wind gusts' },
];

/**
 * Calculates time-of-day relevance (0 to 5)
 */
function calculateTimeRelevance(cardType, currentHour, isDay) {
  // Morning rush (07:00 - 10:00) & Evening rush (17:00 - 20:00)
  if (cardType === 'commute_morning') {
    return currentHour >= 6 && currentHour <= 10 ? 5 : (currentHour >= 16 && currentHour <= 20 ? 3 : 1);
  }
  if (cardType === 'fitness_outdoor') {
    // Fitness is ideal in early morning or late afternoon
    return (currentHour >= 5 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 20) ? 5 : 2;
  }
  if (cardType === 'family_play') {
    return isDay && currentHour >= 15 && currentHour <= 19 ? 5 : 2;
  }
  if (cardType === 'event_comfort') {
    return isDay ? 4 : 2;
  }
  return 3; // Baseline average time relevance
}

/**
 * Calculates location relevance (0 to 5)
 */
function calculateLocationRelevance(cardType, location, weather) {
  const isCoastal = weather.current?.marine?.isAvailable;
  if (cardType === 'marine_surf') {
    return isCoastal ? 5 : 0; // Coastal cities get max, inland get 0
  }
  if (cardType === 'agriculture_spray') {
    // Rural or semi-urban relevance baseline
    return 4;
  }
  return 4; // High default relevance for local weather
}

/**
 * Calculates weather impact relevance (0 to 5)
 */
function calculateWeatherRelevance(cardType, current, daily) {
  const temp = current?.temperature ?? 25;
  const rain = current?.rain ?? 0;
  const rainProb = daily?.[0]?.rainProbMax ?? 0;
  const wind = current?.windSpeed ?? 10;
  const aqiVal = current?.aqi?.usAqi ?? 50;

  if (cardType === 'health_air_uv') {
    if (aqiVal > 150 || (current?.uvIndex ?? 0) >= 8) return 5;
    if (aqiVal > 100 || (current?.uvIndex ?? 0) >= 6) return 4;
    return 2;
  }

  if (cardType === 'commute_morning') {
    if (rain > 1 || rainProb > 60 || current?.weatherCode >= 45) return 5; // Rain or fog heavily impacts commute
    if (rainProb > 30) return 3.5;
    return 2;
  }

  if (cardType === 'fitness_outdoor') {
    if (temp > 35 || temp < 10 || rain > 0) return 4.5; // High weather sensitivity (warning against harsh condition)
    if (temp >= 18 && temp <= 28 && rain === 0) return 4.5; // Ideal window
    return 3;
  }

  if (cardType === 'marine_surf') {
    const wave = current?.marine?.waveHeight ?? 0;
    if (wave > 2.0 || wind > 30) return 5; // High marine activity
    return 3;
  }

  if (cardType === 'agriculture_spray') {
    if (rainProb > 50 || wind > 25) return 4.5; // Unfavorable for pesticide/fertilizer spraying
    return 3;
  }

  if (cardType === 'travel_packing') {
    if (rainProb > 40 || temp < 18 || temp > 33) return 4.5;
    return 3;
  }

  if (cardType === 'family_play') {
    if (rainProb > 40 || temp > 36) return 4.5;
    return 3;
  }

  if (cardType === 'event_comfort') {
    if (rainProb > 50 || wind > 30 || temp > 34) return 5;
    return 3;
  }

  return 3;
}

/**
 * Generates card candidates for each profile
 */
function generateCandidateCards(weather, activeProfiles) {
  const current = weather.current || {};
  const daily = weather.daily || [];
  const hourly = weather.hourly || [];
  const location = weather.location || {};

  const currentHour = new Date().getHours();
  const isDay = current.isDay === 1;

  const temp = current.temperature ?? 25;
  const tempFeels = current.apparentTemperature ?? temp;
  const rainProbToday = daily[0]?.rainProbMax ?? 0;
  const uv = current.uvIndex ?? daily[0]?.uvIndexMax ?? null;
  const aqi = current.aqi;
  const marine = current.marine;

  const candidates = [
    // 1. Health Card
    {
      id: 'card-health-air-uv',
      type: 'health_air_uv',
      profile: 'health',
      title: 'Air Quality & Environmental Health',
      badge: 'Health Intelligence',
      category: 'health',
      dataStatus: aqi?.isAvailable ? 'available' : 'partial',
      content: {
        headline: aqi?.isAvailable
          ? `AQI is ${aqi.usAqi} (${aqi.category})`
          : 'Air Quality telemetry not reporting for this station',
        metric1: { label: 'Air Quality', value: aqi?.usAqi ? `${aqi.usAqi} AQI` : 'Unavailable', status: aqi?.category || 'N/A' },
        metric2: { label: 'UV Index', value: uv !== null ? `${uv.toFixed(1)} / 11+` : 'Unavailable', status: uv >= 6 ? 'High' : 'Moderate' },
        metric3: { label: 'Humidity', value: current.relativeHumidity ? `${current.relativeHumidity}%` : 'N/A', status: current.relativeHumidity > 70 ? 'Muggy' : 'Comfortable' },
        advice:
          aqi?.usAqi > 150
            ? 'Estimated: Unhealthy air quality detected. Sensitive groups should wear an N95 mask outdoors.'
            : uv >= 6
            ? 'Estimated: UV radiation is elevated during midday. Apply SPF 30+ sunscreen and wear sunglasses.'
            : 'Estimated: Environmental metrics are within normal baseline thresholds today.',
      },
      profileRelevance: activeProfiles.includes('health') ? 5.0 : 0.5,
    },

    // 2. Outdoor Fitness Card
    {
      id: 'card-fitness-outdoor',
      type: 'fitness_outdoor',
      profile: 'outdoor_fitness',
      title: 'Outdoor Workout & Running Conditions',
      badge: 'Fitness Advisor',
      category: 'fitness',
      dataStatus: 'available',
      content: {
        headline:
          temp > 33
            ? 'Caution: High Heat Index — Early Morning or Evening Recommended'
            : rainProbToday > 50
            ? 'Rain Expected — Indoor Training Advised'
            : 'Great Window for Outdoor Running & Cycling',
        metric1: { label: 'Air Temp', value: `${temp}°C`, status: `Feels ${tempFeels}°C` },
        metric2: { label: 'Wind Speed', value: `${current.windSpeed ?? 0} km/h`, status: current.windSpeed > 25 ? 'Breezy' : 'Gentle' },
        metric3: { label: 'Golden Hour Sunset', value: daily[0]?.sunset || '18:15', status: 'Optimal Light' },
        advice:
          temp > 33
            ? 'Estimated: High heat index. Hydrate with electrolyte water before and after high-intensity cardio.'
            : 'Estimated: Thermal comfort index is favourable for outdoor aerobic sessions.',
      },
      profileRelevance: activeProfiles.includes('outdoor_fitness') ? 5.0 : 0.5,
    },

    // 3. Beachgoers & Surfers Card
    {
      id: 'card-beach-surf',
      type: 'marine_surf',
      profile: 'beach',
      title: 'Coastal Conditions & Surf Advisor',
      badge: 'Marine Forecast',
      category: 'beach',
      dataStatus: marine?.isAvailable ? 'available' : 'unavailable',
      content: {
        headline: marine?.isAvailable
          ? `Coastal Swell: ${marine.waveHeight}m @ ${marine.wavePeriod}s`
          : 'Marine wave telemetry unavailable for inland/sheltered stations',
        metric1: { label: 'Wave Height', value: marine?.isAvailable ? `${marine.waveHeight} m` : 'Unavailable', status: marine?.waveHeight > 1.8 ? 'Rough' : 'Mild' },
        metric2: { label: 'Wind Speed', value: `${current.windSpeed ?? 0} km/h`, status: 'Onshore/Breeze' },
        metric3: { label: 'UV at Shore', value: uv !== null ? `${uv.toFixed(1)}` : 'N/A', status: 'High Reflectivity' },
        advice: marine?.isAvailable
          ? marine.waveHeight > 1.8
            ? 'Estimated: Strong offshore chop and breaking waves. Swimmers should stay in lifeguard monitored zones.'
            : 'Estimated: Calm to moderate swells. Favourable for swimming, paddle boarding and coastal walks.'
          : 'Estimated: This location does not have immediate coastal buoy reporting.',
      },
      profileRelevance: activeProfiles.includes('beach') ? 5.0 : 0.5,
    },

    // 4. Travelers Card
    {
      id: 'card-travel-packing',
      type: 'travel_packing',
      profile: 'travel',
      title: 'Travel & Weather-Based Packing Assistant',
      badge: 'Travel Insights',
      category: 'travel',
      dataStatus: 'available',
      content: {
        headline: `3-Day Outlook for ${location.city}: ${daily[0]?.condition || 'Stable'}`,
        metric1: { label: 'Max/Min Today', value: `${daily[0]?.tempMax ?? 30}° / ${daily[0]?.tempMin ?? 22}°C`, status: 'Diurnal Range' },
        metric2: { label: 'Peak Rain Risk', value: `${Math.max(...daily.slice(0, 3).map((d) => d.rainProbMax || 0))}%`, status: 'Next 72h' },
        metric3: { label: 'Primary Need', value: rainProbToday > 40 ? 'Umbrella & Waterproofs' : temp > 30 ? 'Breathable Cotton' : 'Light Jacket', status: 'Pack Item' },
        advice:
          rainProbToday > 40
            ? 'Estimated: Carry a compact umbrella and water-resistant footwear in your carry-on luggage.'
            : 'Estimated: Weather trends are stable across the next 3 days. Standard lightweight travel gear recommended.',
      },
      profileRelevance: activeProfiles.includes('travel') ? 5.0 : 0.5,
    },

    // 5. Parents & Families Card
    {
      id: 'card-family-commute',
      type: 'family_play',
      profile: 'family',
      title: 'School Commute & Family Outing Planner',
      badge: 'Family Weather',
      category: 'family',
      dataStatus: 'available',
      content: {
        headline:
          rainProbToday > 40
            ? 'Afternoon Rain Forecast — Keep Rain Gear Ready for School Pickup'
            : temp > 34
            ? 'High Afternoon Heat — Plan Outdoor Play in Shaded Areas'
            : 'Pleasant Weather for Evening Park & Playground Outings',
        metric1: { label: 'School Departure (8 AM)', value: `${hourly[8]?.temperature ?? 24}°C`, status: 'Morning Run' },
        metric2: { label: 'Afternoon Pickup (3 PM)', value: `${hourly[15]?.temperature ?? 31}°C`, status: `Rain: ${hourly[15]?.precipitationProbability ?? 10}%` },
        metric3: { label: 'Outdoor Comfort', value: temp > 33 ? 'Warm' : 'Pleasant', status: 'Children Friendly' },
        advice:
          rainProbToday > 40
            ? 'Estimated: Ensure schoolbags have rain covers and children have light raincoats.'
            : 'Estimated: Excellent evening window (16:30 - 18:30) for outdoor play and sports.',
      },
      profileRelevance: activeProfiles.includes('family') ? 5.0 : 0.5,
    },

    // 6. Agriculture & Gardeners Card
    {
      id: 'card-agriculture-spray',
      type: 'agriculture_spray',
      profile: 'agriculture',
      title: 'Agricultural & Gardening Advisory',
      badge: 'Agro-Met Advice',
      category: 'agriculture',
      dataStatus: 'available',
      content: {
        headline:
          current.windSpeed > 20
            ? 'High Wind Speeds — Postpone Foliar Spraying & Dusting'
            : daily[0]?.precipitationSum > 5
            ? 'Moderate Rainfall Expected — Hold Irrigation Schedules'
            : 'Favourable Day for Fieldwork & Garden Maintenance',
        metric1: { label: 'Expected Rainfall', value: `${daily[0]?.precipitationSum ?? 0} mm`, status: `Prob: ${rainProbToday}%` },
        metric2: { label: 'Wind Drift Risk', value: `${current.windSpeed ?? 0} km/h`, status: current.windSpeed > 20 ? 'High Drift' : 'Safe for Spray' },
        metric3: { label: 'Surface Pressure', value: `${current.surfacePressure ?? 1012} hPa`, status: 'Barometric Trend' },
        advice:
          current.windSpeed > 20
            ? 'Estimated: High wind drift will reduce pesticide/fertilizer spray efficacy. Wait for calmer morning hours.'
            : 'Estimated: Soil moisture levels stable. Standard irrigation cycle recommended.',
      },
      profileRelevance: activeProfiles.includes('agriculture') ? 5.0 : 0.5,
    },

    // 7. Daily Commuters Card
    {
      id: 'card-commuter-transit',
      type: 'commute_morning',
      profile: 'commuter',
      title: 'Commute & Road Travel Conditions',
      badge: 'Daily Commute',
      category: 'commute',
      dataStatus: 'available',
      content: {
        headline:
          current.weatherCode >= 45 && current.weatherCode <= 48
            ? 'Dense Fog Alert — Reduced Road Visibility on Arterial Highways'
            : current.rain > 0 || rainProbToday > 60
            ? 'Wet Roads & Waterlogging Probability on Key Transit Routes'
            : 'Smooth Commuter Weather with Normal Visibility',
        metric1: { label: 'Current Condition', value: current.weatherCondition || 'Clear', status: `Code: ${current.weatherCode}` },
        metric2: { label: 'Precipitation Chance', value: `${rainProbToday}%`, status: current.rain > 0 ? 'Active Rain' : 'Dry Now' },
        metric3: { label: 'Rush Hour Winds', value: `${current.windSpeed ?? 0} km/h`, status: 'Stable' },
        advice:
          current.weatherCode >= 45
            ? 'Estimated: Drive with low beams on highway stretches. Allow 15-20 extra minutes for peak-hour transit.'
            : rainProbToday > 60
            ? 'Estimated: Expect slow-moving traffic on low-lying roads during evening peak hours.'
            : 'Estimated: Normal travel conditions expected across highway and rail networks.',
      },
      profileRelevance: activeProfiles.includes('commuter') ? 5.0 : 0.5,
    },

    // 8. Event Planners Card
    {
      id: 'card-event-planner',
      type: 'event_comfort',
      profile: 'event_planner',
      title: 'Outdoor Event Feasibility Index',
      badge: 'Event Planning',
      category: 'event_planner',
      dataStatus: 'available',
      content: {
        headline:
          rainProbToday > 50
            ? 'High Rain Probability — Marquee or Canopy Protection Strongly Advised'
            : current.windGusts > 35
            ? 'Strong Gust Warnings — Secure Tents, Banners & Stage Rigging'
            : 'Optimal Conditions for Outdoor Conferences & Receptions',
        metric1: { label: 'Rain Probability', value: `${rainProbToday}%`, status: rainProbToday > 50 ? 'High Risk' : 'Low Risk' },
        metric2: { label: 'Peak Wind Gust', value: `${current.windGusts ?? current.windSpeed ?? 0} km/h`, status: current.windGusts > 35 ? 'Gust Alert' : 'Normal' },
        metric3: { label: 'Daytime High', value: `${daily[0]?.tempMax ?? 30}°C`, status: 'Thermal Comfort' },
        advice:
          rainProbToday > 50
            ? 'Estimated: Keep backup indoor arrangements ready or verify waterproof shelter coverage.'
            : 'Estimated: Ambient temperatures and wind speeds are within ideal comfort brackets for attendees.',
      },
      profileRelevance: activeProfiles.includes('event_planner') ? 5.0 : 0.5,
    },
  ];

  return candidates;
}

/**
 * Main Personalization Ranker
 *
 * Computes deterministic score:
 * score = 5 * P + 2 * T + 2 * L + 3 * W
 * Max score = 60
 *
 * @param {Object} weather Normalized weather object
 * @param {Array<string>} activeProfiles Array of selected profile keys
 * @returns {Array<Object>} Ranked cards with score explanations
 */
export const rankPersonalizedCards = (weather, activeProfiles = []) => {
  const currentHour = new Date().getHours();
  const isDay = weather.current?.isDay === 1;

  // If no profiles selected, default to all profiles with equal baseline weight
  const selectedProfiles = activeProfiles && activeProfiles.length > 0
    ? activeProfiles
    : ['health', 'commuter', 'outdoor_fitness'];

  const candidates = generateCandidateCards(weather, selectedProfiles);

  const scoredCards = candidates.map((card) => {
    // 1. Profile relevance (0 to 5)
    // Directly matched profile = 5.0, unselected = 1.0 (or 0.5)
    const isProfileMatch = selectedProfiles.includes(card.profile);
    const P = isProfileMatch ? 5.0 : 1.0;

    // 2. Time relevance (0 to 5)
    const T = calculateTimeRelevance(card.type, currentHour, isDay);

    // 3. Location relevance (0 to 5)
    const L = calculateLocationRelevance(card.type, weather.location, weather);

    // 4. Weather relevance (0 to 5)
    const W = calculateWeatherRelevance(card.type, weather.current, weather.daily);

    // Deterministic formula
    const rawScore = 5 * P + 2 * T + 2 * L + 3 * W;
    const normalizedScore = Math.round((rawScore / 60) * 100); // 0 - 100% scale for clear display

    return {
      ...card,
      isSelectedProfile: isProfileMatch,
      scores: {
        total: normalizedScore,
        raw: rawScore,
        formula: '5×P + 2×T + 2×L + 3×W',
        breakdown: {
          profile: P,
          time: T,
          location: L,
          weather: W,
        },
      },
      explanation: isProfileMatch
        ? `Ranked high because your selected profile "${card.profile}" matches this card, with current weather conditions impact score ${W}/5.`
        : `Recommended based on local weather conditions and time of day (weather score ${W}/5).`,
    };
  });

  // Sort descending by score
  scoredCards.sort((a, b) => b.scores.raw - a.scores.raw);

  return scoredCards;
};

/**
 * Pin verified severe weather alerts above normal cards independently of score
 */
export const attachAlertsToDashboard = (cards, alerts = []) => {
  const verifiedAlerts = (alerts || [])
    .filter((a) => a.is_verified)
    .map((alert) => ({
      id: `alert-${alert.id || Date.now()}`,
      isSevereAlert: true,
      severity: alert.severity || 'warning',
      headline: alert.headline,
      event: alert.event,
      description: alert.description,
      effectiveFrom: alert.effective_from,
      effectiveTo: alert.effective_to,
      source: alert.source || 'Ministry of Earth Sciences (MoES) / IMD Alert Registry',
      precautions: Array.isArray(alert.precautions) ? alert.precautions : (typeof alert.precautions === 'string' ? JSON.parse(alert.precautions) : []),
      pinned: true,
    }));

  return {
    severeAlerts: verifiedAlerts,
    personalizedCards: cards,
  };
};
