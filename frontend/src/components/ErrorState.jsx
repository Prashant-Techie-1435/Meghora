import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export const ErrorState = ({ message, onRetry, onResetDefault }) => {
  return (
    <div className="error-card" role="alert">
      <div className="error-icon-wrap">
        <AlertCircle size={40} className="error-icon" />
      </div>
      <h3 className="error-title">Unable to Load Weather Feed</h3>
      <p className="error-message">
        {message || 'A network error or geocoding resolution timeout occurred. Please check your connection.'}
      </p>

      <div className="error-actions">
        {onRetry && (
          <button type="button" className="btn-primary" onClick={onRetry}>
            <RefreshCw size={16} />
            <span>Retry Request</span>
          </button>
        )}
        {onResetDefault && (
          <button type="button" className="btn-secondary" onClick={onResetDefault}>
            <Home size={16} />
            <span>Return to Mumbai</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
