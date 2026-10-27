import {
  Sun,
  SunMedium,
  CloudSun,
  Cloud,
  CloudRain,
  CloudRainWind,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudSnow,
  Wind,
  Droplets,
  Gauge,
  Sunrise,
  Sunset,
  Star,
  Activity,
  Umbrella,
} from 'lucide-react';
import { formatTemp } from '../utils/temperature';

// Dynamic icon mapper matching Open-Meteo WMO conditions
const renderWeatherIcon = (iconName, size = 48) => {
  switch (iconName) {
    case 'Sun':
      return <Sun size={size} className="icon-gold" aria-hidden="true" />;
    case 'SunMedium':
      return <SunMedium size={size} className="icon-gold" aria-hidden="true" />;
    case 'CloudSun':
      return <CloudSun size={size} className="icon-sky" aria-hidden="true" />;
    case 'Cloud':
      return <Cloud size={size} className="icon-cloud" aria-hidden="true" />;
    case 'CloudRain':
      return <CloudRain size={size} className="icon-blue" aria-hidden="true" />;
    case 'CloudRainWind':
      return <CloudRainWind size={size} className="icon-blue" aria-hidden="true" />;
    case 'CloudDrizzle':
      return <CloudDrizzle size={size} className="icon-blue" aria-hidden="true" />;
    case 'CloudFog':
      return <CloudFog size={size} className="icon-cloud" aria-hidden="true" />;
    case 'CloudLightning':
    case 'Zap':
      return <CloudLightning size={size} className="icon-amber" aria-hidden="true" />;
    case 'CloudSnow':
      return <CloudSnow size={size} className="icon-snow" aria-hidden="true" />;
    default:
      return <CloudSun size={size} className="icon-sky" aria-hidden="true" />;
  }
};

export const CurrentWeather = ({
  weather,
  temperatureUnit,
  isFavorite,
  onToggleFavorite,
}) => {
  if (!weather || !weather.current) return null;

  const { location, current, daily = [], attribution, isLive, lastUpdated } = weather;
  const todayDaily = daily[0] || {};

  const aqi = current.aqi;
  const uv = current.uvIndex;
  const rainProb = current.precipitationProbability ?? todayDaily.precipitationProbabilityMax ?? null;

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <section className="current-weather-card" aria-label="Current Atmospheric Conditions">
      {/* Top Location Bar: City, Region, Save Button */}
      <div className="current-header">
        <div className="location-info">
          <div className="location-title-row">
            <h2 className="location-name">{location.city}</h2>
            {location.state && (
              <span className="location-state">
                {location.state}, {location.country || 'India'}
              </span>
            )}
          </div>
          <div className="telemetry-badges">
            <span className={`live-badge ${isLive ? 'live' : 'fixture'}`}>
              <span className="live-dot" aria-hidden="true" />
              {isLive ? 'Live Weather' : 'Cached Data'}
            </span>
            {formattedTime && (
              <span className="last-sync-badge">
                Updated {formattedTime}
              </span>
            )}
            <span className="source-badge" title="Data provider">
              {attribution || 'Open-Meteo'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={`favorite-toggle-btn ${isFavorite ? 'favorited' : ''}`}
          onClick={onToggleFavorite}
          title={isFavorite ? 'Remove city from saved' : 'Save city to favorites'}
          aria-label={isFavorite ? `Remove ${location.city} from saved locations` : `Save ${location.city} to favorites`}
        >
          <Star
            size={16}
            fill={isFavorite ? '#F59E0B' : 'none'}
            color={isFavorite ? '#F59E0B' : 'currentColor'}
            aria-hidden="true"
          />
          <span>{isFavorite ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* Main Temperature & Weather Hero Cluster */}
      <div className="current-hero-display">
        <div className="hero-icon-temp">
          <div className="weather-large-icon" aria-label={`Weather condition: ${current.weatherCondition}`}>
            {renderWeatherIcon(current.weatherIcon, 68)}
          </div>
          <div className="temp-cluster">
            <div className="primary-temp" aria-label={`Current temperature ${formatTemp(current.temperature, temperatureUnit)}`}>
              {formatTemp(current.temperature, temperatureUnit)}
            </div>
            <div className="temp-sub-info">
              <span className="condition-text">{current.weatherCondition}</span>
              <span className="feels-like">
                Feels like {formatTemp(current.apparentTemperature, temperatureUnit)}
              </span>
            </div>
          </div>
        </div>

        {/* High / Low & Sunrise / Sunset */}
        <div className="sun-diurnal-cluster">
          <div className="diurnal-range" aria-label="High and low temperature range">
            <span className="high-temp" title="Expected High">
              ▲ {formatTemp(todayDaily.tempMax, temperatureUnit)}
            </span>
            <span className="low-temp" title="Expected Low">
              ▼ {formatTemp(todayDaily.tempMin, temperatureUnit)}
            </span>
          </div>
          <div className="sun-times-row">
            {todayDaily.sunrise && (
              <div className="sun-item" title="Sunrise">
                <Sunrise size={15} className="icon-gold" aria-hidden="true" />
                <span>{todayDaily.sunrise} AM</span>
              </div>
            )}
            {todayDaily.sunset && (
              <div className="sun-item" title="Sunset">
                <Sunset size={15} className="icon-amber" aria-hidden="true" />
                <span>{todayDaily.sunset} PM</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Atmospheric Metrics Grid (6 tiles) */}
      <div className="telemetry-grid">
        {/* Humidity */}
        <div className="telemetry-tile">
          <div className="tile-header">
            <Droplets size={15} className="tile-icon" aria-hidden="true" />
            <span className="tile-label">Humidity</span>
          </div>
          <div className="tile-value">
            {current.relativeHumidity !== null && current.relativeHumidity !== undefined
              ? `${current.relativeHumidity}%`
              : 'Unavailable'}
          </div>
          <div className="tile-subtext">
            {current.relativeHumidity > 70
              ? 'High humidity'
              : current.relativeHumidity < 30
              ? 'Dry air'
              : 'Comfortable'}
          </div>
        </div>

        {/* Wind Speed */}
        <div className="telemetry-tile">
          <div className="tile-header">
            <Wind size={15} className="tile-icon" aria-hidden="true" />
            <span className="tile-label">Wind</span>
          </div>
          <div className="tile-value">
            {current.windSpeed !== null && current.windSpeed !== undefined
              ? `${current.windSpeed} km/h`
              : 'Unavailable'}
          </div>
          <div className="tile-subtext">
            {current.windGusts !== null ? `Gusts: ${current.windGusts} km/h` : 'Gentle breeze'}
          </div>
        </div>

        {/* Rain Probability */}
        <div className="telemetry-tile">
          <div className="tile-header">
            <Umbrella size={15} className="tile-icon" aria-hidden="true" />
            <span className="tile-label">Precipitation</span>
          </div>
          <div className="tile-value">
            {rainProb !== null && rainProb !== undefined ? `${rainProb}%` : '0%'}
          </div>
          <div className="tile-subtext">
            {rainProb > 50 ? 'Rain likely' : rainProb > 20 ? 'Slight chance' : 'Low chance'}
          </div>
        </div>

        {/* UV Index */}
        <div className="telemetry-tile">
          <div className="tile-header">
            <Sun size={15} className="tile-icon" aria-hidden="true" />
            <span className="tile-label">UV Index</span>
          </div>
          <div className="tile-value">
            {uv !== null && uv !== undefined ? `${Number(uv).toFixed(1)}` : 'Unavailable'}
          </div>
          <div className="tile-subtext">
            {uv >= 8 ? 'Very High (Caution)' : uv >= 6 ? 'High (SPF Advised)' : uv >= 3 ? 'Moderate' : 'Low risk'}
          </div>
        </div>

        {/* Surface Pressure */}
        <div className="telemetry-tile">
          <div className="tile-header">
            <Gauge size={15} className="tile-icon" aria-hidden="true" />
            <span className="tile-label">Pressure</span>
          </div>
          <div className="tile-value">
            {current.surfacePressure !== null && current.surfacePressure !== undefined
              ? `${Math.round(current.surfacePressure)} hPa`
              : 'Unavailable'}
          </div>
          <div className="tile-subtext">Atmospheric</div>
        </div>

        {/* Air Quality (AQI) */}
        <div className="telemetry-tile aqi-tile">
          <div className="tile-header">
            <Activity size={15} className="tile-icon" aria-hidden="true" />
            <span className="tile-label">Air Quality (AQI)</span>
          </div>
          <div className="tile-value">
            {aqi?.isAvailable && aqi.usAqi !== null ? (
              <span className={`aqi-indicator cat-${aqi.category?.toLowerCase().replace(/\s+/g, '-')}`}>
                {aqi.usAqi} • {aqi.category}
              </span>
            ) : (
              <span className="unavailable-text">Station Offline</span>
            )}
          </div>
          <div className="tile-subtext">
            {aqi?.isAvailable && aqi.pm25 !== null ? `PM2.5: ${aqi.pm25} µg/m³` : 'Standard telemetry'}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CurrentWeather;
