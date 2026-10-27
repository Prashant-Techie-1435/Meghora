import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { isDatabaseConnected } from '../src/config/database.js';
import { UserPreference, SavedLocation, WeatherSnapshot, WeatherAlert } from '../src/models/index.js';

// Configure fast buffer timeout for test environment
mongoose.set('bufferTimeoutMS', 1500);

// Request helper for testing Express app directly
async function mockRequest(path, options = {}) {
  const method = options.method || 'GET';
  const headers = options.headers || {};
  let body = options.body;

  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
    headers['content-type'] = 'application/json';
  }

  return new Promise((resolve, reject) => {
    const http = app.listen(0, async () => {
      const port = http.address().port;
      try {
        const res = await fetch(`http://localhost:${port}${path}`, {
          method,
          headers,
          body,
        });
        const json = await res.json();
        http.close();
        resolve({ status: res.status, body: json });
      } catch (err) {
        http.close();
        reject(err);
      }
    });
  });
}

test('API 1: GET /api/health returns 200 with accurate service and database metadata', async () => {
  const res = await mockRequest('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'healthy');
  assert.ok(res.body.database);
  assert.ok(['connected', 'disconnected'].includes(res.body.database.status));
  assert.ok(typeof res.body.database.readyState === 'number');
});

test('API 2: GET /api/weather validates missing city parameter', async () => {
  const res = await mockRequest('/api/weather');
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('API 3: PUT /api/preferences validates invalid temperature_unit', async () => {
  const res = await mockRequest('/api/preferences/test-user', {
    method: 'PUT',
    body: { temperature_unit: 'kelvin' }, // Invalid unit
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.ok(res.body.error.message.includes('celsius'));
});

test('API 4: Preference persistence: Updates preferences or cleanly handles database outage', async () => {
  const putRes = await mockRequest('/api/preferences/test-user-2', {
    method: 'PUT',
    body: {
      profiles: ['agriculture', 'travel'],
      preferred_city: 'Pune',
      temperature_unit: 'celsius',
    },
  });

  if (isDatabaseConnected()) {
    assert.equal(putRes.status, 200);
    assert.equal(putRes.body.success, true);
    assert.deepEqual(putRes.body.data.profiles, ['agriculture', 'travel']);

    const getRes = await mockRequest('/api/preferences/test-user-2');
    assert.equal(getRes.status, 200);
    assert.deepEqual(getRes.body.data.profiles, ['agriculture', 'travel']);
    assert.equal(getRes.body.data.preferred_city, 'Pune');
  } else {
    // Database connection outage returns appropriate 503 error as required
    assert.equal(putRes.status, 503);
    assert.equal(putRes.body.success, false);
    assert.ok(putRes.body.error.message.includes('MongoDB'));
  }
});

test('API 5: GET /api/weather/search returns geocoding suggestions', async () => {
  const res = await mockRequest('/api/weather/search?q=Mumbai');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length >= 1);
});

test('API 6: Non-fabrication & error handling: Simulated failure returns error without fake weather', async () => {
  const res = await mockRequest('/api/weather?city=__SIMULATE_FAILURE__');
  assert.equal(res.status, 503);
  assert.equal(res.body.success, false);
  assert.ok(res.body.error.message.includes('Simulated network error'));
});

test('API 7: Alerts: Returns verified alerts or cleanly handles database outage', async () => {
  const res = await mockRequest('/api/alerts?city=Mumbai');
  if (isDatabaseConnected()) {
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.alerts));
  } else {
    assert.equal(res.status, 503);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.message.includes('MongoDB'));
  }
});

// =========================================================================
// MONGOOSE SCHEMA & MODEL UNIT TESTS
// =========================================================================

test('Model 1: UserPreference schema validation: Accepts valid profiles and sets defaults', async () => {
  const pref = new UserPreference({
    userId: 'test-user-model',
    preferred_city: 'Delhi',
    profiles: ['health', 'travel'],
    temperature_unit: 'celsius',
  });

  await pref.validate();
  assert.equal(pref.userId, 'test-user-model');
  assert.equal(pref.city, 'Delhi');
  assert.equal(pref.unit, 'celsius');
});

test('Model 2: UserPreference schema validation: Rejects invalid profile names', async () => {
  const pref = new UserPreference({
    userId: 'test-user-invalid',
    profiles: ['invalid_persona_xyz'],
  });

  await assert.rejects(
    async () => {
      await pref.validate();
    },
    (err) => {
      assert.ok(err.errors.profiles);
      return true;
    }
  );
});

test('Model 3: SavedLocation schema validation: Requires city_name, latitude and longitude', async () => {
  const loc = new SavedLocation({
    userId: 'test-user-loc',
  });

  await assert.rejects(
    async () => {
      await loc.validate();
    },
    (err) => {
      assert.ok(err.errors.city_name);
      assert.ok(err.errors.latitude);
      assert.ok(err.errors.longitude);
      return true;
    }
  );
});

test('Model 4: WeatherSnapshot schema validation: Correctly structures cached snapshot', async () => {
  const snapshot = new WeatherSnapshot({
    city: 'Jaipur',
    temperature: 32.5,
    weatherCondition: 'Sunny',
    metrics: { uvIndex: 6.5 },
  });

  await snapshot.validate();
  assert.equal(snapshot.city, 'Jaipur');
  assert.equal(snapshot.dataSource, 'Open-Meteo');
});

test('Model 5: WeatherAlert schema validation: Rejects invalid severity values', async () => {
  const alert = new WeatherAlert({
    city: 'Mumbai',
    event: 'Storm Surge',
    headline: 'High winds',
    description: 'Detailed alert notes',
    severity: 'catastrophic_invalid',
  });

  await assert.rejects(
    async () => {
      await alert.validate();
    },
    (err) => {
      assert.ok(err.errors.severity);
      return true;
    }
  );
});
