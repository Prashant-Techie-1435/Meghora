import {
  Sparkles,
  HeartPulse,
  Activity,
  Waves,
  Compass,
  Users,
  Sprout,
  Car,
  CalendarDays,
  PlusCircle,
  Check,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'All Insights', icon: Sparkles, profileId: null },
  { id: 'health', name: 'Health & AQI', icon: HeartPulse, profileId: 'health' },
  { id: 'fitness', name: 'Fitness & Running', icon: Activity, profileId: 'outdoor_fitness' },
  { id: 'beach', name: 'Beach & Marine', icon: Waves, profileId: 'beach' },
  { id: 'travel', name: 'Travel & Packing', icon: Compass, profileId: 'travel' },
  { id: 'family', name: 'Family & Schools', icon: Users, profileId: 'family' },
  { id: 'agriculture', name: 'Agriculture & Crops', icon: Sprout, profileId: 'agriculture' },
  { id: 'commute', name: 'Daily Commute', icon: Car, profileId: 'commuter' },
  { id: 'event_planner', name: 'Event Planning', icon: CalendarDays, profileId: 'event_planner' },
];

export const CategoryBar = ({
  activeCategory = 'all',
  onSelectCategory,
  activeProfiles = [],
  onToggleProfile,
  personalizedCards = [],
}) => {
  return (
    <div className="category-navigation-bar" role="navigation" aria-label="Personalized Weather Categories">
      <div className="category-scroll-strip" role="tablist" aria-label="Category tabs">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          // Count matching cards
          const count = cat.id === 'all'
            ? personalizedCards.length
            : personalizedCards.filter((c) => c.category === cat.id).length;

          const isProfileActive = cat.profileId ? activeProfiles.includes(cat.profileId) : true;

          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`category-tab-btn ${isActive ? 'active' : ''} ${!isProfileActive && cat.id !== 'all' ? 'profile-inactive' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
              aria-label={`${cat.name} (${count} cards available)`}
            >
              <Icon size={15} className="category-icon" aria-hidden="true" />
              <span className="category-name">{cat.name}</span>
              <span className="category-counter">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Profile Toggle Helper if selected category is not active in user's profile */}
      {activeCategory !== 'all' && (() => {
        const currentCat = CATEGORIES.find((c) => c.id === activeCategory);
        if (!currentCat || !currentCat.profileId) return null;

        const isProfileActive = activeProfiles.includes(currentCat.profileId);

        return (
          <div className="category-profile-helper">
            <span className="helper-text">
              {isProfileActive ? (
                <>
                  <Check size={14} className="icon-emerald inline-icon" aria-hidden="true" />
                  <span><strong>{currentCat.name}</strong> is in your active personas</span>
                </>
              ) : (
                <span>Prioritize <strong>{currentCat.name}</strong> in your daily recommendations?</span>
              )}
            </span>

            <button
              type="button"
              className={`btn-category-toggle ${isProfileActive ? 'active' : ''}`}
              onClick={() => onToggleProfile(currentCat.profileId)}
              aria-label={isProfileActive ? `${currentCat.name} is active in your profiles` : `Add ${currentCat.name} to active profiles`}
            >
              {isProfileActive ? (
                <span>Active Profile</span>
              ) : (
                <>
                  <PlusCircle size={14} aria-hidden="true" />
                  <span>Add to Profiles</span>
                </>
              )}
            </button>
          </div>
        );
      })()}
    </div>
  );
};

export default CategoryBar;
