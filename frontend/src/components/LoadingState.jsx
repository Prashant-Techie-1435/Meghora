export const LoadingState = () => {
  return (
    <div className="skeleton-container" aria-busy="true" aria-label="Loading weather dashboard">
      {/* Current Weather Skeleton */}
      <div className="skeleton-card hero-skeleton">
        <div className="skeleton-line title-line" />
        <div className="skeleton-line subtitle-line" />
        <div className="skeleton-row hero-row">
          <div className="skeleton-circle big-icon" />
          <div className="skeleton-line big-temp" />
        </div>
        <div className="skeleton-grid tiles-skeleton">
          <div className="skeleton-tile" />
          <div className="skeleton-tile" />
          <div className="skeleton-tile" />
          <div className="skeleton-tile" />
        </div>
      </div>

      {/* Forecast Strip Skeleton */}
      <div className="skeleton-card forecast-skeleton">
        <div className="skeleton-line section-line" />
        <div className="skeleton-strip">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-pill" />
          ))}
        </div>
      </div>

      {/* Personalized Cards Grid Skeleton */}
      <div className="skeleton-cards-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-card insight-skeleton">
            <div className="skeleton-line badge-line" />
            <div className="skeleton-line card-title-line" />
            <div className="skeleton-line card-body-line" />
            <div className="skeleton-row metrics-row">
              <div className="skeleton-tile small" />
              <div className="skeleton-tile small" />
              <div className="skeleton-tile small" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingState;
