import { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Bookmark,
  RefreshCw,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import api from '../services/api';

export const WeatherHeader = ({
  city,
  onSearchCity,
  temperatureUnit,
  onToggleUnit,
  onOpenProfiles,
  onToggleSavedLocations,
  savedLocationsCount,
  onRefresh,
  isLoading,
  lastUpdated,
  onSimulateError,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchWrapperRef = useRef(null);

  const quickCities = ['Mumbai', 'New Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Goa'];

  // Debounced geocoding search suggestions as the user types
  useEffect(() => {
    if (!searchInput.trim() || searchInput.trim().length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const res = await api.searchCities(searchInput.trim());
        if (res.data) {
          setSuggestions(res.data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.warn('[Suggestions Error]:', err.message);
      } finally {
        setIsSuggesting(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Click outside listener to dismiss autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (!val.trim() || val.trim().length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      setShowDropdown(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchCity(searchInput.trim());
      setSearchInput('');
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelectSuggestion = (suggestedCity) => {
    onSearchCity(suggestedCity.name);
    setSearchInput('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleQuickCityClick = (c) => {
    onSearchCity(c);
  };

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <header className="weather-header">
      <div className="header-inner">
        {/* Brand: Meghora with clean modern vector weather icon */}
        <div className="brand-group">
          <div className="logo-badge" aria-hidden="true">
            <svg
              className="logo-svg"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
            >
              <circle cx="21" cy="11" r="6" fill="#F59E0B" />
              <path
                d="M23 23H9C6.24 23 4 20.76 4 18C4 15.36 6.05 13.2 8.68 13.03C9.67 9.54 12.87 7 16.65 7C20.9 7 24.42 10.19 24.89 14.37C27.13 14.85 28.75 16.82 28.75 19.16C28.75 21.78 26.62 23 23 23Z"
                fill="#38BDF8"
              />
            </svg>
          </div>
          <span className="brand-title">Meghora</span>
        </div>

        {/* Central Search Form & Live Autocomplete */}
        <div className="search-form-container" ref={searchWrapperRef}>
          <form className="search-form" onSubmit={handleSubmit} role="search">
            <div className="search-input-wrapper">
              <MapPin size={17} className="search-icon" aria-hidden="true" />
              <input
                type="text"
                className="search-input"
                placeholder={`Search city, district, or region (current: ${city})...`}
                value={searchInput}
                onChange={handleInputChange}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                aria-label="Search city or location"
                aria-autocomplete="list"
                aria-expanded={showDropdown}
              />

              {isSuggesting && <Loader2 size={16} className="spinning search-spinner" aria-hidden="true" />}

              {searchInput && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchInput('');
                    setSuggestions([]);
                    setShowDropdown(false);
                  }}
                  aria-label="Clear search text"
                >
                  <X size={15} />
                </button>
              )}

              <button
                type="submit"
                className="search-submit-btn"
                disabled={!searchInput.trim() || isLoading}
                aria-label="Submit search"
              >
                <Search size={15} />
                <span className="search-btn-text">Search</span>
              </button>
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="search-suggestions-dropdown" role="listbox" aria-label="Search suggestions">
              {suggestions.map((sug, idx) => (
                <button
                  key={`${sug.name}-${sug.latitude}-${idx}`}
                  type="button"
                  className="suggestion-item"
                  role="option"
                  aria-selected="false"
                  onClick={() => handleSelectSuggestion(sug)}
                >
                  <MapPin size={15} className="sug-icon" aria-hidden="true" />
                  <div className="sug-text">
                    <span className="sug-name">{sug.name}</span>
                    <span className="sug-meta">
                      {sug.state ? `${sug.state}, ` : ''}{sug.country}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Header Action Controls */}
        <div className="header-actions">
          {/* Temperature Unit Switcher */}
          <div className="unit-toggle" role="group" aria-label="Temperature unit selector">
            <button
              type="button"
              className={`unit-btn ${temperatureUnit === 'celsius' ? 'active' : ''}`}
              onClick={() => onToggleUnit('celsius')}
              aria-label="Display temperature in Celsius"
              aria-pressed={temperatureUnit === 'celsius'}
            >
              °C
            </button>
            <button
              type="button"
              className={`unit-btn ${temperatureUnit === 'fahrenheit' ? 'active' : ''}`}
              onClick={() => onToggleUnit('fahrenheit')}
              aria-label="Display temperature in Fahrenheit"
              aria-pressed={temperatureUnit === 'fahrenheit'}
            >
              °F
            </button>
          </div>

          {/* Saved Locations Toggle */}
          <button
            type="button"
            className="action-pill-btn"
            onClick={onToggleSavedLocations}
            title="Saved Locations"
            aria-label={`Saved locations (${savedLocationsCount} saved)`}
          >
            <Bookmark size={15} />
            <span className="btn-label">Saved</span>
            {savedLocationsCount > 0 && <span className="counter-badge">{savedLocationsCount}</span>}
          </button>

          {/* Profiles & Personalization Settings */}
          <button
            type="button"
            className="action-pill-btn primary"
            onClick={onOpenProfiles}
            title="Configure Personalization Profiles"
            aria-label="Configure personalization profiles"
          >
            <SlidersHorizontal size={15} />
            <span className="btn-label">Personalize</span>
          </button>

          {/* Verification Tool: Simulate API Error */}
          {onSimulateError && (
            <button
              type="button"
              className="action-pill-btn tool-btn"
              onClick={onSimulateError}
              title="Test simulated API failure error state"
              aria-label="Test error state"
            >
              <AlertTriangle size={14} />
              <span className="btn-label">Test Error</span>
            </button>
          )}

          {/* Refresh Data */}
          <button
            type="button"
            className={`action-icon-btn ${isLoading ? 'spinning' : ''}`}
            onClick={onRefresh}
            title="Refresh Weather Forecast"
            aria-label="Refresh weather data"
            disabled={isLoading}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Popular Cities Strip */}
      <div className="quick-cities-bar">
        <span className="quick-label">Popular:</span>
        <div className="quick-pills-row">
          {quickCities.map((qc) => (
            <button
              key={qc}
              type="button"
              className={`quick-pill ${city.toLowerCase() === qc.toLowerCase() ? 'active' : ''}`}
              onClick={() => handleQuickCityClick(qc)}
              aria-label={`Switch weather to ${qc}`}
            >
              {qc}
            </button>
          ))}
        </div>
        {formattedTime && (
          <span className="last-sync-badge" title="Last synced weather">
            Synced: {formattedTime}
          </span>
        )}
      </div>
    </header>
  );
};

export default WeatherHeader;
