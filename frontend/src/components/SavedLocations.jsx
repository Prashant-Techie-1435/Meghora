import { MapPin, Star, Trash2, X, Plus } from 'lucide-react';

export const SavedLocations = ({
  isOpen,
  onClose,
  locations = [],
  currentCity,
  onSelectCity,
  onDeleteLocation,
  onAddCurrentCity,
}) => {
  if (!isOpen) return null;

  const isCurrentSaved = locations.some(
    (l) => l.city_name.toLowerCase() === currentCity.toLowerCase()
  );

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container locations-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Star size={20} className="modal-icon gold" />
            <div>
              <h3 className="modal-title">Saved Locations</h3>
              <p className="modal-subtitle">Fast access to your frequently monitored cities</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {/* Action bar: Add current city */}
        <div className="locations-action-bar">
          <button
            type="button"
            className="btn-add-current"
            onClick={onAddCurrentCity}
            disabled={isCurrentSaved}
          >
            <Plus size={16} />
            <span>{isCurrentSaved ? `"${currentCity}" already saved` : `Save "${currentCity}" to favorites`}</span>
          </button>
        </div>

        {/* Locations List */}
        <div className="locations-list">
          {locations.length === 0 ? (
            <div className="empty-locations">
              <MapPin size={32} className="empty-icon" />
              <p>No saved locations yet.</p>
              <span>Bookmark your favorite cities for one-tap switching.</span>
            </div>
          ) : (
            locations.map((loc) => {
              const isSelected = loc.city_name.toLowerCase() === currentCity.toLowerCase();

              return (
                <div key={loc.id || loc.city_name} className={`location-item ${isSelected ? 'active-location' : ''}`}>
                  <button
                    type="button"
                    className="location-select-btn"
                    onClick={() => {
                      onSelectCity(loc.city_name);
                      onClose();
                    }}
                  >
                    <MapPin size={16} className={isSelected ? 'icon-active' : ''} />
                    <div className="location-name-group">
                      <span className="loc-city">{loc.city_name}</span>
                      <span className="loc-meta">
                        {loc.state ? `${loc.state}, ` : ''}{loc.country || 'India'}
                      </span>
                    </div>
                    {isSelected && <span className="viewing-chip">Currently Viewing</span>}
                  </button>

                  <button
                    type="button"
                    className="location-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLocation(loc.id || loc.city_name);
                    }}
                    title={`Delete ${loc.city_name}`}
                    aria-label={`Remove ${loc.city_name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavedLocations;
