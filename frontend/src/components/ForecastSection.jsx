import { useState } from 'react';
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
  Calendar,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { formatTemp } from '../utils/temperature';
import ForecastDetailModal from './ForecastDetailModal';

const renderIcon = (iconName, size = 22) => {
  switch (iconName) {
    case 'Sun':
    case 'SunMedium':
      return <SunMedium size={size} className="icon-gold" aria-hidden="true" />;
    case 'CloudSun':
      return <CloudSun size={size} className="icon-sky" aria-hidden="true" />;
    case 'Cloud':
      return <Cloud size={size} className="icon-cloud" aria-hidden="true" />;
    case 'CloudRain':
    case 'CloudRainWind':
      return <CloudRain size={size} className="icon-blue" aria-hidden="true" />;
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

export const ForecastSection = ({
  hourly = [],
  daily = [],
  temperatureUnit,
}) => {
  const [activeTab, setActiveTab] = useState('hourly'); // 'hourly' | 'daily'
  const [selectedForecast, setSelectedForecast] = useState(null); // { item, type }

  const formatDayName = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <section className="forecast-container" aria-label="Weather Forecast Outlook">
        {/* Tab Header Controls */}
        <div className="forecast-tabs-header">
          <div className="tabs-title-group">
            <h3 className="section-title">Forecast Outlook</h3>
            <span className="section-subtitle">
              Select any hour or day for detailed atmospheric analysis
            </span>
          </div>

          <div className="forecast-toggle-pills" role="tablist" aria-label="Forecast views">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'hourly'}
              aria-controls="hourly-tab-panel"
              id="hourly-tab-btn"
              className={`tab-pill ${activeTab === 'hourly' ? 'active' : ''}`}
              onClick={() => setActiveTab('hourly')}
            >
              <Clock size={14} aria-hidden="true" />
              <span>24-Hour</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'daily'}
              aria-controls="daily-tab-panel"
              id="daily-tab-btn"
              className={`tab-pill ${activeTab === 'daily' ? 'active' : ''}`}
              onClick={() => setActiveTab('daily')}
            >
              <Calendar size={14} aria-hidden="true" />
              <span>5-Day</span>
            </button>
          </div>
        </div>

        {/* Hourly View */}
        {activeTab === 'hourly' && (
          <div
            id="hourly-tab-panel"
            role="tabpanel"
            aria-labelledby="hourly-tab-btn"
            className="hourly-scroll-track"
            tabIndex={0}
            aria-label="Hourly Weather Forecast Strip"
          >
            {hourly.map((h, idx) => (
              <div
                key={h.time || idx}
                className="hourly-card clickable-forecast-card"
                onClick={() => setSelectedForecast({ item: h, type: 'hourly' })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedForecast({ item: h, type: 'hourly' });
                  }
                }}
                title={`Inspect forecast for ${h.time}`}
                aria-label={`${h.time}: ${h.weatherCondition}, ${formatTemp(h.temperature, temperatureUnit)}`}
              >
                <span className="hourly-time">{h.time}</span>
                <div className="hourly-icon-wrap">
                  {renderIcon(h.weatherIcon, 24)}
                </div>
                <span className="hourly-temp">
                  {formatTemp(h.temperature, temperatureUnit)}
                </span>

                {h.precipitationProbability !== null && h.precipitationProbability > 0 ? (
                  <span className="hourly-rain-wrap" title={`Rain probability: ${h.precipitationProbability}%`}>
                    <Droplets size={11} aria-hidden="true" />
                    <span>{h.precipitationProbability}%</span>
                  </span>
                ) : (
                  <span className="click-inspect-hint">Details</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Daily View */}
        {activeTab === 'daily' && (
          <div
            id="daily-tab-panel"
            role="tabpanel"
            aria-labelledby="daily-tab-btn"
            className="daily-forecast-list"
          >
            {daily.map((d, idx) => (
              <div
                key={d.date || idx}
                className="daily-row-card clickable-forecast-row"
                onClick={() => setSelectedForecast({ item: d, type: 'daily' })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedForecast({ item: d, type: 'daily' });
                  }
                }}
                title={`Inspect forecast for ${formatDayName(d.date)}`}
                aria-label={`${formatDayName(d.date)}: ${d.weatherCondition}, High ${formatTemp(d.tempMax, temperatureUnit)}, Low ${formatTemp(d.tempMin, temperatureUnit)}`}
              >
                <div className="day-col">
                  <span className="day-name">{formatDayName(d.date)}</span>
                  {idx === 0 && <span className="today-chip">Today</span>}
                </div>

                <div className="condition-col">
                  {renderIcon(d.weatherIcon, 22)}
                  <span className="day-condition-text">{d.weatherCondition}</span>
                </div>

                <div className="rain-col">
                  {d.precipitationProbabilityMax !== null && d.precipitationProbabilityMax > 0 ? (
                    <span className="rain-badge" title="Maximum precipitation probability">
                      <Droplets size={12} aria-hidden="true" />
                      <span>{d.precipitationProbabilityMax}%</span>
                    </span>
                  ) : (
                    <span className="no-rain-text">0%</span>
                  )}
                </div>

                <div className="temps-col">
                  <span className="low-temp">{formatTemp(d.tempMin, temperatureUnit)}</span>
                  <div className="temp-bar-track" aria-hidden="true">
                    <div className="temp-bar-fill" />
                  </div>
                  <span className="high-temp">{formatTemp(d.tempMax, temperatureUnit)}</span>
                </div>

                <ChevronRight size={16} className="row-arrow-icon" aria-hidden="true" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Forecast Detail Inspection Modal */}
      {selectedForecast && (
        <ForecastDetailModal
          forecast={selectedForecast.item}
          type={selectedForecast.type}
          temperatureUnit={temperatureUnit}
          onClose={() => setSelectedForecast(null)}
        />
      )}
    </>
  );
};

export default ForecastSection;
