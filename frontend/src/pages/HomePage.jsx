import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import WeatherHeader from '../components/WeatherHeader';
import CurrentWeather from '../components/CurrentWeather';
import ForecastSection from '../components/ForecastSection';
import WeatherCard from '../components/WeatherCard';
import AlertBanner from '../components/AlertBanner';
import ProfileSelector from '../components/ProfileSelector';
import SavedLocations from '../components/SavedLocations';
import CategoryBar from '../components/CategoryBar';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { SlidersHorizontal, Sparkles, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';

const USER_ID = 'demo-user';
const INITIAL_CARD_LIMIT = 3;

const PROFILE_LABELS = {
  health: 'Health & AQI',
  outdoor_fitness: 'Outdoor Fitness',
  beach: 'Beach & Marine',
  travel: 'Travel & Packing',
  family: 'Family & School',
  agriculture: 'Agriculture',
  commuter: 'Daily Commute',
  event_planner: 'Event Planning',
};

export const HomePage = () => {
  const [city, setCity] = useState('Mumbai');
  const [weatherData, setWeatherData] = useState(null);
  const [severeAlerts, setSevereAlerts] = useState([]);
  const [personalizedCards, setPersonalizedCards] = useState([]);
  const [activeProfiles, setActiveProfiles] = useState(['health', 'commuter', 'outdoor_fitness']);
  const [temperatureUnit, setTemperatureUnit] = useState('celsius');
  const [savedLocations, setSavedLocations] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAllCards, setShowAllCards] = useState(false);

  // Fetch full homepage feed (Weather + Ranked Personalized Cards + Alerts)
  const loadHomepageFeed = useCallback(async (targetCity) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getHomepage(targetCity, USER_ID);
      const { weather, severeAlerts: alerts, personalizedCards: cards } = response.data;

      setWeatherData(weather);
      setSevereAlerts(alerts || []);
      setPersonalizedCards(cards || []);
      setLastUpdated(weather.lastUpdated || new Date().toISOString());
      if (weather.location?.city) {
        setCity(weather.location.city);
      }
    } catch (err) {
      console.error('[Feed Error]:', err);
      setError(err.message || 'Unable to load weather forecast for this location.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load: Restore user preferences and saved locations from database
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      let initialCity = 'Mumbai';
      try {
        const [prefRes, locsRes] = await Promise.allSettled([
          api.getPreferences(USER_ID),
          api.getSavedLocations(USER_ID),
        ]);

        if (!isMounted) return;

        if (prefRes.status === 'fulfilled' && prefRes.value?.data) {
          const pref = prefRes.value.data;
          if (pref.profiles && Array.isArray(pref.profiles)) {
            setActiveProfiles(pref.profiles);
          }
          if (pref.temperature_unit) {
            setTemperatureUnit(pref.temperature_unit);
          }
          if (pref.preferred_city) {
            initialCity = pref.preferred_city;
          }
        }

        if (locsRes.status === 'fulfilled' && locsRes.value?.data) {
          setSavedLocations(locsRes.value.data);
        }
      } catch (err) {
        console.warn('[Setup Warning] Using fallback initial configuration:', err.message);
      }

      if (isMounted) {
        await loadHomepageFeed(initialCity);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [loadHomepageFeed]);

  // Handle City Search
  const handleSearchCity = (newCity) => {
    if (newCity && newCity.trim()) {
      setShowAllCards(false);
      loadHomepageFeed(newCity.trim());
    }
  };

  // Toggle Temperature Unit (°C <-> °F) and persist in database
  const handleToggleUnit = async (newUnit) => {
    setTemperatureUnit(newUnit);
    try {
      await api.updatePreferences(USER_ID, {
        temperature_unit: newUnit,
        profiles: activeProfiles,
        preferred_city: city,
      });
    } catch (err) {
      console.warn('[Preference Update Warning]:', err.message);
    }
  };

  // Save updated profiles and re-rank homepage cards
  const handleSaveProfiles = async (newProfiles) => {
    setIsSaving(true);
    try {
      await api.updatePreferences(USER_ID, {
        profiles: newProfiles,
        preferred_city: city,
        temperature_unit: temperatureUnit,
      });
      setActiveProfiles(newProfiles);
      setIsProfileModalOpen(false);

      // Re-fetch homepage to re-score and re-rank with updated profiles
      await loadHomepageFeed(city);
    } catch (err) {
      console.error('[Save Profiles Error]:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle single profile from category bar
  const handleToggleSingleProfile = async (profileId) => {
    if (!profileId) return;
    const exists = activeProfiles.includes(profileId);
    const updated = exists
      ? activeProfiles.filter((p) => p !== profileId)
      : [...activeProfiles, profileId];

    await handleSaveProfiles(updated);
  };

  // Toggle Favorite for Current City
  const isCurrentFavorite = savedLocations.some(
    (l) => l.city_name.toLowerCase() === city.toLowerCase()
  );

  const handleToggleFavorite = async () => {
    try {
      if (isCurrentFavorite) {
        const found = savedLocations.find(
          (l) => l.city_name.toLowerCase() === city.toLowerCase()
        );
        if (found) {
          await api.deleteSavedLocation(USER_ID, found.id || found.city_name);
          setSavedLocations(savedLocations.filter((l) => l.id !== found.id));
        }
      } else {
        const res = await api.addSavedLocation(USER_ID, {
          city_name: city,
          is_favorite: true,
        });
        if (res.data) {
          setSavedLocations([...savedLocations, res.data]);
        }
      }
    } catch (err) {
      console.error('[Saved Location Error]:', err);
    }
  };

  // Delete saved location
  const handleDeleteLocation = async (locationId) => {
    try {
      await api.deleteSavedLocation(USER_ID, locationId);
      setSavedLocations(savedLocations.filter((l) => l.id !== locationId && l.city_name !== locationId));
    } catch (err) {
      console.error('[Delete Location Error]:', err);
    }
  };

  // Simulate failed API request (for verification requirement)
  const handleSimulateError = () => {
    loadHomepageFeed('__SIMULATE_FAILURE__');
  };

  // Filter personalized cards by activeCategory and deduplicate to avoid repetitive cards
  const matchingCards = activeCategory === 'all'
    ? personalizedCards
    : personalizedCards.filter((c) => c.category === activeCategory);

  const uniqueCards = matchingCards.filter(
    (card, index, self) => index === self.findIndex((c) => (c.id || c.title) === (card.id || card.title))
  );

  // Manageable card limit logic (shows top 3 initially in "all" mode, or all when expanded)
  const shouldLimit = activeCategory === 'all' && !showAllCards && uniqueCards.length > INITIAL_CARD_LIMIT;
  const displayedCards = shouldLimit ? uniqueCards.slice(0, INITIAL_CARD_LIMIT) : uniqueCards;

  return (
    <div className="meghora-dashboard-layout">
      {/* 1. Header Bar with Search & Controls */}
      <WeatherHeader
        city={city}
        onSearchCity={handleSearchCity}
        temperatureUnit={temperatureUnit}
        onToggleUnit={handleToggleUnit}
        onOpenProfiles={() => setIsProfileModalOpen(true)}
        onToggleSavedLocations={() => setIsSavedModalOpen(true)}
        savedLocationsCount={savedLocations.length}
        onRefresh={() => loadHomepageFeed(city)}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        onSimulateError={handleSimulateError}
      />

      {/* Main Content Area */}
      <main className="dashboard-main-content">
        {/* 2. Severe Alerts Banner (Rendered only when active verified alerts exist) */}
        {severeAlerts.length > 0 && <AlertBanner alerts={severeAlerts} />}

        {/* 3. Loading Skeleton */}
        {isLoading && <LoadingState />}

        {/* 4. Error State (Transparent error message with retry) */}
        {!isLoading && error && (
          <ErrorState
            message={error}
            onRetry={() => loadHomepageFeed(city)}
            onResetDefault={() => handleSearchCity('Mumbai')}
          />
        )}

        {/* 5. Loaded Weather Dashboard */}
        {!isLoading && !error && weatherData && (
          <div className="dashboard-grid">
            {/* Left Column (65–70%): Primary Weather Content */}
            <div className="dashboard-telemetry-col">
              <CurrentWeather
                weather={weatherData}
                temperatureUnit={temperatureUnit}
                isFavorite={isCurrentFavorite}
                onToggleFavorite={handleToggleFavorite}
              />

              <ForecastSection
                hourly={weatherData.hourly}
                daily={weatherData.daily}
                temperatureUnit={temperatureUnit}
              />
            </div>

            {/* Right Column (30–35%): Supporting Info, Personas & Personalized Insights */}
            <aside className="dashboard-insights-col" aria-label="Personalized Weather Recommendations">
              {/* Active Personas Summary Card */}
              <div className="personas-summary-card">
                <div className="personas-card-header">
                  <div className="personas-card-title">
                    <UserCheck size={16} className="icon-blue" aria-hidden="true" />
                    <span>Active Personas ({activeProfiles.length})</span>
                  </div>
                  <button
                    type="button"
                    className="personas-edit-btn"
                    onClick={() => setIsProfileModalOpen(true)}
                    title="Configure persona profiles"
                    aria-label="Configure active persona profiles"
                  >
                    <SlidersHorizontal size={13} aria-hidden="true" />
                    <span>Customize</span>
                  </button>
                </div>
                <div className="active-personas-pills" role="list" aria-label="Active persona list">
                  {activeProfiles.map((pId) => (
                    <span key={pId} className="active-persona-chip" role="listitem">
                      {PROFILE_LABELS[pId] || pId}
                    </span>
                  ))}
                </div>
              </div>

              {/* Insights Header */}
              <div className="insights-header">
                <div className="insights-title-group">
                  <div className="sparkle-title">
                    <Sparkles size={17} className="icon-gold" aria-hidden="true" />
                    <h3 className="section-title">Personalized Insights</h3>
                  </div>
                  <p className="section-subtitle">
                    Prioritized for your active personas
                  </p>
                </div>
              </div>

              {/* Interactive Category Navigation Bar */}
              <CategoryBar
                activeCategory={activeCategory}
                onSelectCategory={(catId) => {
                  setActiveCategory(catId);
                  setShowAllCards(false);
                }}
                activeProfiles={activeProfiles}
                onToggleProfile={handleToggleSingleProfile}
                personalizedCards={personalizedCards}
              />

              {/* Deduplicated & Manageable Cards Stack */}
              <div className="personalized-cards-stack">
                {displayedCards.length === 0 ? (
                  <div className="empty-category-notice">
                    <p>No cards available for this category in the current forecast.</p>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setActiveCategory('all')}
                    >
                      Show All Categories ({uniqueCards.length})
                    </button>
                  </div>
                ) : (
                  <>
                    {displayedCards.map((card) => (
                      <WeatherCard key={card.id} card={card} />
                    ))}

                    {/* View All / Collapse toggle button when there are additional cards */}
                    {activeCategory === 'all' && uniqueCards.length > INITIAL_CARD_LIMIT && (
                      <div className="cards-expand-control">
                        <button
                          type="button"
                          className="btn-view-all-cards"
                          onClick={() => setShowAllCards(!showAllCards)}
                          aria-expanded={showAllCards}
                        >
                          {showAllCards ? (
                            <>
                              <span>Show Top Recommendations</span>
                              <ChevronUp size={16} aria-hidden="true" />
                            </>
                          ) : (
                            <>
                              <span>View All ({uniqueCards.length}) Recommendations</span>
                              <ChevronDown size={16} aria-hidden="true" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Clean Meghora Footer */}
      <footer className="meghora-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">Meghora</span>
            <span className="footer-divider">•</span>
            <span className="footer-tagline">Personalized Weather Dashboard</span>
          </div>
          <p className="footer-attribution">
            Real-time atmospheric telemetry via Open-Meteo • Verified Meteorological Data
          </p>
        </div>
      </footer>

      {/* Profile Selector Modal */}
      <ProfileSelector
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        activeProfiles={activeProfiles}
        onSaveProfiles={handleSaveProfiles}
        isSaving={isSaving}
      />

      {/* Saved Locations Modal */}
      <SavedLocations
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        locations={savedLocations}
        currentCity={city}
        onSelectCity={handleSearchCity}
        onDeleteLocation={handleDeleteLocation}
        onAddCurrentCity={handleToggleFavorite}
      />
    </div>
  );
};

export default HomePage;
