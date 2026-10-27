/**
 * API Service for Meghora Weather Dashboard Frontend
 * Communicates with the Express REST API.
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data?.error?.message || `API error: ${res.statusText} (${res.status})`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    console.error(`[API Request Error] ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // 1. Health
  getHealth: () => request('/api/health'),

  // 2. Weather
  getWeather: (city) => request(`/api/weather?city=${encodeURIComponent(city)}`),
  searchCities: (query) => request(`/api/weather/search?q=${encodeURIComponent(query)}`),

  // 3. Homepage (Aggregated Personalized Feed)
  getHomepage: (city = 'Mumbai', userId = 'demo-user') =>
    request(`/api/homepage?city=${encodeURIComponent(city)}&userId=${encodeURIComponent(userId)}`),

  // 4. Preferences
  getPreferences: (userId = 'demo-user') => request(`/api/preferences/${encodeURIComponent(userId)}`),
  updatePreferences: (userId = 'demo-user', preferences) =>
    request(`/api/preferences/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),

  // 5. Saved Locations
  getSavedLocations: (userId = 'demo-user') => request(`/api/locations/${encodeURIComponent(userId)}`),
  addSavedLocation: (userId = 'demo-user', locationData) =>
    request(`/api/locations/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify(locationData),
    }),
  deleteSavedLocation: (userId = 'demo-user', locationId) =>
    request(`/api/locations/${encodeURIComponent(userId)}/${encodeURIComponent(locationId)}`, {
      method: 'DELETE',
    }),

  // 6. Verified Alerts
  getAlerts: (city) => request(`/api/alerts?city=${encodeURIComponent(city)}`),
};

export default api;
