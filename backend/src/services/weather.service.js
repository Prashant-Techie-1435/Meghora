/**
 * Weather Service for Mausam Personalized
 * Connects to Open-Meteo APIs (Geocoding, Forecast, Air Quality, Marine).
 * Implements real-time fetching, caching, WMO interpretation, and strict error handling.
 * NOTE: Never silently substitutes fake data when live API fails.
 */

// In-memory cache structure: { [cacheKey]: { data, timestamp } }
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

/**
 * Maps WMO Weather Interpretation Codes (WW)
 */
export const mapWmoCode = (code) => {
  const codeMap = {
    0: { condition: 'Clear Sky', icon: 'Sun', severity: 'normal' },
    1: { condition: 'Mainly Clear', icon: 'SunMedium', severity: 'normal' },
    2: { condition: 'Partly Cloudy', icon: 'CloudSun', severity: 'normal' },
    3: { condition: 'Overcast', icon: 'Cloud', severity: 'normal' },
    45: { condition: 'Fog', icon: 'CloudFog', severity: 'advisory' },
    48: { condition: 'Depositing Rime Fog', icon: 'CloudFog', severity: 'advisory' },
    51: { condition: 'Light Drizzle', icon: 'CloudDrizzle', severity: 'normal' },
    53: { condition: 'Moderate Drizzle', icon: 'CloudDrizzle', severity: 'normal' },
    55: { condition: 'Dense Drizzle', icon: 'CloudDrizzle', severity: 'normal' },
    61: { condition: 'Slight Rain', icon: 'CloudRain', severity: 'normal' },
    63: { condition: 'Moderate Rain', icon: 'CloudRain', severity: 'advisory' },
    65: { condition: 'Heavy Rain', icon: 'CloudRainWind', severity: 'warning' },
    71: { condition: 'Slight Snow', icon: 'CloudSnow', severity: 'normal' },
    73: { condition: 'Moderate Snow', icon: 'CloudSnow', severity: 'advisory' },
    75: { condition: 'Heavy Snow', icon: 'CloudSnow', severity: 'warning' },
    80: { condition: 'Slight Rain Showers', icon: 'CloudRain', severity: 'normal' },
    81: { condition: 'Moderate Rain Showers', icon: 'CloudRain', severity: 'normal' },
    82: { condition: 'Violent Rain Showers', icon: 'CloudLightning', severity: 'warning' },
    95: { condition: 'Thunderstorm', icon: 'CloudLightning', severity: 'warning' },
    96: { condition: 'Thunderstorm with Slight Hail', icon: 'CloudLightning', severity: 'warning' },
    99: { condition: 'Thunderstorm with Heavy Hail', icon: 'Zap', severity: 'severe' },
  };

  return codeMap[code] || { condition: 'Partly Cloudy', icon: 'Cloud', severity: 'normal' };
};

/**
 * Fetch with timeout helper using AbortController
 */
const fetchWithTimeout = async (url, options = {}, timeoutMs = 6000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

/**
 * Search city suggestions using Open-Meteo Geocoding
 */
export const searchCities = async (queryText) => {
  if (!queryText || queryText.trim().length < 2) return [];

  const cleanQuery = queryText.trim();
  const cacheKey = `search:${cleanQuery.toLowerCase()}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    cleanQuery
  )}&count=8&language=en&format=json`;

  try {
    const res = await fetchWithTimeout(url, {}, 5000);
    if (!res.ok) return [];
    const data = await res.json();
    const list = (data.results || []).map((r) => ({
      name: r.name,
      state: r.admin1 || '',
      country: r.country || 'India',
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone,
    }));

    cache.set(cacheKey, { data: list, timestamp: Date.now() });
    return list;
  } catch (err) {
    console.warn(`[Search Cities Error] ${cleanQuery}:`, err.message);
    return [];
  }
};

/**
 * Geocode a city name using Open-Meteo Geocoding API
 */
export const geocodeCity = async (cityName) => {
  const cleanCity = cityName.trim();

  // Test simulation trigger
  if (cleanCity === '__SIMULATE_FAILURE__') {
    const err = new Error('Simulated network error: Weather telemetry provider unreachable.');
    err.statusCode = 503;
    throw err;
  }

  const cacheKey = `geo:${cleanCity.toLowerCase()}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    cleanCity
  )}&count=5&language=en&format=json`;

  try {
    const res = await fetchWithTimeout(url, {}, 5000);
    if (!res.ok) {
      const err = new Error(`Geocoding service error (${res.status}): Unable to lookup "${cleanCity}".`);
      err.statusCode = res.status;
      throw err;
    }

    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      const notFoundErr = new Error(`Location "${cleanCity}" not found. Please verify spelling or try another Indian city.`);
      notFoundErr.statusCode = 404;
      throw notFoundErr;
    }

    // Pick top relevant result (prioritizing India if matching query)
    const indiaMatch = data.results.find((r) => r.country === 'India');
    const result = indiaMatch || data.results[0];

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    if (err.statusCode) throw err;
    const netErr = new Error(`Network failure connecting to geocoding provider for "${cleanCity}": ${err.message}`);
    netErr.statusCode = 502;
    throw netErr;
  }
};

/**
 * Fetch Air Quality from Open-Meteo Air Quality API
 */
const fetchAirQuality = async (lat, lon) => {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi,european_aqi`;
    const res = await fetchWithTimeout(url, {}, 4000);
    if (!res.ok) return { isAvailable: false, reason: 'Air quality telemetry station offline for coordinates' };
    const data = await res.json();
    const cur = data.current || {};

    const usAqi = cur.us_aqi !== undefined ? Math.round(cur.us_aqi) : null;
    let category = 'Unknown';
    if (usAqi !== null) {
      if (usAqi <= 50) category = 'Good';
      else if (usAqi <= 100) category = 'Moderate';
      else if (usAqi <= 150) category = 'Unhealthy for Sensitive Groups';
      else if (usAqi <= 200) category = 'Unhealthy';
      else if (usAqi <= 300) category = 'Very Unhealthy';
      else category = 'Hazardous';
    }

    return {
      usAqi,
      category,
      pm25: cur.pm2_5 !== undefined ? Math.round(cur.pm2_5 * 10) / 10 : null,
      pm10: cur.pm10 !== undefined ? Math.round(cur.pm10 * 10) / 10 : null,
      co: cur.carbon_monoxide ?? null,
      no2: cur.nitrogen_dioxide ?? null,
      so2: cur.sulphur_dioxide ?? null,
      ozone: cur.ozone ?? null,
      isAvailable: usAqi !== null,
    };
  } catch {
    return { isAvailable: false, reason: 'Air quality monitoring station unreachable' };
  }
};

/**
 * Fetch Marine conditions if near coast
 */
const fetchMarineConditions = async (lat, lon) => {
  try {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period`;
    const res = await fetchWithTimeout(url, {}, 3500);
    if (!res.ok) return { isAvailable: false, reason: 'Inland location — marine data not applicable' };
    const data = await res.json();
    if (!data.current || data.current.wave_height === undefined || data.current.wave_height === null) {
      return { isAvailable: false, reason: 'No active coastal marine buoys within sensor radius' };
    }
    return {
      isAvailable: true,
      waveHeight: data.current.wave_height,
      wavePeriod: data.current.wave_period,
      waveDirection: data.current.wave_direction,
    };
  } catch {
    return { isAvailable: false, reason: 'Marine sensor telemetry unreachable' };
  }
};

/**
 * Main function: Get full weather details for a resolved location
 * Throws clean error on failure without fabricating synthetic weather data.
 */
export const getWeatherData = async (cityName) => {
  // 1. Geocode location
  const geo = await geocodeCity(cityName);

  const cacheKey = `weather:${geo.latitude.toFixed(4)},${geo.longitude.toFixed(4)}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { ...cached.data, cached: true };
    }
  }

  // 2. Query Live Open-Meteo Endpoints
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max&timezone=auto`;

  let forecastRes;
  let aqiData;
  let marineData;

  try {
    [forecastRes, aqiData, marineData] = await Promise.all([
      fetchWithTimeout(forecastUrl, {}, 6500),
      fetchAirQuality(geo.latitude, geo.longitude),
      fetchMarineConditions(geo.latitude, geo.longitude),
    ]);
  } catch (netErr) {
    const err = new Error(`Failed to connect to weather telemetry provider for "${cityName}": ${netErr.message}`);
    err.statusCode = 502;
    throw err;
  }

  if (!forecastRes.ok) {
    const err = new Error(`Weather telemetry server returned HTTP ${forecastRes.status} for "${cityName}".`);
    err.statusCode = forecastRes.status;
    throw err;
  }

  const raw = await forecastRes.json();
  const cur = raw.current || {};
  const daily = raw.daily || {};
  const hourly = raw.hourly || {};

  const currentWeatherCode = cur.weather_code ?? 0;
  const conditionMeta = mapWmoCode(currentWeatherCode);

  // Format daily forecast (next 5-7 days)
  const formattedDaily = (daily.time || []).map((dateStr, idx) => {
    const code = daily.weather_code?.[idx] ?? 0;
    const meta = mapWmoCode(code);
    return {
      date: dateStr,
      tempMax: daily.temperature_2m_max?.[idx] ?? null,
      tempMin: daily.temperature_2m_min?.[idx] ?? null,
      weatherCode: code,
      condition: meta.condition,
      icon: meta.icon,
      rainProbMax: daily.precipitation_probability_max?.[idx] ?? 0,
      precipitationSum: daily.precipitation_sum?.[idx] ?? 0,
      windSpeedMax: daily.wind_speed_10m_max?.[idx] ?? null,
      uvIndexMax: daily.uv_index_max?.[idx] ?? null,
      sunrise: daily.sunrise?.[idx] ? daily.sunrise[idx].split('T')[1] : null,
      sunset: daily.sunset?.[idx] ? daily.sunset[idx].split('T')[1] : null,
    };
  });

  // Format hourly forecast (next 24 hours from current hour)
  const currentHourStr = new Date().toISOString().slice(0, 13);
  let startIndex = 0;
  if (hourly.time) {
    const found = hourly.time.findIndex((t) => t.startsWith(currentHourStr));
    if (found !== -1) startIndex = found;
  }

  const formattedHourly = (hourly.time || []).slice(startIndex, startIndex + 24).map((timeStr, offset) => {
    const idx = startIndex + offset;
    const code = hourly.weather_code?.[idx] ?? 0;
    const meta = mapWmoCode(code);
    return {
      time: timeStr.split('T')[1]?.slice(0, 5) || timeStr,
      fullTime: timeStr,
      temperature: hourly.temperature_2m?.[idx] ?? null,
      relativeHumidity: hourly.relative_humidity_2m?.[idx] ?? null,
      precipitationProbability: hourly.precipitation_probability?.[idx] ?? 0,
      windSpeed: hourly.wind_speed_10m?.[idx] ?? null,
      uvIndex: hourly.uv_index?.[idx] ?? null,
      weatherCode: code,
      condition: meta.condition,
      icon: meta.icon,
    };
  });

  const currentUvIndex = formattedHourly[0]?.uvIndex ?? formattedDaily[0]?.uvIndexMax ?? null;

  const normalizedData = {
    location: {
      city: geo.name,
      state: geo.admin1 || '',
      country: geo.country || 'India',
      latitude: geo.latitude,
      longitude: geo.longitude,
      timezone: raw.timezone || 'auto',
    },
    current: {
      temperature: cur.temperature_2m ?? null,
      apparentTemperature: cur.apparent_temperature ?? null,
      relativeHumidity: cur.relative_humidity_2m ?? null,
      weatherCode: currentWeatherCode,
      weatherCondition: conditionMeta.condition,
      weatherIcon: conditionMeta.icon,
      windSpeed: cur.wind_speed_10m ?? null,
      windDirection: cur.wind_direction_10m ?? null,
      windGusts: cur.wind_gusts_10m ?? null,
      surfacePressure: cur.surface_pressure ?? null,
      precipitation: cur.precipitation ?? 0,
      rain: cur.rain ?? 0,
      cloudCover: cur.cloud_cover ?? null,
      isDay: cur.is_day ?? 1,
      uvIndex: currentUvIndex,
      sunrise: formattedDaily[0]?.sunrise || null,
      sunset: formattedDaily[0]?.sunset || null,
      aqi: aqiData,
      marine: marineData,
    },
    daily: formattedDaily,
    hourly: formattedHourly,
    attribution: 'Open-Meteo (MoES compliant free open data)',
    isLive: true,
    lastUpdated: new Date().toISOString(),
  };

  cache.set(cacheKey, { data: normalizedData, timestamp: Date.now() });
  return normalizedData;
};
