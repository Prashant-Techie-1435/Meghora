import { useEffect } from 'react';
import {
  SunMedium,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudSnow,
  Droplets,
  Wind,
  Gauge,
  Sunrise,
  X,
  CheckCircle2,
} from 'lucide-react';
import { formatTemp } from '../utils/temperature';

const renderModalIcon = (iconName, size = 36) => {
  switch (iconName) {
    case 'Sun':
    case 'SunMedium':
      return <SunMedium size={size} className="icon-gold" />;
    case 'CloudSun':
      return <CloudSun size={size} className="icon-sky" />;
    case 'Cloud':
      return <Cloud size={size} className="icon-cloud" />;
    case 'CloudRain':
    case 'CloudRainWind':
      return <CloudRain size={size} className="icon-blue" />;
    case 'CloudDrizzle':
      return <CloudDrizzle size={size} className="icon-blue" />;
    case 'CloudFog':
      return <CloudFog size={size} className="icon-cloud" />;
    case 'CloudLightning':
    case 'Zap':
      return <CloudLightning size={size} className="icon-amber" />;
    case 'CloudSnow':
      return <CloudSnow size={size} className="icon-snow" />;
    default:
      return <CloudSun size={size} className="icon-sky" />;
  }
};

export const ForecastDetailModal = ({
  item,
  type = 'hourly', // 'hourly' | 'daily'
  temperatureUnit = 'celsius',
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const isHourly = type === 'hourly';

  const title = isHourly
    ? `Hourly Forecast — ${item.time || item.fullTime}`
    : `Daily Outlook — ${item.date}`;

  const rainProb = isHourly ? (item.precipitationProbability ?? 0) : (item.rainProbMax ?? 0);
  const uvVal = isHourly ? (item.uvIndex ?? 0) : (item.uvIndexMax ?? 0);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="forecast-modal-title">
      <div className="modal-container forecast-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="forecast-modal-icon-wrap">
              {renderModalIcon(item.icon, 36)}
            </div>
            <div>
              <h3 id="forecast-modal-title" className="modal-title">{title}</h3>
              <p className="modal-subtitle">
                {item.condition || 'Detailed Meteorological Analysis'}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="forecast-detail-body">
          {/* Main Hero Temp & Condition */}
          <div className="forecast-detail-hero">
            <div className="hero-temp-large">
              {isHourly ? (
                formatTemp(item.temperature, temperatureUnit)
              ) : (
                <>
                  <span className="high-val">▲ {formatTemp(item.tempMax, temperatureUnit)}</span>
                  <span className="low-val">▼ {formatTemp(item.tempMin, temperatureUnit)}</span>
                </>
              )}
            </div>
            <div className="hero-condition-badge">
              <span>{item.condition}</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="forecast-grid-metrics">
            {/* Rain Chance */}
            <div className="f-metric-tile">
              <div className="f-metric-header">
                <Droplets size={16} className="tile-icon" />
                <span>Precipitation Probability</span>
              </div>
              <div className="f-metric-value">{rainProb}%</div>
              <div className="f-metric-sub">
                {rainProb > 50 ? 'Rain Expected (Carry Umbrella)' : rainProb > 20 ? 'Slight Chance' : 'Dry Conditions'}
              </div>
            </div>

            {/* Precipitation Amount if daily */}
            {!isHourly && (
              <div className="f-metric-tile">
                <div className="f-metric-header">
                  <Droplets size={16} className="tile-icon" />
                  <span>Rainfall Volume</span>
                </div>
                <div className="f-metric-value">{item.precipitationSum ?? 0} mm</div>
                <div className="f-metric-sub">Accumulated Precipitation</div>
              </div>
            )}

            {/* UV Index */}
            <div className="f-metric-tile">
              <div className="f-metric-header">
                <SunMedium size={16} className="tile-icon icon-gold" />
                <span>{isHourly ? 'UV Index' : 'Peak UV Index'}</span>
              </div>
              <div className="f-metric-value">{Number(uvVal).toFixed(1)} / 11+</div>
              <div className="f-metric-sub">
                {uvVal >= 8 ? 'Very High (Avoid Peak Sun)' : uvVal >= 6 ? 'High (Sunscreen Needed)' : 'Low to Moderate'}
              </div>
            </div>

            {/* Wind */}
            <div className="f-metric-tile">
              <div className="f-metric-header">
                <Wind size={16} className="tile-icon" />
                <span>{isHourly ? 'Wind Speed' : 'Max Wind Speed'}</span>
              </div>
              <div className="f-metric-value">
                {isHourly ? (item.windSpeed !== null ? `${item.windSpeed} km/h` : 'N/A') : `${item.windSpeedMax ?? 0} km/h`}
              </div>
              <div className="f-metric-sub">Surface Breeze</div>
            </div>

            {/* Humidity if hourly */}
            {isHourly && item.relativeHumidity !== undefined && (
              <div className="f-metric-tile">
                <div className="f-metric-header">
                  <Gauge size={16} className="tile-icon" />
                  <span>Relative Humidity</span>
                </div>
                <div className="f-metric-value">{item.relativeHumidity}%</div>
                <div className="f-metric-sub">
                  {item.relativeHumidity > 70 ? 'Humid' : item.relativeHumidity < 30 ? 'Dry' : 'Comfortable'}
                </div>
              </div>
            )}

            {/* Sun Times if daily */}
            {!isHourly && item.sunrise && (
              <div className="f-metric-tile">
                <div className="f-metric-header">
                  <Sunrise size={16} className="tile-icon icon-gold" />
                  <span>Sunrise & Sunset</span>
                </div>
                <div className="f-metric-value text-sm">{item.sunrise} / {item.sunset}</div>
                <div className="f-metric-sub">Daylight Duration</div>
              </div>
            )}
          </div>

          {/* Citizen Recommendation Box */}
          <div className="forecast-advice-box">
            <div className="advice-header">
              <CheckCircle2 size={16} className="icon-emerald" />
              <strong>Citizen Planning Guidance</strong>
            </div>
            <p className="advice-desc">
              {rainProb > 50
                ? 'High precipitation probability during this window. If travelling or running errands outdoors, carry waterproof gear and allow additional transit buffer time.'
                : uvVal >= 6
                ? 'High UV radiation index. If engaged in outdoor fitness, agricultural work, or beach activities, apply SPF 30+ sunscreen and wear protective eyewear.'
                : 'Favourable weather conditions for outdoor activities, daily commuting, and travel.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForecastDetailModal;
