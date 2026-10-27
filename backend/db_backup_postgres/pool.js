import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;
let isDbConnected = false;

// Fallback in-memory store for offline development / test when PostgreSQL is stopped
const memoryStore = {
  preferences: {
    'demo-user': {
      user_id: 'demo-user',
      profiles: ['health', 'commuter', 'outdoor_fitness'],
      preferred_city: 'Mumbai',
      temperature_unit: 'celsius',
      language: 'en',
      categories: ['health', 'commute', 'fitness'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  savedLocations: [
    {
      id: 1,
      user_id: 'demo-user',
      city_name: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      latitude: 19.076,
      longitude: 72.8777,
      is_favorite: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      user_id: 'demo-user',
      city_name: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      latitude: 28.6139,
      longitude: 77.209,
      is_favorite: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      user_id: 'demo-user',
      city_name: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      latitude: 12.9716,
      longitude: 77.5946,
      is_favorite: false,
      created_at: new Date().toISOString(),
    },
  ],
  alerts: [
    {
      id: 1,
      city: 'Mumbai',
      event: 'Coastal Marine & High Tide Advisory',
      headline: 'High Tide & Spring Swell Advisory for Greater Mumbai and Coastal Konkan',
      description: 'Astronomical spring high tide reaching 4.18 meters expected along Gateway of India, Marine Drive, and coastal promenades. Sea condition rough to very rough with swell waves.',
      severity: 'advisory',
      is_verified: true,
      source: 'Indian National Centre for Ocean Information Services (INCOIS) / MoES',
      precautions: [
        'Avoid swimming, wading, or water sports along unprotected beaches and rocky shores.',
        'Fishermen and small coastal craft operators are advised to stay moored in designated harbors.',
        'Avoid gathering on sea promenades during peak high tide hours (11:30 - 14:00).',
        'Monitor official MoES / IMD weather bulletins for real-time swell updates.',
      ],
      effective_from: new Date().toISOString(),
      effective_to: new Date(Date.now() + 86400000 * 3).toISOString(),
    },
  ],
};

/**
 * Initialize PostgreSQL connection pool
 */
export const initPool = async () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn('[Database] DATABASE_URL not set. Running with resilient memory store.');
    return null;
  }

  try {
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost')
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });

    pool.on('error', (err) => {
      console.error('[Database Pool Error]:', err.message);
      isDbConnected = false;
    });

    // Test connection
    const client = await pool.connect();
    isDbConnected = true;
    console.log('[Database] Connected successfully to PostgreSQL.');

    // Run schema migrations/init
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('[Database] Schema initialization and seeding verified.');
      }
    } catch (schemaErr) {
      console.warn('[Database] Schema execution warning:', schemaErr.message);
    } finally {
      client.release();
    }

    return pool;
  } catch (err) {
    console.warn(`[Database] PostgreSQL connection unavailable (${err.message}). Using resilient memory fallback store.`);
    isDbConnected = false;
    return null;
  }
};

export const getPool = () => pool;
export const isConnected = () => isDbConnected;
export const getMemoryStore = () => memoryStore;

/**
 * Executes a parameterized SQL query with automatic fallback to memory store if DB is offline.
 */
export const query = async (text, params = []) => {
  if (pool && isDbConnected) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error('[Database Query Error]:', err.message);
      throw err;
    }
  }

  // If pool is not connected, simulate basic queries for memoryStore
  return handleMemoryFallbackQuery(text, params);
};

function handleMemoryFallbackQuery(text, params) {
  const normalized = text.toLowerCase();

  // SELECT preferences
  if (normalized.includes('from user_preferences') && normalized.includes('where user_id = $1')) {
    const userId = params[0];
    const user = memoryStore.preferences[userId];
    return { rows: user ? [user] : [] };
  }

  // INSERT / UPDATE preferences
  if (normalized.includes('insert into user_preferences') || normalized.includes('update user_preferences')) {
    const userId = params[0];
    const profiles = typeof params[1] === 'string' ? JSON.parse(params[1]) : params[1];
    const preferredCity = params[2];
    const tempUnit = params[3];
    const language = params[4];
    const categories = typeof params[5] === 'string' ? JSON.parse(params[5]) : (params[5] || []);

    const updated = {
      user_id: userId,
      profiles: profiles || ['health', 'commuter'],
      preferred_city: preferredCity || 'Mumbai',
      temperature_unit: tempUnit || 'celsius',
      language: language || 'en',
      categories: categories || [],
      updated_at: new Date().toISOString(),
    };
    memoryStore.preferences[userId] = updated;
    return { rows: [updated] };
  }

  // SELECT saved_locations
  if (normalized.includes('from saved_locations') && normalized.includes('where user_id = $1')) {
    const userId = params[0];
    const locs = memoryStore.savedLocations.filter((l) => l.user_id === userId);
    return { rows: locs };
  }

  // INSERT saved_location
  if (normalized.includes('insert into saved_locations')) {
    const userId = params[0];
    const cityName = params[1];
    const state = params[2];
    const country = params[3];
    const lat = params[4];
    const lon = params[5];
    const isFav = params[6] ?? false;

    // Remove existing if any
    memoryStore.savedLocations = memoryStore.savedLocations.filter(
      (l) => !(l.user_id === userId && l.city_name.toLowerCase() === cityName.toLowerCase())
    );

    const newLoc = {
      id: Date.now(),
      user_id: userId,
      city_name: cityName,
      state,
      country,
      latitude: Number(lat),
      longitude: Number(lon),
      is_favorite: Boolean(isFav),
      created_at: new Date().toISOString(),
    };
    memoryStore.savedLocations.push(newLoc);
    return { rows: [newLoc] };
  }

  // DELETE saved_location
  if (normalized.includes('delete from saved_locations')) {
    const userId = params[0];
    const locationId = Number(params[1]);
    const prevLen = memoryStore.savedLocations.length;
    memoryStore.savedLocations = memoryStore.savedLocations.filter(
      (l) => !(l.user_id === userId && (l.id === locationId || l.city_name.toLowerCase() === String(params[1]).toLowerCase()))
    );
    return { rowCount: prevLen - memoryStore.savedLocations.length };
  }

  // SELECT alerts
  if (normalized.includes('from weather_alerts')) {
    const city = params[0]?.toLowerCase();
    const alerts = city
      ? memoryStore.alerts.filter((a) => a.city.toLowerCase() === city)
      : memoryStore.alerts;
    return { rows: alerts };
  }

  // Default alive check
  if (normalized.includes('select 1')) {
    return { rows: [{ alive: 1 }] };
  }

  return { rows: [] };
}

/**
 * Close PostgreSQL pool gracefully
 */
export const closePool = async () => {
  if (pool) {
    try {
      await pool.end();
      console.log('[Database] PostgreSQL connection pool closed.');
    } catch (err) {
      console.error('[Database] Error closing pool:', err.message);
    }
  }
};
