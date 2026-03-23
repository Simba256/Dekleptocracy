import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { API_URL } from '../utils/apiUrl';
import { CACHE_CONFIG, STORAGE_KEYS } from '../utils/constants';
import * as homepageApi from '../api/homepage';

// Response cache for avoiding redundant API calls
const CACHE_TTL = CACHE_CONFIG.DEFAULT_TTL_MS;
const responseCache = new Map();

function getCachedData(key) {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  // Clean up expired entry
  if (cached) {
    responseCache.delete(key);
  }
  return null;
}

function setCachedData(key, data) {
  responseCache.set(key, { data, timestamp: Date.now() });
}

function clearCache() {
  responseCache.clear();
}

// Initial state
const initialState = {
  // User selections
  selectedState: null, // null = no selection yet, will use 'nationwide'
  timePeriod: 'YoY',

  // API data
  walletShocks: [],
  costDrivers: [],
  stats: {},
  stateComparisons: [],
  socialPosts: [],
  quickQuestions: [],
  mapRegions: [],
  nearbyShocks: [],
  timelineConfig: null,
  trendingProducts: [],

  // UI state
  loading: true,
  isRefreshing: false,
  error: null,

  // Dropdown states
  dropdownStates: {
    hero: false,
    map: false,
    walletShocks: false,
    costImpact: false,
  },

  // Search states for dropdowns
  searchStates: {
    hero: '',
    map: '',
    walletShocks: '',
    costImpact: '',
  },

  // Modal states
  showImpactModal: false,
  impactModalProduct: '',

  // Timeline
  timelineDate: 50,

  // Search query
  searchQuery: '',
  productQuery: '',
};

// Action types
const ActionTypes = {
  SET_SELECTED_STATE: 'SET_SELECTED_STATE',
  SET_TIME_PERIOD: 'SET_TIME_PERIOD',
  SET_WALLET_SHOCKS: 'SET_WALLET_SHOCKS',
  SET_COST_DRIVERS: 'SET_COST_DRIVERS',
  SET_STATS: 'SET_STATS',
  SET_STATE_COMPARISONS: 'SET_STATE_COMPARISONS',
  SET_SOCIAL_POSTS: 'SET_SOCIAL_POSTS',
  SET_QUICK_QUESTIONS: 'SET_QUICK_QUESTIONS',
  SET_MAP_REGIONS: 'SET_MAP_REGIONS',
  SET_NEARBY_SHOCKS: 'SET_NEARBY_SHOCKS',
  SET_TIMELINE_CONFIG: 'SET_TIMELINE_CONFIG',
  SET_TRENDING_PRODUCTS: 'SET_TRENDING_PRODUCTS',
  SET_ALL_DATA: 'SET_ALL_DATA',
  SET_LOADING: 'SET_LOADING',
  SET_REFRESHING: 'SET_REFRESHING',
  SET_ERROR: 'SET_ERROR',
  TOGGLE_DROPDOWN: 'TOGGLE_DROPDOWN',
  CLOSE_ALL_DROPDOWNS: 'CLOSE_ALL_DROPDOWNS',
  SET_DROPDOWN_SEARCH: 'SET_DROPDOWN_SEARCH',
  UPDATE_REACTION: 'UPDATE_REACTION',
  SET_SHOW_IMPACT_MODAL: 'SET_SHOW_IMPACT_MODAL',
  SET_TIMELINE_DATE: 'SET_TIMELINE_DATE',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_PRODUCT_QUERY: 'SET_PRODUCT_QUERY',
};

// Reducer
function homepageReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_SELECTED_STATE:
      return { ...state, selectedState: action.payload };

    case ActionTypes.SET_TIME_PERIOD:
      return { ...state, timePeriod: action.payload };

    case ActionTypes.SET_WALLET_SHOCKS:
      return { ...state, walletShocks: action.payload };

    case ActionTypes.SET_COST_DRIVERS:
      return { ...state, costDrivers: action.payload };

    case ActionTypes.SET_STATS:
      return { ...state, stats: action.payload };

    case ActionTypes.SET_STATE_COMPARISONS:
      return { ...state, stateComparisons: action.payload };

    case ActionTypes.SET_SOCIAL_POSTS:
      return { ...state, socialPosts: action.payload };

    case ActionTypes.SET_QUICK_QUESTIONS:
      return { ...state, quickQuestions: action.payload };

    case ActionTypes.SET_MAP_REGIONS:
      return { ...state, mapRegions: action.payload };

    case ActionTypes.SET_NEARBY_SHOCKS:
      return { ...state, nearbyShocks: action.payload };

    case ActionTypes.SET_TIMELINE_CONFIG:
      return { ...state, timelineConfig: action.payload };

    case ActionTypes.SET_TRENDING_PRODUCTS:
      return { ...state, trendingProducts: action.payload };

    case ActionTypes.SET_ALL_DATA:
      return { ...state, ...action.payload };

    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };

    case ActionTypes.SET_REFRESHING:
      return { ...state, isRefreshing: action.payload };

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };

    case ActionTypes.TOGGLE_DROPDOWN:
      return {
        ...state,
        dropdownStates: {
          ...Object.fromEntries(Object.keys(state.dropdownStates).map((k) => [k, false])), // Close all
          [action.payload]: !state.dropdownStates[action.payload],
        },
        searchStates: {
          ...state.searchStates,
          [action.payload]: '', // Reset search when toggling
        },
      };

    case ActionTypes.CLOSE_ALL_DROPDOWNS:
      return {
        ...state,
        dropdownStates: Object.fromEntries(
          Object.keys(state.dropdownStates).map((k) => [k, false]),
        ),
        searchStates: Object.fromEntries(Object.keys(state.searchStates).map((k) => [k, ''])),
      };

    case ActionTypes.SET_DROPDOWN_SEARCH:
      return {
        ...state,
        searchStates: {
          ...state.searchStates,
          [action.payload.dropdown]: action.payload.value,
        },
      };

    case ActionTypes.UPDATE_REACTION:
      return {
        ...state,
        walletShocks: state.walletShocks.map((shock) =>
          shock._id === action.payload.shockId
            ? { ...shock, reactions: action.payload.reactions }
            : shock,
        ),
      };

    case ActionTypes.SET_SHOW_IMPACT_MODAL:
      return {
        ...state,
        showImpactModal: action.payload.show,
        impactModalProduct: action.payload.product || state.impactModalProduct,
      };

    case ActionTypes.SET_TIMELINE_DATE:
      return { ...state, timelineDate: action.payload };

    case ActionTypes.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload };

    case ActionTypes.SET_PRODUCT_QUERY:
      return { ...state, productQuery: action.payload };

    default:
      return state;
  }
}

// Context
const HomepageContext = createContext(null);

// Provider component
export function HomepageProvider({ children }) {
  const [state, dispatch] = useReducer(homepageReducer, initialState);

  // Get effective state (use 'nationwide' if no selection)
  const getEffectiveState = useCallback(() => {
    return state.selectedState || 'nationwide';
  }, [state.selectedState]);

  // Fetch homepage data with caching
  const fetchData = useCallback(
    async (isRefresh = false) => {
      const effectiveState = state.selectedState || 'nationwide';
      const cacheKey = `homepage-${effectiveState}-${state.timePeriod}`;

      // Check cache first (unless forcing refresh)
      if (!isRefresh) {
        const cached = getCachedData(cacheKey);
        if (cached) {
          dispatch({
            type: ActionTypes.SET_ALL_DATA,
            payload: cached,
          });
          dispatch({ type: ActionTypes.SET_LOADING, payload: false });
          return;
        }
      }

      if (isRefresh) {
        dispatch({ type: ActionTypes.SET_REFRESHING, payload: true });
      } else {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      }
      dispatch({ type: ActionTypes.SET_ERROR, payload: null });

      try {
        const data = await homepageApi.fetchAllHomepageData(effectiveState, state.timePeriod);

        const payload = {
          walletShocks: data.walletShocks,
          costDrivers: data.costDrivers,
          stats: data.stats,
          stateComparisons: data.stateComparisons,
          socialPosts: data.socialPosts,
          quickQuestions: data.quickQuestions,
          timelineConfig: data.timelineConfig,
        };

        // Cache the response
        setCachedData(cacheKey, payload);

        dispatch({
          type: ActionTypes.SET_ALL_DATA,
          payload,
        });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[DEV] Error fetching homepage data:', err);
        }
        dispatch({ type: ActionTypes.SET_ERROR, payload: err.message });
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        dispatch({ type: ActionTypes.SET_REFRESHING, payload: false });
      }
    },
    [state.selectedState, state.timePeriod],
  );

  // Load user preferences on mount
  useEffect(() => {
    async function loadUserPreferences() {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

        // Check cached preferences first
        const cachedPrefs = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
        if (cachedPrefs) {
          try {
            const prefs = JSON.parse(cachedPrefs);
            if (prefs.selectedState) {
              dispatch({ type: ActionTypes.SET_SELECTED_STATE, payload: prefs.selectedState });
            }
            if (prefs.defaultTimePeriod) {
              dispatch({ type: ActionTypes.SET_TIME_PERIOD, payload: prefs.defaultTimePeriod });
            }
          } catch {
            // Silent fail for corrupt cached preferences
          }
        }

        // If logged in, fetch fresh preferences
        if (token) {
          const response = await fetch(`${API_URL}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user.preferences) {
              localStorage.setItem(
                STORAGE_KEYS.USER_PREFERENCES,
                JSON.stringify(data.user.preferences),
              );
              if (data.user.preferences.selectedState) {
                dispatch({
                  type: ActionTypes.SET_SELECTED_STATE,
                  payload: data.user.preferences.selectedState,
                });
              }
              if (data.user.preferences.defaultTimePeriod) {
                dispatch({
                  type: ActionTypes.SET_TIME_PERIOD,
                  payload: data.user.preferences.defaultTimePeriod,
                });
              }
            }
          }
        }
      } catch {
        // Silent fail for user preferences loading
      }
    }

    loadUserPreferences();
  }, []);

  // Fetch map data for heat map visualization
  const fetchMapData = useCallback(async () => {
    try {
      const data = await homepageApi.fetchMapData();
      if (data.success && data.regions) {
        dispatch({ type: ActionTypes.SET_MAP_REGIONS, payload: data.regions });
      }
    } catch {
      // Silent fail for map data fetching
    }
  }, []);

  // Fetch data when state or time period changes
  // state.loading is read as a parameter, not a trigger — including it would cause infinite loops
  useEffect(() => {
    fetchData(state.loading === false);
    fetchMapData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedState, state.timePeriod, fetchData, fetchMapData]);

  // Save user preferences
  const savePreferences = useCallback(async (updates) => {
    try {
      // Update cache immediately
      const cachedPrefs = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      let prefs = {};
      if (cachedPrefs) {
        try {
          prefs = JSON.parse(cachedPrefs);
        } catch {
          // Silent fail for corrupt cached preferences
        }
      }
      const updatedPrefs = { ...prefs, ...updates };
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updatedPrefs));

      // Save to backend if logged in
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        await fetch(`${API_URL}/api/user/preferences`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });
      }
    } catch {
      // Silent fail for preference saving
    }
  }, []);

  // Memoize the actions object to prevent unnecessary re-renders
  const memoizedActions = useMemo(
    () => ({
      setSelectedState: (newState) => {
        const stateValue = newState === 'All states' ? 'nationwide' : newState;
        dispatch({ type: ActionTypes.SET_SELECTED_STATE, payload: stateValue });
        savePreferences({ selectedState: stateValue });
      },

      setTimePeriod: (period) => {
        dispatch({ type: ActionTypes.SET_TIME_PERIOD, payload: period });
        savePreferences({ defaultTimePeriod: period });
      },

      addReaction: async (shockId, reactionType) => {
        try {
          const data = await homepageApi.addReaction(shockId, reactionType);
          dispatch({
            type: ActionTypes.UPDATE_REACTION,
            payload: { shockId, reactions: data.reactions },
          });
        } catch {
          // Silent fail for reaction adding
        }
      },

      toggleDropdown: (dropdownName) => {
        dispatch({ type: ActionTypes.TOGGLE_DROPDOWN, payload: dropdownName });
      },

      closeAllDropdowns: () => {
        dispatch({ type: ActionTypes.CLOSE_ALL_DROPDOWNS });
      },

      setDropdownSearch: (dropdown, value) => {
        dispatch({ type: ActionTypes.SET_DROPDOWN_SEARCH, payload: { dropdown, value } });
      },

      showImpactModal: (product = '') => {
        dispatch({ type: ActionTypes.SET_SHOW_IMPACT_MODAL, payload: { show: true, product } });
      },

      hideImpactModal: () => {
        dispatch({ type: ActionTypes.SET_SHOW_IMPACT_MODAL, payload: { show: false } });
      },

      setTimelineDate: (value) => {
        dispatch({ type: ActionTypes.SET_TIMELINE_DATE, payload: value });
      },

      setSearchQuery: (query) => {
        dispatch({ type: ActionTypes.SET_SEARCH_QUERY, payload: query });
      },

      setProductQuery: (query) => {
        dispatch({ type: ActionTypes.SET_PRODUCT_QUERY, payload: query });
      },

      refresh: () => {
        clearCache(); // Clear cache on manual refresh
        fetchData(true);
      },

      clearCache: () => clearCache(),

      downloadReport: () => {
        homepageApi.downloadReport(getEffectiveState(), state.timePeriod);
      },

      downloadCSV: () => {
        homepageApi.downloadCSV(getEffectiveState());
      },
    }),
    [savePreferences, fetchData, getEffectiveState, state.timePeriod],
  );

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      state,
      actions: memoizedActions,
      getEffectiveState,
    }),
    [state, memoizedActions, getEffectiveState],
  );

  return <HomepageContext.Provider value={value}>{children}</HomepageContext.Provider>;
}

// Custom hook to use the homepage context
export function useHomepage() {
  const context = useContext(HomepageContext);
  if (!context) {
    throw new Error('useHomepage must be used within a HomepageProvider');
  }
  return context;
}

// Export all states list for dropdowns
export const ALL_STATES = [
  'All states',
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];

// Featured states for quick access
export const FEATURED_STATES = [
  'CALIFORNIA',
  'TEXAS',
  'FLORIDA',
  'ARIZONA',
  'NEW YORK',
  'WASHINGTON',
];

export default HomepageContext;
