import { useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  ShieldCheck,
  PhoneCall,
  X,
} from 'lucide-react';

export const AlertDetailModal = ({ alert, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!alert) return null;

  const severity = alert.severity || 'warning';

  const formatTimestamp = (ts) => {
    if (!ts) return 'Current Bulletin Window';
    try {
      return new Date(ts).toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  const precautions = alert.precautions && alert.precautions.length > 0
    ? alert.precautions
    : [
        'Stay indoors during peak inclement weather bursts.',
        'Avoid coastal promenades, seawalls, and waterlogged low-lying areas.',
        'Keep emergency battery backups and mobile devices charged.',
        'Follow verified bulletins issued by regional meteorological authorities.',
      ];

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
    >
      <div className="modal-container alert-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header with Severity Theme */}
        <div className={`modal-header alert-modal-header ${severity}`}>
          <div className="modal-title-group">
            <div className="alert-badge-wrap" aria-hidden="true">
              {severity === 'severe' || severity === 'warning' ? (
                <AlertOctagon size={28} className="alert-header-icon" />
              ) : (
                <AlertTriangle size={28} className="alert-header-icon" />
              )}
            </div>
            <div>
              <div className="alert-meta-tags">
                <span className={`severity-tag ${severity}`}>
                  {severity.toUpperCase()}
                </span>
                <span className="verified-bulletin-pill">
                  <ShieldCheck size={13} aria-hidden="true" />
                  Verified Bulletin
                </span>
              </div>
              <h3 id="alert-modal-title" className="alert-modal-title">{alert.event}</h3>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close alert details dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="alert-modal-body">
          {/* Headline */}
          <div className="alert-headline-callout">
            <h4>{alert.headline}</h4>
          </div>

          {/* Alert Description */}
          {alert.description && (
            <div className="alert-section">
              <h5 className="section-subtitle-heading">Situation Overview</h5>
              <p className="alert-desc-text">{alert.description}</p>
            </div>
          )}

          {/* Time & Authority Grid */}
          <div className="alert-info-grid">
            <div className="alert-info-cell">
              <div className="info-cell-label">
                <Calendar size={14} aria-hidden="true" />
                <span>Effective Window</span>
              </div>
              <div className="info-cell-value">
                {formatTimestamp(alert.effectiveFrom || alert.effective_from)}
              </div>
              <div className="info-cell-sub">
                Until: {formatTimestamp(alert.effectiveTo || alert.effective_to)}
              </div>
            </div>

            <div className="alert-info-cell">
              <div className="info-cell-label">
                <Building size={14} aria-hidden="true" />
                <span>Issuing Authority</span>
              </div>
              <div className="info-cell-value">
                {alert.source || 'Regional Meteorological Department'}
              </div>
              <div className="info-cell-sub">Verified Advisory Feed</div>
            </div>
          </div>

          {/* Citizen Precautions List */}
          <div className="precautions-section">
            <h5 className="section-subtitle-heading">Recommended Safety Precautions</h5>
            <ul className="precautions-list">
              {precautions.map((item, idx) => (
                <li key={idx} className="precaution-item">
                  <CheckCircle2 size={16} className="icon-emerald check-bullet" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Disaster Helpline Footer */}
          <div className="emergency-helpline-box">
            <PhoneCall size={16} className="icon-gold" aria-hidden="true" />
            <span>
              National Disaster Management Helpline: <strong>1078</strong> • Emergency Services: <strong>112</strong>
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDetailModal;
