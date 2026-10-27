-- Mausam Personalized Database Schema
-- SIH Problem Statement ID: SIH26076

-- 1. User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id VARCHAR(64) PRIMARY KEY,
  profiles JSONB NOT NULL DEFAULT '["commuter", "health"]'::jsonb,
  preferred_city VARCHAR(100) NOT NULL DEFAULT 'Mumbai',
  temperature_unit VARCHAR(10) NOT NULL DEFAULT 'celsius',
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  categories JSONB NOT NULL DEFAULT '["health", "commute", "fitness"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on user_id (primary key already has unique index, adding comment for clarity)
COMMENT ON TABLE user_preferences IS 'Stores personalized profile selections and dashboard settings for users';

-- 2. Saved Locations Table
CREATE TABLE IF NOT EXISTS saved_locations (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  city_name VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_city UNIQUE (user_id, city_name)
);

CREATE INDEX IF NOT EXISTS idx_saved_locations_user ON saved_locations (user_id);

-- 3. Weather Snapshots & Cache Table (for rate limit mitigation and faster responses)
CREATE TABLE IF NOT EXISTS weather_snapshots (
  id SERIAL PRIMARY KEY,
  city_key VARCHAR(100) NOT NULL UNIQUE,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  weather_data JSONB NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weather_snapshots_key ON weather_snapshots (city_key);

-- 4. Weather Alerts Table
CREATE TABLE IF NOT EXISTS weather_alerts (
  id SERIAL PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  event VARCHAR(150) NOT NULL,
  headline TEXT NOT NULL,
  description TEXT,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('advisory', 'watch', 'warning', 'severe')),
  is_verified BOOLEAN DEFAULT true,
  source VARCHAR(150) DEFAULT 'India Meteorological Department (IMD) / MoES',
  precautions JSONB DEFAULT '[]'::jsonb,
  effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  effective_to TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_weather_alerts_city ON weather_alerts (city);

-- Seed Initial MoES Verified Coastal Advisory for Mumbai
INSERT INTO weather_alerts (city, event, headline, description, severity, is_verified, source, precautions, effective_from, effective_to)
VALUES (
  'Mumbai',
  'Coastal Marine & High Tide Advisory',
  'High Tide & Spring Swell Advisory for Greater Mumbai and Coastal Konkan',
  'Astronomical spring high tide reaching 4.18 meters expected along Gateway of India, Marine Drive, and coastal promenades. Sea condition rough to very rough with swell waves.',
  'advisory',
  true,
  'Indian National Centre for Ocean Information Services (INCOIS) / MoES',
  '[
    "Avoid swimming, wading, or water sports along unprotected beaches and rocky shores.",
    "Fishermen and small coastal craft operators are advised to stay moored in designated harbors.",
    "Avoid gathering on sea promenades during peak high tide hours (11:30 - 14:00).",
    "Monitor official MoES / IMD weather bulletins for real-time swell updates."
  ]'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '3 days'
)
ON CONFLICT DO NOTHING;

-- Seed Default Demo User if not exists
INSERT INTO user_preferences (user_id, profiles, preferred_city, temperature_unit, language)
VALUES (
  'demo-user',
  '["health", "commuter", "outdoor_fitness"]'::jsonb,
  'Mumbai',
  'celsius',
  'en'
)
ON CONFLICT (user_id) DO NOTHING;

-- Seed Sample Demo Locations for demo-user
INSERT INTO saved_locations (user_id, city_name, state, country, latitude, longitude, is_favorite)
VALUES
  ('demo-user', 'Mumbai', 'Maharashtra', 'India', 19.0760, 72.8777, true),
  ('demo-user', 'New Delhi', 'Delhi', 'India', 28.6139, 77.2090, false),
  ('demo-user', 'Bengaluru', 'Karnataka', 'India', 12.9716, 77.5946, false)
ON CONFLICT (user_id, city_name) DO NOTHING;
