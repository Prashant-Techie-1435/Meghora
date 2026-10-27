import { useState } from 'react';
import { AlertOctagon, AlertTriangle, ChevronRight, Info, ShieldAlert } from 'lucide-react';
import AlertDetailModal from './AlertDetailModal';

export const AlertBanner = ({ alerts = [] }) => {
  const [selectedAlert, setSelectedAlert] = useState(null);

  if (!alerts || alerts.length === 0) return null;

  return (
    <>
      <aside className="severe-alert-container" aria-label="Active Weather Alerts and Warnings">
        {alerts.map((alert, idx) => {
          const severityClass = alert.severity || 'warning';
          const isHighSeverity = severityClass === 'severe' || severityClass === 'warning';

          return (
            <div
              key={alert.id || idx}
              className={`alert-banner-card ${severityClass} clickable-alert`}
              onClick={() => setSelectedAlert(alert)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedAlert(alert);
                }
              }}
              title="Click to view full alert details, validity period, and recommended precautions"
              aria-label={`${alert.severity?.toUpperCase() || 'ALERT'}: ${alert.event}. Click for details.`}
            >
              <div className="alert-content-row">
                <div className="alert-icon-col" aria-hidden="true">
                  {isHighSeverity ? (
                    <AlertOctagon size={24} className="alert-pulse-icon" />
                  ) : (
                    <AlertTriangle size={24} className="alert-icon" />
                  )}
                </div>

                <div className="alert-body-col">
                  <div className="alert-headline-row">
                    <span className="severity-pill">
                      {alert.severity ? alert.severity.toUpperCase() : 'ALERT'}
                    </span>
                    <span className="verified-seal">
                      <ShieldAlert size={13} aria-hidden="true" />
                      Active Advisory
                    </span>
                    <span className="event-name">{alert.event}</span>
                  </div>
                  <h4 className="alert-headline-text">{alert.headline}</h4>
                  <div className="alert-click-hint">
                    <Info size={13} aria-hidden="true" />
                    <span>View precautions & issuing details</span>
                    <ChevronRight size={14} aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </aside>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </>
  );
};

export default AlertBanner;
