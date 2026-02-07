# Phase 2: Component Architecture

## Overview

This phase focuses on breaking down the monolithic 1500+ line `Home.jsx` into smaller, focused, reusable components. This improves maintainability, testability, and enables better code organization.

## Goals

1. Split Home.jsx into ~15 focused components
2. Extract reusable UI components
3. Implement consistent patterns for data fetching
4. Add TypeScript for type safety
5. Create a clear component hierarchy

---

## Current State Analysis

### Home.jsx Structure (1539 lines)

```
Home.jsx
├── State declarations (lines 6-32) - 20+ useState hooks
├── Hardcoded data (lines 34-351)
├── useEffect hooks (lines 62-180)
├── Handler functions (lines 183-270)
├── Fallback data (lines 272-351)
├── Loading/Error states (lines 354-408)
└── JSX Sections:
    ├── Hero Section (lines 412-576)
    ├── Stats Section (lines 578-669)
    ├── Wallet Shocks Section (lines 671-841)
    ├── Cost Drivers Section (lines 843-995)
    ├── Budget Impact Section (lines 997-1078)
    ├── Price Map Section (lines 1080-1357)
    ├── Social Posts Section (lines 1359-1437)
    ├── CTA Section (lines 1439-1469)
    └── Impact Modal (lines 1471-1533)
```

### Problems with Current Architecture

1. **Single File Bloat**: 1500+ lines is too large to maintain
2. **State Coupling**: All state lives in one component
3. **No Reusability**: Duplicate patterns (dropdowns, cards)
4. **Testing Difficulty**: Can't test sections in isolation
5. **Code Duplication**: Same dropdown logic repeated 4 times
6. **Performance**: All re-renders affect entire page

---

## Target Architecture

### Component Tree

```
src/
├── pages/
│   └── Home/
│       ├── index.jsx              # Main container
│       ├── Home.css               # Page-level styles
│       └── sections/
│           ├── HeroSection.jsx
│           ├── StatsSection.jsx
│           ├── WalletShocksSection.jsx
│           ├── CostDriversSection.jsx
│           ├── BudgetImpactSection.jsx
│           ├── PriceMapSection.jsx
│           ├── SocialPostsSection.jsx
│           └── CTASection.jsx
│
├── components/
│   ├── common/
│   │   ├── StateDropdown/
│   │   │   ├── index.jsx
│   │   │   └── StateDropdown.css
│   │   ├── LoadingSpinner/
│   │   ├── ErrorMessage/
│   │   ├── Card/
│   │   └── Button/
│   │
│   ├── data-display/
│   │   ├── StatCard/
│   │   ├── WalletShockCard/
│   │   ├── CostDriverBar/
│   │   ├── ComparisonCard/
│   │   └── SocialPostCard/
│   │
│   ├── charts/
│   │   ├── MiniLineChart/
│   │   ├── BarChart/
│   │   └── HeatMap/
│   │
│   ├── inputs/
│   │   ├── SearchBox/
│   │   ├── TimelineSlider/
│   │   └── TimePeriodToggle/
│   │
│   └── modals/
│       └── ProductImpactModal/
│
├── hooks/
│   ├── useHomepageData.js
│   ├── useStateSelection.js
│   ├── useTimePeriod.js
│   └── useUserPreferences.js
│
├── context/
│   └── HomepageContext.jsx
│
└── api/
    └── homepage.js
```

---

## Component Specifications

### 1. Main Container (Home/index.jsx)

```jsx
// src/pages/Home/index.jsx
import { HomepageProvider } from '../../context/HomepageContext';
import HeroSection from './sections/HeroSection';
import StatsSection from './sections/StatsSection';
import WalletShocksSection from './sections/WalletShocksSection';
import CostDriversSection from './sections/CostDriversSection';
import BudgetImpactSection from './sections/BudgetImpactSection';
import PriceMapSection from './sections/PriceMapSection';
import SocialPostsSection from './sections/SocialPostsSection';
import CTASection from './sections/CTASection';
import './Home.css';

const Home = () => {
  return (
    <HomepageProvider>
      <div className="home-page">
        <HeroSection />
        <StatsSection />
        <WalletShocksSection />
        <CostDriversSection />
        <BudgetImpactSection />
        <PriceMapSection />
        <SocialPostsSection />
        <CTASection />
      </div>
    </HomepageProvider>
  );
};

export default Home;
```

### 2. Homepage Context

```jsx
// src/context/HomepageContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { homepageApi } from '../api/homepage';

const HomepageContext = createContext(null);

const initialState = {
  // Selection state
  selectedState: null,
  timePeriod: 'YoY',

  // Data state
  walletShocks: [],
  costDrivers: [],
  stats: {},
  stateComparison: [],
  socialPosts: [],
  mapData: null,

  // UI state
  loading: true,
  refreshing: false,
  error: null
};

const homepageReducer = (state, action) => {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, selectedState: action.payload };

    case 'SET_TIME_PERIOD':
      return { ...state, timePeriod: action.payload };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_REFRESHING':
      return { ...state, refreshing: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_DATA':
      return {
        ...state,
        ...action.payload,
        loading: false,
        refreshing: false,
        error: null
      };

    case 'UPDATE_SHOCK_REACTIONS':
      return {
        ...state,
        walletShocks: state.walletShocks.map(shock =>
          shock._id === action.payload.id
            ? { ...shock, reactions: action.payload.reactions }
            : shock
        )
      };

    default:
      return state;
  }
};

export const HomepageProvider = ({ children }) => {
  const [state, dispatch] = useReducer(homepageReducer, initialState);

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      const cached = localStorage.getItem('user_preferences');
      if (cached) {
        const prefs = JSON.parse(cached);
        if (prefs.selectedState) {
          dispatch({ type: 'SET_STATE', payload: prefs.selectedState });
        }
        if (prefs.defaultTimePeriod) {
          dispatch({ type: 'SET_TIME_PERIOD', payload: prefs.defaultTimePeriod });
        }
      }
    };
    loadPreferences();
  }, []);

  // Fetch data when state or period changes
  useEffect(() => {
    const fetchData = async () => {
      const isInitialLoad = state.loading;

      if (!isInitialLoad) {
        dispatch({ type: 'SET_REFRESHING', payload: true });
      }

      try {
        const stateParam = state.selectedState || 'nationwide';

        const [shocks, drivers, stats, comparison, social, map] = await Promise.all([
          homepageApi.getWalletShocks(stateParam),
          homepageApi.getCostDrivers(stateParam, state.timePeriod),
          homepageApi.getStats(stateParam),
          homepageApi.getStateComparison(stateParam),
          homepageApi.getSocialPosts(3, true),
          homepageApi.getMapData('price-surge')
        ]);

        dispatch({
          type: 'SET_DATA',
          payload: {
            walletShocks: shocks.shocks || [],
            costDrivers: drivers.drivers || [],
            stats: stats.stats || {},
            stateComparison: comparison.comparisons || [],
            socialPosts: social.posts || [],
            mapData: map
          }
        });
      } catch (error) {
        console.error('Error fetching homepage data:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    };

    fetchData();
  }, [state.selectedState, state.timePeriod]);

  // Actions
  const actions = {
    setSelectedState: (stateValue) => {
      dispatch({ type: 'SET_STATE', payload: stateValue });
      // Save to preferences
      const prefs = JSON.parse(localStorage.getItem('user_preferences') || '{}');
      localStorage.setItem('user_preferences', JSON.stringify({
        ...prefs,
        selectedState: stateValue
      }));
    },

    setTimePeriod: (period) => {
      dispatch({ type: 'SET_TIME_PERIOD', payload: period });
      const prefs = JSON.parse(localStorage.getItem('user_preferences') || '{}');
      localStorage.setItem('user_preferences', JSON.stringify({
        ...prefs,
        defaultTimePeriod: period
      }));
    },

    addReaction: async (shockId, reactionType) => {
      try {
        const response = await homepageApi.addReaction(shockId, reactionType);
        dispatch({
          type: 'UPDATE_SHOCK_REACTIONS',
          payload: { id: shockId, reactions: response.reactions }
        });
      } catch (error) {
        console.error('Error adding reaction:', error);
      }
    }
  };

  return (
    <HomepageContext.Provider value={{ state, actions }}>
      {children}
    </HomepageContext.Provider>
  );
};

export const useHomepage = () => {
  const context = useContext(HomepageContext);
  if (!context) {
    throw new Error('useHomepage must be used within HomepageProvider');
  }
  return context;
};
```

### 3. StateDropdown Component (Reusable)

```jsx
// src/components/common/StateDropdown/index.jsx
import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './StateDropdown.css';

const ALL_STATES = [
  'All states', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
  'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii',
  'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
  'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const StateDropdown = ({
  value,
  onChange,
  label,
  showCurrentLocation = false,
  variant = 'default', // 'default' | 'hero' | 'dark'
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStates = search
    ? ALL_STATES.filter(s => s.toLowerCase().includes(search.toLowerCase()))
    : ALL_STATES;

  const displayValue = value === 'nationwide' ? 'All States' : value;

  const handleSelect = (state) => {
    const stateValue = state === 'All states' ? 'nationwide' : state;
    onChange(stateValue);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`state-dropdown ${variant} ${className}`} ref={dropdownRef}>
      {label && <label className="state-dropdown-label">{label}</label>}

      <button
        className="state-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {showCurrentLocation && (
          <span className="current-location-label">Current Location</span>
        )}
        <span className="selected-value">{displayValue || 'Select State'}</span>
        <svg
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="dropdown-overlay" onClick={() => setIsOpen(false)} />
          <div className="state-dropdown-menu" role="listbox">
            <div className="dropdown-search">
              <input
                type="text"
                placeholder="Search states..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            <div className="dropdown-items">
              {filteredStates.map((state) => (
                <div
                  key={state}
                  className={`dropdown-item ${value === state ? 'selected' : ''}`}
                  onClick={() => handleSelect(state)}
                  role="option"
                  aria-selected={value === state}
                >
                  {state}
                </div>
              ))}
              {filteredStates.length === 0 && (
                <div className="dropdown-no-results">No states found</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

StateDropdown.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  showCurrentLocation: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'hero', 'dark']),
  className: PropTypes.string
};

export default StateDropdown;
```

### 4. WalletShockCard Component

```jsx
// src/components/data-display/WalletShockCard/index.jsx
import PropTypes from 'prop-types';
import MiniLineChart from '../../charts/MiniLineChart';
import './WalletShockCard.css';

const WalletShockCard = ({
  shock,
  onReaction,
  onDetailsClick
}) => {
  const {
    _id,
    category,
    title,
    icon,
    iconBg,
    price,
    unit,
    change,
    chartPath,
    chartColor,
    reactions = {}
  } = shock;

  return (
    <div className="wallet-card">
      <div className="wallet-card-header">
        <span className="category-badge">{category}</span>
      </div>

      <div className="wallet-card-content">
        <div className="icon-circle" style={{ backgroundColor: iconBg }}>
          {icon}
        </div>
        <p className="wallet-card-title">{title}</p>
      </div>

      <div className="wallet-price-section">
        <span className="wallet-price">{price}</span>
        <span className="wallet-unit">{unit}</span>
        <span className="wallet-change">{change}</span>
      </div>

      <div className="wallet-chart">
        <MiniLineChart path={chartPath} color={chartColor} />
      </div>

      <div className="wallet-card-footer">
        <button className="see-details" onClick={() => onDetailsClick(shock)}>
          See details →
        </button>
        <div className="reactions">
          <button
            className="reaction-btn"
            onClick={() => onReaction(_id, 'shock')}
            aria-label="Shocked reaction"
          >
            😮 {reactions.shock || 0}
          </button>
          <button
            className="reaction-btn"
            onClick={() => onReaction(_id, 'angry')}
            aria-label="Angry reaction"
          >
            😡 {reactions.angry || 0}
          </button>
          <button
            className="reaction-btn"
            onClick={() => onReaction(_id, 'sad')}
            aria-label="Sad reaction"
          >
            😢 {reactions.sad || 0}
          </button>
        </div>
      </div>
    </div>
  );
};

WalletShockCard.propTypes = {
  shock: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    icon: PropTypes.string,
    iconBg: PropTypes.string,
    price: PropTypes.string.isRequired,
    unit: PropTypes.string,
    change: PropTypes.string.isRequired,
    chartPath: PropTypes.string,
    chartColor: PropTypes.string,
    reactions: PropTypes.object
  }).isRequired,
  onReaction: PropTypes.func.isRequired,
  onDetailsClick: PropTypes.func.isRequired
};

export default WalletShockCard;
```

### 5. Section Component Example (WalletShocksSection)

```jsx
// src/pages/Home/sections/WalletShocksSection.jsx
import { useHomepage } from '../../../context/HomepageContext';
import StateDropdown from '../../../components/common/StateDropdown';
import WalletShockCard from '../../../components/data-display/WalletShockCard';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import './WalletShocksSection.css';

const FEATURED_STATES = [
  'CALIFORNIA', 'TEXAS', 'FLORIDA', 'ARIZONA', 'NEW YORK', 'WASHINGTON'
];

const WalletShocksSection = () => {
  const { state, actions } = useHomepage();
  const { walletShocks, selectedState, refreshing } = state;

  const handleStateTabClick = (stateTab) => {
    const properCase = stateTab.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    actions.setSelectedState(properCase);
  };

  return (
    <section className="wallet-shocks-section">
      <div className="wallet-shocks-container">
        <h2 className="wallet-shocks-title">Top Wallet Shocks This Week</h2>

        {/* State Filter Tabs */}
        <div className="state-filters">
          {FEATURED_STATES.map((stateTab) => (
            <button
              key={stateTab}
              onClick={() => handleStateTabClick(stateTab)}
              className={`state-tab ${
                selectedState?.toUpperCase() === stateTab ? 'active' : ''
              }`}
            >
              {stateTab}
            </button>
          ))}
        </div>

        {/* Custom Dropdown */}
        <div className="state-controls">
          <StateDropdown
            value={selectedState}
            onChange={actions.setSelectedState}
            label="Select Your Location"
            showCurrentLocation
            variant="dark"
          />
        </div>

        {/* Wallet Shock Cards */}
        <div
          className="wallet-cards"
          style={{ opacity: refreshing ? 0.6 : 1 }}
        >
          {walletShocks.length === 0 ? (
            <div className="no-data-message">
              No price shocks data available for this state.
            </div>
          ) : (
            walletShocks.map((shock) => (
              <WalletShockCard
                key={shock._id}
                shock={shock}
                onReaction={actions.addReaction}
                onDetailsClick={(s) => {
                  // Navigate to details or open modal
                  console.log('View details:', s);
                }}
              />
            ))
          )}
        </div>

        {/* Footer Note */}
        <p className="wallet-note">
          Red ↗ indicates price increases; blue lines indicate neutral to
          declining trends. Values are illustrative for layout only.
        </p>
      </div>
    </section>
  );
};

export default WalletShocksSection;
```

### 6. StatCard Component

```jsx
// src/components/data-display/StatCard/index.jsx
import PropTypes from 'prop-types';
import './StatCard.css';

const StatCard = ({
  title,
  value,
  change,
  changeType = 'neutral', // 'up' | 'down' | 'neutral'
  description,
  icon,
  variant = 'default', // 'default' | 'large' | 'pink' | 'red'
  chart,
  className = ''
}) => {
  const changeClass = {
    up: 'stat-change-up',
    down: 'stat-change-down',
    neutral: 'stat-change-neutral'
  }[changeType];

  return (
    <div className={`stat-card stat-card-${variant} ${className}`}>
      {icon && <div className="stat-icon">{icon}</div>}

      <div className="stat-header">
        <h3 className="stat-title">{title}</h3>
      </div>

      <div className="stat-value">{value}</div>

      {change && (
        <div className={`stat-change ${changeClass}`}>
          {changeType === 'up' && '↑ '}
          {changeType === 'down' && '↓ '}
          {change}
        </div>
      )}

      {description && (
        <p className="stat-description">{description}</p>
      )}

      {chart && (
        <div className="stat-chart">
          {chart}
        </div>
      )}
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  change: PropTypes.string,
  changeType: PropTypes.oneOf(['up', 'down', 'neutral']),
  description: PropTypes.string,
  icon: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'large', 'pink', 'red']),
  chart: PropTypes.node,
  className: PropTypes.string
};

export default StatCard;
```

---

## Custom Hooks

### useStateSelection Hook

```jsx
// src/hooks/useStateSelection.js
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'user_preferences';

export const useStateSelection = (initialState = null) => {
  const [selectedState, setSelectedState] = useState(initialState);

  // Load from storage on mount
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const prefs = JSON.parse(cached);
        if (prefs.selectedState) {
          setSelectedState(prefs.selectedState);
        }
      } catch (e) {
        console.error('Error loading state preference:', e);
      }
    }
  }, []);

  // Persist changes
  const updateState = useCallback((newState) => {
    setSelectedState(newState);

    const cached = localStorage.getItem(STORAGE_KEY);
    const prefs = cached ? JSON.parse(cached) : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...prefs,
      selectedState: newState
    }));
  }, []);

  return [selectedState, updateState];
};
```

### useHomepageData Hook

```jsx
// src/hooks/useHomepageData.js
import { useState, useEffect, useCallback } from 'react';
import { homepageApi } from '../api/homepage';

export const useHomepageData = (state, timePeriod) => {
  const [data, setData] = useState({
    walletShocks: [],
    costDrivers: [],
    stats: {},
    stateComparison: [],
    socialPosts: [],
    mapData: null
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    const stateParam = state || 'nationwide';

    try {
      const [shocks, drivers, stats, comparison, social, map] = await Promise.all([
        homepageApi.getWalletShocks(stateParam),
        homepageApi.getCostDrivers(stateParam, timePeriod),
        homepageApi.getStats(stateParam),
        homepageApi.getStateComparison(stateParam),
        homepageApi.getSocialPosts(3, true),
        homepageApi.getMapData('price-surge')
      ]);

      setData({
        walletShocks: shocks.shocks || [],
        costDrivers: drivers.drivers || [],
        stats: stats.stats || {},
        stateComparison: comparison.comparisons || [],
        socialPosts: social.posts || [],
        mapData: map
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching homepage data:', err);
      setError(err.message);
    }
  }, [state, timePeriod]);

  useEffect(() => {
    const load = async () => {
      if (!loading) {
        setRefreshing(true);
      }
      await fetchData();
      setLoading(false);
      setRefreshing(false);
    };
    load();
  }, [fetchData, loading]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  return { data, loading, refreshing, error, refresh };
};
```

---

## TypeScript Migration (Optional)

### Types Definition

```typescript
// src/types/homepage.ts

export interface WalletShock {
  _id: string;
  category: string;
  title: string;
  icon: string;
  iconBg: string;
  price: string;
  unit: string;
  change: string;
  changePercent: number;
  chartPath: string;
  chartColor: string;
  reactions: {
    shock: number;
    angry: number;
    sad: number;
  };
  state: string;
  dataDate: string;
}

export interface CostDriver {
  _id: string;
  label: string;
  percentage: number;
  color: string;
  type: 'direct' | 'indirect';
  state: string;
  timePeriod: string;
}

export interface StatsSummary {
  lobbying?: {
    value: string;
    trend: 'up' | 'down';
    change: string;
  };
  consumerCost?: {
    value: string;
    trend: 'up' | 'down';
    change: string;
  };
  contributions?: {
    value: string;
    trend: 'up' | 'down';
    change: string;
  };
  tariffRevenue?: {
    value: string;
    description: string;
  };
}

export interface StateComparison {
  category: string;
  stateValue: number;
  stateFormatted: string;
  nationalValue: number;
  nationalFormatted: string;
  percentDiff: number;
  percentFormatted: string;
  trend: 'up' | 'down' | 'stable';
}

export interface SocialPost {
  _id: string;
  username: string;
  platform: 'twitter' | 'threads' | 'facebook';
  platformDisplay: string;
  verified: boolean;
  text: string;
  image: string;
  engagement: {
    comments: number;
    retweets: number;
    retweetsFormatted: string;
    likes: number;
    likesFormatted: string;
  };
  timeAgo: string;
}

export interface HomepageState {
  selectedState: string | null;
  timePeriod: 'YoY' | '3 months' | '30 days';
  walletShocks: WalletShock[];
  costDrivers: CostDriver[];
  stats: StatsSummary;
  stateComparison: StateComparison[];
  socialPosts: SocialPost[];
  mapData: MapData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

export interface HomepageActions {
  setSelectedState: (state: string) => void;
  setTimePeriod: (period: string) => void;
  addReaction: (shockId: string, type: string) => Promise<void>;
}
```

---

## Implementation Steps

### Step 1: Create Directory Structure (Day 1)

- [ ] Create `src/pages/Home/` directory
- [ ] Create `src/pages/Home/sections/` directory
- [ ] Create `src/components/common/` directory
- [ ] Create `src/components/data-display/` directory
- [ ] Create `src/components/charts/` directory
- [ ] Create `src/components/inputs/` directory
- [ ] Create `src/components/modals/` directory
- [ ] Create `src/hooks/` directory
- [ ] Create `src/context/` directory
- [ ] Create `src/types/` directory (if using TypeScript)

### Step 2: Extract Reusable Components (Day 1-2)

- [ ] Create `StateDropdown` component (used 4 times)
- [ ] Create `LoadingSpinner` component
- [ ] Create `ErrorMessage` component
- [ ] Create `Button` component variants
- [ ] Create `Card` base component
- [ ] Add PropTypes or TypeScript types

### Step 3: Create Data Display Components (Day 2-3)

- [ ] Create `StatCard` component
- [ ] Create `WalletShockCard` component
- [ ] Create `CostDriverBar` component
- [ ] Create `ComparisonCard` component
- [ ] Create `SocialPostCard` component
- [ ] Create `ShockListItem` component

### Step 4: Create Chart Components (Day 3)

- [ ] Create `MiniLineChart` component
- [ ] Create `BarChart` component
- [ ] Create `HeatMap` component (for map section)
- [ ] Extract SVG chart logic

### Step 5: Create Input Components (Day 3-4)

- [ ] Create `SearchBox` component
- [ ] Create `TimelineSlider` component
- [ ] Create `TimePeriodToggle` component

### Step 6: Create Context and Hooks (Day 4)

- [ ] Create `HomepageContext`
- [ ] Create `useHomepageData` hook
- [ ] Create `useStateSelection` hook
- [ ] Create `useTimePeriod` hook
- [ ] Create `useUserPreferences` hook

### Step 7: Extract Section Components (Day 4-5)

- [ ] Create `HeroSection` component
- [ ] Create `StatsSection` component
- [ ] Create `WalletShocksSection` component
- [ ] Create `CostDriversSection` component
- [ ] Create `BudgetImpactSection` component
- [ ] Create `PriceMapSection` component
- [ ] Create `SocialPostsSection` component
- [ ] Create `CTASection` component

### Step 8: Create Modal Components (Day 5)

- [ ] Create `ProductImpactModal` component
- [ ] Extract modal logic from Home.jsx

### Step 9: Refactor Main Home Component (Day 5-6)

- [ ] Replace inline JSX with section components
- [ ] Replace state hooks with context
- [ ] Remove hardcoded data
- [ ] Clean up unused code

### Step 10: Testing (Day 6-7)

- [ ] Unit tests for each component
- [ ] Integration tests for context
- [ ] Snapshot tests for UI
- [ ] Visual regression tests

---

## Testing Strategy

### Component Tests

```jsx
// src/components/data-display/StatCard/StatCard.test.jsx
import { render, screen } from '@testing-library/react';
import StatCard from './index';

describe('StatCard', () => {
  const defaultProps = {
    title: 'Test Stat',
    value: '$1,234'
  };

  it('renders title and value', () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.getByText('Test Stat')).toBeInTheDocument();
    expect(screen.getByText('$1,234')).toBeInTheDocument();
  });

  it('renders change with up indicator', () => {
    render(<StatCard {...defaultProps} change="+5%" changeType="up" />);
    expect(screen.getByText(/\+5%/)).toBeInTheDocument();
    expect(screen.getByText(/↑/)).toBeInTheDocument();
  });

  it('applies variant class', () => {
    const { container } = render(<StatCard {...defaultProps} variant="pink" />);
    expect(container.firstChild).toHaveClass('stat-card-pink');
  });
});
```

### Context Tests

```jsx
// src/context/HomepageContext.test.jsx
import { renderHook, act } from '@testing-library/react';
import { HomepageProvider, useHomepage } from './HomepageContext';

describe('HomepageContext', () => {
  it('provides initial state', () => {
    const { result } = renderHook(() => useHomepage(), {
      wrapper: HomepageProvider
    });

    expect(result.current.state.loading).toBe(true);
    expect(result.current.state.selectedState).toBe(null);
  });

  it('updates selected state', () => {
    const { result } = renderHook(() => useHomepage(), {
      wrapper: HomepageProvider
    });

    act(() => {
      result.current.actions.setSelectedState('California');
    });

    expect(result.current.state.selectedState).toBe('California');
  });
});
```

---

## Migration Strategy

### Incremental Approach

1. **Week 1**: Create new components alongside existing code
2. **Week 2**: Gradually replace sections in Home.jsx
3. **Week 3**: Remove old code, test thoroughly

### Feature Flags

```jsx
const USE_NEW_COMPONENTS = process.env.REACT_APP_USE_NEW_COMPONENTS === 'true';

// In Home.jsx during migration
{USE_NEW_COMPONENTS ? (
  <WalletShocksSection />
) : (
  // Old inline JSX
  <section className="wallet-shocks-section">...</section>
)}
```

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Lines in Home.jsx | 1539 | < 100 |
| Component count | 1 | 15-20 |
| Reusable components | 0 | 10+ |
| Test coverage | 0% | 80%+ |
| Bundle size impact | - | < 5% increase |

---

## Next Steps

After completing Phase 2:
1. Proceed to Phase 3 (Performance Optimization)
2. Individual components enable:
   - Lazy loading
   - Memoization
   - Code splitting
3. Context enables:
   - Centralized data fetching
   - Reduced prop drilling
