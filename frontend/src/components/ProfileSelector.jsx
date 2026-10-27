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
  X,
  Check,
  RotateCcw,
  Sliders,
  CheckSquare,
} from 'lucide-react';

const ALL_PROFILES = [
  {
    id: 'health',
    name: 'Health-Conscious Users',
    icon: HeartPulse,
    color: '#EC4899',
    description: 'Monitors Air Quality Index (AQI), PM2.5/PM10, and intense UV radiation alerts.',
  },
  {
    id: 'outdoor_fitness',
    name: 'Outdoor Fitness Enthusiasts',
    icon: Activity,
    color: '#10B981',
    description: 'Identifies optimal workout windows, heat indices, and morning/evening running weather.',
  },
  {
    id: 'beach',
    name: 'Beachgoers & Surfers',
    icon: Waves,
    color: '#06B6D4',
    description: 'Tracks ocean swells, wave heights, coastal breezes, and marine advisories.',
  },
  {
    id: 'travel',
    name: 'Travelers',
    icon: Compass,
    color: '#F59E0B',
    description: 'Offers 72-hour destination outlooks, rain likelihood, and smart packing suggestions.',
  },
  {
    id: 'family',
    name: 'Parents & Families',
    icon: Users,
    color: '#8B5CF6',
    description: 'Evaluates school commute conditions, rain timing for pickups, and playground windows.',
  },
  {
    id: 'agriculture',
    name: 'Farmers & Gardeners',
    icon: Sprout,
    color: '#84CC16',
    description: 'Reports precipitation volume, wind drift risks for spraying, and agro-met indicators.',
  },
  {
    id: 'commuter',
    name: 'Daily Commuters',
    icon: Car,
    color: '#3B82F6',
    description: 'Forecasts road visibility, fog impact, and rush-hour precipitation delays.',
  },
  {
    id: 'event_planner',
    name: 'Event Planners',
    icon: CalendarDays,
    color: '#6366F1',
    description: 'Estimates outdoor comfort index, wind gust hazards, and marquee/canopy necessities.',
  },
];

export const ProfileSelector = ({
  isOpen,
  onClose,
  activeProfiles = [],
  onSaveProfiles,
  isSaving,
}) => {
  const [selected, setSelected] = useState([...activeProfiles]);

  if (!isOpen) return null;

  const toggleProfile = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((p) => p !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleSelectAll = () => {
    setSelected(ALL_PROFILES.map((p) => p.id));
  };

  const handleResetDefaults = () => {
    setSelected(['health', 'commuter', 'outdoor_fitness']);
  };

  const handleSave = () => {
    onSaveProfiles(selected);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Sliders size={20} className="modal-icon" />
            <div>
              <h3 id="modal-title" className="modal-title">Select Personalization Profiles</h3>
              <p className="modal-subtitle">
                Select your interests. The smart engine dynamically re-scores and re-ranks cards for you.
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {/* Quick Toolbar */}
        <div className="modal-toolbar">
          <span className="selection-count">
            <strong>{selected.length}</strong> of {ALL_PROFILES.length} profiles active
          </span>
          <div className="toolbar-actions">
            <button type="button" className="toolbar-btn" onClick={handleSelectAll}>
              <CheckSquare size={14} />
              <span>Select All</span>
            </button>
            <button type="button" className="toolbar-btn" onClick={handleResetDefaults}>
              <RotateCcw size={14} />
              <span>Defaults</span>
            </button>
          </div>
        </div>

        {/* 8-Profile Grid */}
        <div className="profiles-selection-grid">
          {ALL_PROFILES.map((profile) => {
            const Icon = profile.icon;
            const isChecked = selected.includes(profile.id);

            return (
              <button
                type="button"
                key={profile.id}
                className={`profile-card-option ${isChecked ? 'selected' : ''}`}
                onClick={() => toggleProfile(profile.id)}
                aria-pressed={isChecked}
              >
                <div className="profile-icon-wrap" style={{ backgroundColor: `${profile.color}15`, color: profile.color }}>
                  <Icon size={24} />
                </div>
                <div className="profile-info">
                  <div className="profile-name-row">
                    <span className="profile-name">{profile.name}</span>
                    <span className={`checkbox-indicator ${isChecked ? 'checked' : ''}`}>
                      {isChecked && <Check size={14} />}
                    </span>
                  </div>
                  <p className="profile-desc">{profile.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving Preferences...' : `Save & Apply (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSelector;
