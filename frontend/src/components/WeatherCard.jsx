import { useState } from 'react';
import {
  HeartPulse,
  Activity,
  Waves,
  Compass,
  Users,
  Sprout,
  Car,
  CalendarDays,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

const getCategoryIcon = (category) => {
  switch (category) {
    case 'health':
      return <HeartPulse size={16} className="icon-category health" aria-hidden="true" />;
    case 'fitness':
      return <Activity size={16} className="icon-category fitness" aria-hidden="true" />;
    case 'beach':
      return <Waves size={16} className="icon-category beach" aria-hidden="true" />;
    case 'travel':
      return <Compass size={16} className="icon-category travel" aria-hidden="true" />;
    case 'family':
      return <Users size={16} className="icon-category family" aria-hidden="true" />;
    case 'agriculture':
      return <Sprout size={16} className="icon-category agriculture" aria-hidden="true" />;
    case 'commute':
      return <Car size={16} className="icon-category commute" aria-hidden="true" />;
    case 'event_planner':
      return <CalendarDays size={16} className="icon-category event" aria-hidden="true" />;
    default:
      return <Sparkles size={16} className="icon-category default" aria-hidden="true" />;
  }
};

export const WeatherCard = ({ card }) => {
  const [showExplanation, setShowExplanation] = useState(false);

  if (!card) return null;

  const { title, badge, category, content, scores, explanation, isSelectedProfile, dataStatus } = card;

  return (
    <article className={`personalized-card ${isSelectedProfile ? 'profile-matched' : ''}`} aria-label={title}>
      {/* Card Header */}
      <div className="card-top">
        <div className="card-title-group">
          <div className="icon-badge-row">
            {getCategoryIcon(category)}
            <span className="card-badge">{badge}</span>
            {isSelectedProfile && (
              <span className="matched-profile-chip" title="Matches your active persona profile">
                ★ Active Profile
              </span>
            )}
          </div>
          <h4 className="card-title">{title}</h4>
        </div>

        {/* Priority Score Display */}
        <div className="card-score-pill" title={`Relevance Score: ${scores?.total}%`}>
          <span className="score-val">{scores?.total}%</span>
          <span className="score-lbl">Match</span>
        </div>
      </div>

      {/* Main Headline */}
      <div className="card-headline-box">
        <p className="card-headline">{content?.headline}</p>
      </div>

      {/* 3 Key Metrics Grid */}
      <div className="card-metrics-grid">
        {content?.metric1 && (
          <div className="card-metric-cell">
            <span className="metric-label">{content.metric1.label}</span>
            <span className={`metric-val ${content.metric1.value === 'Unavailable' ? 'unavailable' : ''}`}>
              {content.metric1.value}
            </span>
            {content.metric1.status && (
              <span className="metric-status-tag">{content.metric1.status}</span>
            )}
          </div>
        )}

        {content?.metric2 && (
          <div className="card-metric-cell">
            <span className="metric-label">{content.metric2.label}</span>
            <span className={`metric-val ${content.metric2.value === 'Unavailable' ? 'unavailable' : ''}`}>
              {content.metric2.value}
            </span>
            {content.metric2.status && (
              <span className="metric-status-tag">{content.metric2.status}</span>
            )}
          </div>
        )}

        {content?.metric3 && (
          <div className="card-metric-cell">
            <span className="metric-label">{content.metric3.label}</span>
            <span className={`metric-val ${content.metric3.value === 'Unavailable' ? 'unavailable' : ''}`}>
              {content.metric3.value}
            </span>
            {content.metric3.status && (
              <span className="metric-status-tag">{content.metric3.status}</span>
            )}
          </div>
        )}
      </div>

      {/* Calculated Advice / Actionable Recommendation */}
      {content?.advice && (
        <div className="card-advice-box">
          <p className="advice-text">{content.advice}</p>
        </div>
      )}

      {/* Unavailable data note if applicable */}
      {dataStatus === 'unavailable' && (
        <div className="data-unavailable-note">
          <AlertTriangle size={13} aria-hidden="true" />
          <span>Coastal sensor telemetry offline for this parameter</span>
        </div>
      )}

      {/* Transparency / Score Breakdown Toggle */}
      <div className="card-transparency-row">
        <button
          type="button"
          className="transparency-btn"
          onClick={() => setShowExplanation(!showExplanation)}
          aria-expanded={showExplanation}
          aria-label="Toggle relevance score explanation"
        >
          <Info size={13} aria-hidden="true" />
          <span>Why this recommendation?</span>
          {showExplanation ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
        </button>

        {showExplanation && (
          <div className="explanation-drawer">
            <p className="explanation-summary">{explanation}</p>
            <div className="formula-factors">
              <span className="factor-tag">
                <strong>Profile:</strong> {scores?.breakdown?.profile}/5
              </span>
              <span className="factor-tag">
                <strong>Time:</strong> {scores?.breakdown?.time}/5
              </span>
              <span className="factor-tag">
                <strong>Location:</strong> {scores?.breakdown?.location}/5
              </span>
              <span className="factor-tag">
                <strong>Weather:</strong> {scores?.breakdown?.weather}/5
              </span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export default WeatherCard;
