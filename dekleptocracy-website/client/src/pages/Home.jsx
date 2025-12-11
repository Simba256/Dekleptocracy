import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Home = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [userSelectedState, setUserSelectedState] = useState('California');
  const [selectedState, setSelectedState] = useState('CALIFORNIA');
  const [searchState, setSearchState] = useState('');
  const [impactState, setImpactState] = useState('California');
  const [timePeriod, setTimePeriod] = useState('YoY');
  const [isHeroStateDropdownOpen, setIsHeroStateDropdownOpen] = useState(false);
  const [isMapStateDropdownOpen, setIsMapStateDropdownOpen] = useState(false);
  const [isWalletShocksDropdownOpen, setIsWalletShocksDropdownOpen] = useState(false);
  const [isCostImpactDropdownOpen, setIsCostImpactDropdownOpen] = useState(false);
  const [timelineDate, setTimelineDate] = useState(50);
  const [productQuery, setProductQuery] = useState('');
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [heroStateSearch, setHeroStateSearch] = useState('');
  const [mapStateSearch, setMapStateSearch] = useState('');
  const [walletShocksStateSearch, setWalletShocksStateSearch] = useState('');
  const [costImpactStateSearch, setCostImpactStateSearch] = useState('');

  // API data states
  const [walletShocks, setWalletShocks] = useState([]);
  const [costDrivers, setCostDrivers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const quickQuestions = [
    'How does the new tax hit my grocery bill in my city?',
    'Why is gas more expensive in my city than last year?',
    'Compare eggs and milk prices in my city than others?'
  ];

  const states = ['CALIFORNIA', 'TEXAS', 'FLORIDA', 'ARIZONA', 'NEW YORK', 'WASHINGTON'];
  
  const allStates = [
    'All states', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois',
    'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana',
    'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah',
    'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  // Filter states based on search input
  const getFilteredStates = (searchTerm) => {
    if (!searchTerm) return allStates;
    return allStates.filter(state =>
      state.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Fetch homepage data from API
  useEffect(() => {
    // Don't fetch until preferences are loaded
    if (!preferencesLoaded) return;

    async function fetchHomepageData() {
      // Use isRefreshing for subsequent fetches (after initial load)
      if (loading === false) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const state = userSelectedState || 'California';

        // Fetch wallet shocks
        const shocksRes = await fetch(`${API_URL}/api/homepage/wallet-shocks?state=${state}&limit=4`);
        if (!shocksRes.ok) throw new Error('Failed to fetch wallet shocks');
        const shocksData = await shocksRes.json();
        setWalletShocks(shocksData.shocks || []);

        // Fetch cost drivers
        const driversRes = await fetch(`${API_URL}/api/homepage/cost-drivers?state=${state}&period=${timePeriod}`);
        if (!driversRes.ok) throw new Error('Failed to fetch cost drivers');
        const driversData = await driversRes.json();
        setCostDrivers(driversData.drivers || []);

        // Fetch stats
        const statsRes = await fetch(`${API_URL}/api/homepage/stats?state=${state}`);
        if (!statsRes.ok) throw new Error('Failed to fetch stats');
        const statsData = await statsRes.json();
        setStats(statsData.stats || {});

      } catch (err) {
        console.error('Error fetching homepage data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    }

    fetchHomepageData();
  }, [userSelectedState, timePeriod, preferencesLoaded]);

  // Load user preferences on mount
  useEffect(() => {
    async function loadUserPreferences() {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          // No token, mark preferences as loaded with defaults
          setPreferencesLoaded(true);
          return;
        }

        const response = await fetch(`${API_URL}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user.preferences) {
            // Set state and time period from saved preferences
            if (data.user.preferences.selectedState) {
              setUserSelectedState(data.user.preferences.selectedState);
            }
            if (data.user.preferences.defaultTimePeriod) {
              setTimePeriod(data.user.preferences.defaultTimePeriod);
            }
          }
        }
      } catch (err) {
        console.error('Error loading user preferences:', err);
      } finally {
        // Mark preferences as loaded (either from server or using defaults)
        setPreferencesLoaded(true);
      }
    }

    loadUserPreferences();
  }, []); // Run only once on mount

  // Download PDF report
  const handleDownloadReport = () => {
    const state = userSelectedState || 'California';
    const period = timePeriod || 'YoY';

    // Direct link approach - let the browser handle the download
    window.location.href = `${API_URL}/api/homepage/download/report?state=${encodeURIComponent(state)}&period=${period}`;
  };

  // Download CSV export
  const handleDownloadCSV = () => {
    const state = userSelectedState || 'California';
    const url = `${API_URL}/api/homepage/download/csv?state=${encodeURIComponent(state)}`;
    window.open(url, '_blank');
  };

  // Handle reaction clicks
  const handleReaction = async (shockId, reactionType) => {
    try {
      const response = await fetch(`${API_URL}/api/homepage/wallet-shocks/${shockId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state with new reaction counts
        setWalletShocks(prev => prev.map(shock =>
          shock._id === shockId
            ? { ...shock, reactions: data.reactions }
            : shock
        ));
      }
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  };

  // Save user preferences (state and time period)
  const saveUserPreferences = async (updates) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // Only save if user is logged in

      const response = await fetch(`${API_URL}/api/user/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        console.log('Preferences saved successfully');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
    }
  };

  // Handle state change with preference saving
  const handleStateChange = (newState) => {
    setUserSelectedState(newState);
    saveUserPreferences({ selectedState: newState });
  };

  // Handle time period change with preference saving
  const handleTimePeriodChange = (newPeriod) => {
    setTimePeriod(newPeriod);
    saveUserPreferences({ defaultTimePeriod: newPeriod });
  };

  // Fallback hardcoded costDrivers for sections that haven't been migrated yet
  const fallbackCostDrivers = [
    { label: 'Tariffs', percentage: 34, color: '#3E5132', type: 'direct' },
    { label: 'Fuels', percentage: 22, color: '#6B7F5F', type: 'direct' },
    { label: 'Labor', percentage: 20, color: '#A8B89C', type: 'direct' },
    { label: 'Supply Chain', percentage: 18, color: '#A8B89C', type: 'indirect' },
    { label: 'Currency', percentage: 13, color: '#C5D4BC', type: 'indirect' },
    { label: 'Weather', percentage: 5, color: '#9CA3AF', type: 'indirect' }
  ];

  const comparisonData = [
    {
      category: 'Grocery basket',
      percentHigher: '+4%',
      stateValue: '$412',
      nationalValue: '$395'
    },
    {
      category: 'Fuel Price',
      percentHigher: '+3.8%',
      stateValue: '$3.84',
      nationalValue: '$3.70'
    },
    {
      category: 'Electricity Bill',
      percentHigher: '+69%',
      stateValue: '$282',
      nationalValue: '$187'
    },
    {
      category: 'Books & Printing',
      percentHigher: '+12%',
      stateValue: '4.8%',
      nationalValue: '4.1%'
    }
  ];

  const topShocksNearYou = [
    { item: 'Milk +10%', location: 'Chicago, IL', icon: '🥛', bgColor: '#fef3c7' },
    { item: 'iPhone tax $45', location: 'San Jose, CA', icon: '📱', bgColor: '#dbeafe' },
    { item: 'Coffee +12%', location: 'Seattle, WA', icon: '☕', bgColor: '#fed7d7' },
    { item: 'School funding -8.7%', location: 'Seattle, WA', icon: '📚', bgColor: '#d1f4dd' },
    { item: 'Energy costs +68%', location: 'Seattle, WA', icon: '💡', bgColor: '#fed7d7' }
  ];

  const socialPosts = [
    {
      username: '@janedoe',
      platform: 'X Twitter',
      timeAgo: '2h ago',
      verified: false,
      text: '"$6.12/gal in LA today. That\'s half my paycheck gone on gas."',
      image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&h=400&fit=crop',
      comments: 250,
      retweets: '8.7k',
      likes: '134.6k'
    },
    {
      username: '@markfoodie',
      platform: 'Thread',
      timeAgo: '5h ago',
      verified: true,
      text: '"Our grocery bill jumped from $120 to $170 in two months. Same cart, same store."',
      image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&h=400&fit=crop',
      comments: 250,
      retweets: '8.7k',
      likes: '134.6k'
    },
    {
      username: '@janedee',
      platform: 'X Twitter',
      timeAgo: '2h ago',
      verified: true,
      text: '"Electric bill was $280 this month in Nebraska. 40% higher than last year."',
      image: 'https://images.unsplash.com/photo-1554224311-beee415c201f?w=600&h=400&fit=crop',
      comments: 250,
      retweets: '8.7k',
      likes: '134.6k'
    }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="home-page">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #4A5D3F',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading homepage data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="home-page">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <p style={{ color: '#ef4444', fontSize: '18px' }}>Error loading data: {error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4A5D3F',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          {/* AI Capsule Bar */}
          <div className="ai-capsule-bar">
            <svg className="ai-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="8" width="16" height="12" rx="2" />
              <path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              <circle cx="9" cy="14" r="1" fill="currentColor" />
              <circle cx="15" cy="14" r="1" fill="currentColor" />
              <path d="M9 17h6" />
            </svg>
            <span className="ai-capsule-text">AI-Powered Policy Intelligence System</span>
          </div>

          <h1 className="hero-title">
            Discover how government decisions<br />
            impact your budget
          </h1>

          {/* AI Search Box */}
          <div className="search-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="Ask anything about prices, tariffs or your bills."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-input"
              />
              <div className="search-tools">
                <button className="tool-btn" title="Attach file">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <button className="tool-btn" title="Add emoji">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                  </svg>
                </button>
                <button className="tool-btn" title="Add image">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </button>
                <button className="tool-btn" title="Format text">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                </button>
              </div>
              <button className="ask-ai-btn" onClick={() => navigate('/chatbot', { state: { initialQuery: query } })}>
                Ask AI
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="13 17 18 12 13 7" />
                  <polyline points="6 17 11 12 6 7" />
                </svg>
              </button>
            </div>

            {/* Location Input */}
            <div className="location-section">
              <span className="location-label">Select Your State:</span>
              <div className="custom-dropdown" style={{ position: 'relative' }}>
                <button
                  className="hero-state-dropdown-button"
                  onClick={() => {
                    setIsHeroStateDropdownOpen(!isHeroStateDropdownOpen);
                    setHeroStateSearch('');
                  }}
                >
                  <span>{userSelectedState}</span>
                  <svg
                    className={`dropdown-arrow ${isHeroStateDropdownOpen ? 'open' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {isHeroStateDropdownOpen && (
                  <>
                    <div
                      className="dropdown-overlay"
                      onClick={() => {
                        setIsHeroStateDropdownOpen(false);
                        setHeroStateSearch('');
                      }}
                    ></div>
                    <div className="custom-dropdown-menu">
                      <div className="dropdown-search-container">
                        <input
                          type="text"
                          className="dropdown-search-input"
                          placeholder="Search states..."
                          value={heroStateSearch}
                          onChange={(e) => setHeroStateSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                      <div className="dropdown-items-container">
                        {getFilteredStates(heroStateSearch).map((state, index) => (
                          <div
                            key={index}
                            className={`custom-dropdown-item ${userSelectedState === state ? 'selected' : ''}`}
                            onClick={() => {
                              handleStateChange(state);
                              setIsHeroStateDropdownOpen(false);
                              setHeroStateSearch('');
                            }}
                          >
                            {state}
                          </div>
                        ))}
                        {getFilteredStates(heroStateSearch).length === 0 && (
                          <div className="dropdown-no-results">No states found</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Question Cards */}
            <div className="quick-questions">
              <div className="question-card">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>How does the new tax hit my grocery bill in my city?</span>
              </div>
              <div className="question-card">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                <span>Why is gas more expensive in my city than last year?</span>
              </div>
              <div className="question-card">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span>Compare eggs and milk prices in my city than others?</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {/* Lobbying Cases Tracked */}
          <div className="stat-card stat-card-large">
            <div className="stat-header">
              <h3 className="stat-title">Lobbying Cases Tracked</h3>
            </div>
            <div className="stat-value">276K</div>
            <div className="stat-chart">
              <svg viewBox="0 0 300 100" className="line-chart">
                <path
                  d="M 0 80 Q 30 70 60 65 T 120 55 Q 150 45 180 60 T 240 40 L 270 30 L 300 35"
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="2.5"
                />
                <path
                  d="M 0 80 Q 30 70 60 65 T 120 55 Q 150 45 180 60 T 240 40 L 270 30 L 300 35 L 300 100 L 0 100 Z"
                  fill="url(#gradient)"
                  opacity="0.25"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Consumer Cost Impact */}
          <div className="stat-card stat-card-pink">
            <div className="stat-icon">💳</div>
            <h3 className="stat-title-small">Consumer Cost Impact</h3>
            <div className="stat-value-medium">$4,679</div>
            <div className="stat-change stat-change-up">
              ↑ +28.42% due to tariffs
            </div>
          </div>

          {/* Lobbyist Contributions */}
          <div className="stat-card stat-card-red">
            <div className="stat-icon">💰</div>
            <h3 className="stat-title-small">Lobbyist Contributions</h3>
            <div className="stat-value-medium">$9.2M</div>
            <div className="stat-change stat-change-down">
              ↓ +18.6%
            </div>
          </div>

          {/* Tariff Revenue */}
          <div className="stat-card stat-card-pink">
            <div className="stat-header">
              <h3 className="stat-title">Tariff Revenue</h3>
            </div>
            <div className="stat-value">$6.7B</div>
            <p className="stat-description">Weekly revenue collected from tariffs on imported goods.</p>
            <div className="bar-chart">
              <div className="bar-group">
                <div className="bar" style={{ height: '40%' }}></div>
                <span className="bar-label">M</span>
              </div>
              <div className="bar-group">
                <div className="bar" style={{ height: '55%' }}></div>
                <span className="bar-label">T</span>
              </div>
              <div className="bar-group">
                <div className="bar" style={{ height: '45%' }}></div>
                <span className="bar-label">W</span>
              </div>
              <div className="bar-group">
                <div className="bar" style={{ height: '50%' }}></div>
                <span className="bar-label">T</span>
              </div>
              <div className="bar-group">
                <div className="bar bar-active" style={{ height: '80%' }}></div>
                <span className="bar-label">F</span>
              </div>
              <div className="bar-group">
                <div className="bar" style={{ height: '35%' }}></div>
                <span className="bar-label">S</span>
              </div>
              <div className="bar-group">
                <div className="bar" style={{ height: '30%' }}></div>
                <span className="bar-label">S</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Wallet Shocks Section */}
      <section className="wallet-shocks-section">
        <div className="wallet-shocks-container">
          <h2 className="wallet-shocks-title">Top Wallet Shocks This Week</h2>

          {/* State Filter Tabs */}
          <div className="state-filters">
            {states.map((state) => (
              <button
                key={state}
                onClick={() => {
                  setSelectedState(state);
                  // Convert uppercase state to proper case for API (TEXAS -> Texas)
                  const properCaseState = state.split(' ').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  ).join(' ');
                  handleStateChange(properCaseState);
                }}
                className={`state-tab ${selectedState === state ? 'active' : ''}`}
              >
                {state}
              </button>
            ))}
          </div>

          {/* Custom Dropdown */}
          <div className="state-controls">
            <div className="state-dropdown-wrapper">
              <label className="state-dropdown-label">Select Your Location</label>
              <div className="custom-dropdown">
                <button
                  className="state-dropdown-button"
                  onClick={() => {
                    setIsWalletShocksDropdownOpen(!isWalletShocksDropdownOpen);
                    setWalletShocksStateSearch('');
                  }}
                >
                  <span>Current Location</span>
                  <span className="dropdown-selected-value">{userSelectedState}</span>
                  <svg
                    className={`dropdown-arrow ${isWalletShocksDropdownOpen ? 'open' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {isWalletShocksDropdownOpen && (
                  <>
                    <div
                      className="dropdown-overlay"
                      onClick={() => {
                        setIsWalletShocksDropdownOpen(false);
                        setWalletShocksStateSearch('');
                      }}
                    ></div>
                    <div className="custom-dropdown-menu">
                      <div className="dropdown-search-container">
                        <input
                          type="text"
                          className="dropdown-search-input"
                          placeholder="Search states..."
                          value={walletShocksStateSearch}
                          onChange={(e) => setWalletShocksStateSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                      <div className="dropdown-items-container">
                        {getFilteredStates(walletShocksStateSearch).map((state, index) => (
                          <div
                            key={index}
                            className={`custom-dropdown-item ${userSelectedState === state ? 'selected' : ''}`}
                            onClick={() => {
                              handleStateChange(state);
                              setIsWalletShocksDropdownOpen(false);
                              setWalletShocksStateSearch('');
                            }}
                          >
                            {state}
                          </div>
                        ))}
                        {getFilteredStates(walletShocksStateSearch).length === 0 && (
                          <div className="dropdown-no-results">No states found</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Wallet Shock Cards */}
          <div className="wallet-cards" style={{ opacity: isRefreshing ? 0.6 : 1, transition: 'opacity 0.3s' }}>
            {walletShocks.map((shock, index) => (
              <div key={index} className="wallet-card">
                <div className="wallet-card-header">
                  <span className="category-badge">{shock.category}</span>
                </div>
                
                <div className="wallet-card-content">
                  <div className="icon-circle" style={{ backgroundColor: shock.iconBg }}>
                    {shock.icon}
                  </div>
                  <p className="wallet-card-title">{shock.title}</p>
                </div>
                
                <div className="wallet-price-section">
                  <span className="wallet-price">{shock.price}</span>
                  <span className="wallet-unit">{shock.unit}</span>
                  <span className="wallet-change">{shock.change}</span>
                </div>

                <div className="wallet-chart">
                  <svg viewBox="0 0 200 80" className="mini-chart">
                    <path
                      d={shock.chartPath}
                      fill="none"
                      stroke={shock.chartColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="wallet-card-footer">
                  <button 
                    onClick={() => navigate(`/insights?category=${shock.category.toLowerCase()}&state=${selectedState}`)}
                    className="see-details"
                  >
                    See details →
                  </button>
                  <div className="reactions">
                    <span
                      onClick={() => handleReaction(shock._id, 'shock')}
                      style={{ cursor: 'pointer' }}
                    >
                      😮 {shock.reactions?.shock || 0}
                    </span>
                    <span
                      onClick={() => handleReaction(shock._id, 'angry')}
                      style={{ cursor: 'pointer' }}
                    >
                      😡 {shock.reactions?.angry || 0}
                    </span>
                    <span
                      onClick={() => handleReaction(shock._id, 'sad')}
                      style={{ cursor: 'pointer' }}
                    >
                      😢 {shock.reactions?.sad || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <p className="wallet-note">
            Red ↗ indicates price increases; blue lines indicate neutral to declining trends. Values are illustrative for layout only.
          </p>
        </div>
      </section>

      {/* Cost Drivers & Household Impact Section */}
      <section className="cost-impact-section">
        <div className="cost-impact-container">
          {/* Header */}
          <div className="cost-impact-header">
            <div className="cost-impact-text">
              <h2 className="cost-impact-title">Cost Drivers & Household Impact</h2>
              <p className="cost-impact-subtitle">
                Lean, authoritative data views. Explore what's driving prices and how it hits your bills.
              </p>
            </div>
            <div className="cost-impact-controls">
              <div className="state-dropdown-wrapper">
                <label className="state-dropdown-label">Select Your Location:</label>
                <div className="custom-dropdown" style={{ position: 'relative' }}>
                  <button
                    className="state-dropdown-button"
                    onClick={() => {
                      setIsCostImpactDropdownOpen(!isCostImpactDropdownOpen);
                      setCostImpactStateSearch('');
                    }}
                  >
                    <span>Current Location</span>
                    <span className="dropdown-selected-value">{userSelectedState}</span>
                    <svg
                      className={`dropdown-arrow ${isCostImpactDropdownOpen ? 'open' : ''}`}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {isCostImpactDropdownOpen && (
                    <>
                      <div
                        className="dropdown-overlay"
                        onClick={() => {
                          setIsCostImpactDropdownOpen(false);
                          setCostImpactStateSearch('');
                        }}
                      ></div>
                      <div className="custom-dropdown-menu">
                        <div className="dropdown-search-container">
                          <input
                            type="text"
                            className="dropdown-search-input"
                            placeholder="Search states..."
                            value={costImpactStateSearch}
                            onChange={(e) => setCostImpactStateSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                        <div className="dropdown-items-container">
                          {getFilteredStates(costImpactStateSearch).map((state, index) => (
                            <div
                              key={index}
                              className={`custom-dropdown-item ${userSelectedState === state ? 'selected' : ''}`}
                              onClick={() => {
                                handleStateChange(state);
                                setIsCostImpactDropdownOpen(false);
                                setCostImpactStateSearch('');
                              }}
                            >
                              {state}
                            </div>
                          ))}
                          {getFilteredStates(costImpactStateSearch).length === 0 && (
                            <div className="dropdown-no-results">No states found</div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="time-period-buttons">
                {['YoY', '3 months', '30 days'].map((period) => (
                  <button
                    key={period}
                    onClick={() => handleTimePeriodChange(period)}
                    className={`period-btn ${timePeriod === period ? 'active' : ''}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="cost-impact-grid">
            {/* Left: What's pushing prices up */}
            <div className="price-drivers-panel">
              <h3 className="panel-title">What's pushing prices up</h3>
              <p className="panel-subtitle">Share of contribution to overall increase(illustrative)</p>
              
              <div className="drivers-chart">
                {costDrivers.map((driver, index) => (
                  <div key={index} className="driver-row">
                    <span className="driver-label">{driver.label}</span>
                    <div className="driver-bar-container">
                      <div 
                        className="driver-bar" 
                        style={{ 
                          width: `${driver.percentage}%`, 
                          backgroundColor: driver.color 
                        }}
                      />
                    </div>
                    <span className="driver-percentage">{driver.percentage}%</span>
                  </div>
                ))}
              </div>

              <p className="drivers-note">
                Red shades = direct price pressure<br />
                Blue = indirect/systemic factors
              </p>
            </div>

            {/* Right: Your state vs. national average */}
            <div className="comparison-panel">
              <h3 className="panel-title">Your state vs. national average</h3>
              
              <div className="comparison-grid">
                {comparisonData.map((item, index) => (
                  <div key={index} className="comparison-card">
                    <h4 className="comparison-category">{item.category}</h4>
                    <div className="comparison-percent">{item.percentHigher} higher</div>
                    <p className="comparison-values">
                      (Your state: {item.stateValue} vs Nat'l: {item.nationalValue})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="cost-impact-actions">
            <button className="action-btn primary" onClick={handleDownloadReport}>Download report (PDF)</button>
            <button className="action-btn secondary">Compare states</button>
          </div>
        </div>
      </section>

      {/* Budget Impact Discovery Section */}
      <section className="budget-impact-section">
        <div className="budget-impact-container">
          <h2 className="budget-impact-title">Discover How Government Decisions Impact Your Budget</h2>
          <p className="budget-impact-subtitle">
            Pick a date, enter a product, and discover how inflation, tariffs, and lobbying dollars shape the cost you pay.
          </p>

          <div className="timeline-card">
            <div className="timeline-header">
              <h3 id="timeline-slider-label" className="timeline-title">Slide to Select Your Starting Point:</h3>
            </div>

            <div className="timeline-slider-container">
              <div className="timeline-labels">
                <div className="timeline-point">
                  <div className="timeline-date">Jul 1, 2024</div>
                  <div className="timeline-label">Before Policy</div>
                </div>
                <div className="timeline-point">
                  <div className="timeline-date">Oct 1, 2024</div>
                  <div className="timeline-label">Pre-Election</div>
                </div>
                <div className="timeline-point active">
                  <div className="timeline-date active">Jan 20, 2025</div>
                  <div className="timeline-label active">Inauguration Day</div>
                </div>
                <div className="timeline-point">
                  <div className="timeline-date">Apr 1, 2025</div>
                  <div className="timeline-label">Early Months</div>
                </div>
                <div className="timeline-point">
                  <div className="timeline-date">Jul 1, 2025</div>
                  <div className="timeline-label">Mid-Year</div>
                </div>
                <div className="timeline-point">
                  <div className="timeline-date">Oct 1, 2025</div>
                  <div className="timeline-label">Current Snapshot</div>
                </div>
              </div>

              <input
                type="range"
                id="timeline-slider"
                min="0"
                max="100"
                value={timelineDate}
                onChange={(e) => setTimelineDate(e.target.value)}
                className="timeline-slider"
                aria-labelledby="timeline-slider-label"
                aria-label="Select timeline starting point"
                title="Select timeline starting point"
                style={{
                  background: `linear-gradient(to right, #FF6B5A 0%, #FF6B5A ${timelineDate}%, #e5e7eb ${timelineDate}%, #e5e7eb 100%)`
                }}
              />
            </div>
          </div>

          <div className="product-search-section">
            <h3 className="product-search-title">What's affecting your budget?</h3>
            <div className="product-search-container">
              <input
                type="text"
                placeholder="housing"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                className="product-search-input"
              />
              <button 
                className="show-impact-btn"
                onClick={() => setShowImpactModal(true)}
              >
                Show Impact
              </button>
            </div>
            <p className="product-suggestions">
              <span className="suggestions-label">Try these:</span> eggs, housing, gasoline
            </p>
          </div>
        </div>
      </section>

          {/* Price Surging Map Section */}
      <section className="price-map-section">
        <div className="price-map-container">
          <h2 className="price-map-title">See where Prices are Surging</h2>

          <div className="map-content">
            {/* Map Area */}
            <div className="map-area">
              <div className="map-wrapper">
                {/* Base US map image */}
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Blank_US_Map_%28states_only%29.svg/1280px-Blank_US_Map_%28states_only%29.svg.png" 
                  alt="US Map" 
                  className="us-map-base"
                />
                
                {/* Colored overlay with improved heat map */}
                <svg viewBox="0 0 960 600" className="heat-overlay" preserveAspectRatio="xMidYMid meet">
                  {/* High Intensity - Dark Red States */}
                  {/* California */}
                  <ellipse cx="85" cy="285" rx="75" ry="90" fill="#b91c1c" opacity="0.85" className="heat-blob" />
                  
                  {/* Texas */}
                  <ellipse cx="420" cy="445" rx="120" ry="95" fill="#b91c1c" opacity="0.85" className="heat-blob" />
                  
                  {/* Arizona */}
                  <ellipse cx="175" cy="360" rx="55" ry="65" fill="#dc2626" opacity="0.8" className="heat-blob" />
                  
                  {/* New Mexico */}
                  <ellipse cx="245" cy="375" rx="50" ry="70" fill="#dc2626" opacity="0.8" className="heat-blob" />
                  
                  {/* Medium-High Intensity - Red-Orange States */}
                  {/* Oklahoma */}
                  <ellipse cx="340" cy="375" rx="55" ry="50" fill="#ea580c" opacity="0.75" className="heat-blob" />
                  
                  {/* Louisiana */}
                  <ellipse cx="465" cy="480" rx="50" ry="45" fill="#b91c1c" opacity="0.78" className="heat-blob" />
                  
                  {/* Medium Intensity - Orange States */}
                  {/* Washington */}
                  <ellipse cx="75" cy="135" rx="55" ry="45" fill="#ea580c" opacity="0.72" className="heat-blob" />
                  
                  {/* Oregon */}
                  <ellipse cx="75" cy="190" rx="60" ry="50" fill="#ea580c" opacity="0.72" className="heat-blob" />
                  
                  {/* Nevada */}
                  <ellipse cx="135" cy="260" rx="50" ry="70" fill="#ea580c" opacity="0.68" className="heat-blob" />
                  
                  {/* Utah */}
                  <ellipse cx="185" cy="265" rx="45" ry="60" fill="#f97316" opacity="0.68" className="heat-blob" />
                  
                  {/* Colorado */}
                  <ellipse cx="250" cy="280" rx="55" ry="55" fill="#f97316" opacity="0.68" className="heat-blob" />
                  
                  {/* Kansas */}
                  <ellipse cx="350" cy="300" rx="60" ry="45" fill="#f97316" opacity="0.68" className="heat-blob" />
                  
                  {/* Illinois */}
                  <ellipse cx="500" cy="280" rx="40" ry="70" fill="#f97316" opacity="0.68" className="heat-blob" />
                  
                  {/* Indiana */}
                  <ellipse cx="540" cy="285" rx="40" ry="55" fill="#f97316" opacity="0.65" className="heat-blob" />
                  
                  {/* Ohio */}
                  <ellipse cx="590" cy="275" rx="50" ry="55" fill="#f97316" opacity="0.65" className="heat-blob" />
                  
                  {/* Wisconsin */}
                  <ellipse cx="480" cy="205" rx="50" ry="60" fill="#f97316" opacity="0.65" className="heat-blob" />
                  
                  {/* Michigan */}
                  <ellipse cx="540" cy="215" rx="55" ry="70" fill="#ea580c" opacity="0.68" className="heat-blob" />
                  
                  {/* New York */}
                  <ellipse cx="755" cy="195" rx="65" ry="55" fill="#f97316" opacity="0.68" className="heat-blob" />
                  
                  {/* Pennsylvania */}
                  <ellipse cx="705" cy="255" rx="60" ry="45" fill="#f97316" opacity="0.65" className="heat-blob" />
                  
                  {/* Georgia */}
                  <ellipse cx="630" cy="380" rx="50" ry="60" fill="#f97316" opacity="0.65" className="heat-blob" />
                  
                  {/* Alabama */}
                  <ellipse cx="570" cy="395" rx="45" ry="60" fill="#f97316" opacity="0.65" className="heat-blob" />
                  
                  {/* Medium-Low Intensity - Light Orange States */}
                  {/* Arkansas */}
                  <ellipse cx="445" cy="375" rx="45" ry="55" fill="#f97316" opacity="0.62" className="heat-blob" />
                  
                  {/* Missouri */}
                  <ellipse cx="450" cy="310" rx="55" ry="50" fill="#f97316" opacity="0.62" className="heat-blob" />
                  
                  {/* Iowa */}
                  <ellipse cx="440" cy="245" rx="55" ry="45" fill="#fb923c" opacity="0.58" className="heat-blob" />
                  
                  {/* Tennessee */}
                  <ellipse cx="570" cy="350" rx="70" ry="40" fill="#f97316" opacity="0.62" className="heat-blob" />
                  
                  {/* Kentucky */}
                  <ellipse cx="600" cy="310" rx="65" ry="40" fill="#f97316" opacity="0.62" className="heat-blob" />
                  
                  {/* North Carolina */}
                  <ellipse cx="700" cy="345" rx="70" ry="45" fill="#f97316" opacity="0.60" className="heat-blob" />
                  
                  {/* South Carolina */}
                  <ellipse cx="680" cy="385" rx="45" ry="45" fill="#f97316" opacity="0.58" className="heat-blob" />
                  
                  {/* Virginia */}
                  <ellipse cx="710" cy="305" rx="65" ry="45" fill="#f97316" opacity="0.60" className="heat-blob" />
                  
                  {/* Florida */}
                  <ellipse cx="700" cy="485" rx="60" ry="100" fill="#fb923c" opacity="0.58" className="heat-blob" transform="rotate(15 700 485)" />
                  
                  {/* Mississippi */}
                  <ellipse cx="510" cy="420" rx="40" ry="65" fill="#f97316" opacity="0.58" className="heat-blob" />
                  
                  {/* Wyoming */}
                  <ellipse cx="240" cy="220" rx="50" ry="55" fill="#fb923c" opacity="0.55" className="heat-blob" />
                  
                  {/* Montana */}
                  <ellipse cx="200" cy="155" rx="80" ry="50" fill="#fb923c" opacity="0.55" className="heat-blob" />
                  
                  {/* Low Intensity - Yellow/Peach States */}
                  {/* Idaho */}
                  <ellipse cx="155" cy="195" rx="45" ry="75" fill="#fb923c" opacity="0.52" className="heat-blob" />
                  
                  {/* Minnesota */}
                  <ellipse cx="450" cy="165" rx="55" ry="65" fill="#fb923c" opacity="0.52" className="heat-blob" />
                  
                  {/* North Dakota */}
                  <ellipse cx="370" cy="140" rx="55" ry="45" fill="#fbbf24" opacity="0.48" className="heat-blob" />
                  
                  {/* South Dakota */}
                  <ellipse cx="360" cy="205" rx="60" ry="45" fill="#fbbf24" opacity="0.48" className="heat-blob" />
                  
                  {/* Nebraska */}
                  <ellipse cx="340" cy="255" rx="65" ry="40" fill="#fbbf24" opacity="0.48" className="heat-blob" />
                  
                  {/* West Virginia */}
                  <ellipse cx="655" cy="295" rx="40" ry="50" fill="#fbbf24" opacity="0.50" className="heat-blob" />
                  
                  {/* Maryland/Delaware */}
                  <ellipse cx="735" cy="285" rx="35" ry="35" fill="#fbbf24" opacity="0.50" className="heat-blob" />
                  
                  {/* Vermont/New Hampshire */}
                  <ellipse cx="770" cy="170" rx="30" ry="50" fill="#fbbf24" opacity="0.50" className="heat-blob" />
                  
                  {/* Maine */}
                  <ellipse cx="800" cy="145" rx="35" ry="70" fill="#fbbf24" opacity="0.48" className="heat-blob" />
                  
                  {/* Alaska */}
                  <ellipse cx="120" cy="535" rx="80" ry="50" fill="#fbbf24" opacity="0.55" className="heat-blob" />
                  
                  {/* Hawaii */}
                  <ellipse cx="300" cy="555" rx="50" ry="20" fill="#fbbf24" opacity="0.48" className="heat-blob" />
                  
                  {/* Tooltips */}
                  <g className="map-tooltip" transform="translate(720, 115)">
                    <rect x="-90" y="-20" width="180" height="40" rx="20" fill="#2d3748" />
                    <text x="0" y="8" textAnchor="middle" fill="white" fontSize="14" fontWeight="500">
                      🥚 Eggs +15% in NY
                    </text>
                  </g>
                  
                  <g className="map-tooltip" transform="translate(340, 260)">
                    <rect x="-90" y="-20" width="180" height="40" rx="20" fill="#2d3748" />
                    <text x="0" y="8" textAnchor="middle" fill="white" fontSize="14" fontWeight="500">
                      🚗 Fuel +8% in Texas
                    </text>
                  </g>
                  
                  <g className="map-tooltip" transform="translate(480, 480)">
                    <rect x="-150" y="-32" width="300" height="64" rx="20" fill="#2d3748" />
                    <text x="0" y="-5" textAnchor="middle" fill="white" fontSize="14" fontWeight="500">
                      🏫 Schools -$2,847/student →
                    </text>
                    <text x="0" y="15" textAnchor="middle" fill="white" fontSize="14" fontWeight="500">
                      Funding DOWN ⚠️
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="map-sidebar">
              {/* Top Shocks Near You */}
              <div className="shocks-panel">
                <h3 className="shocks-title">TOP SHOCKS NEAR YOU</h3>
                <div className="shocks-list">
                  {topShocksNearYou.map((shock, index) => (
                    <div key={index} className="shock-item">
                      <div className="shock-icon" style={{ backgroundColor: shock.bgColor }}>
                        {shock.icon}
                      </div>
                      <div className="shock-info">
                        <div className="shock-item-name">{shock.item}</div>
                        <div className="shock-location">{shock.location}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* State Select Input */}
              <div className="zipcode-explore">
                <div className="custom-dropdown" style={{ position: 'relative', flex: 1 }}>
                  <button
                    className="map-state-dropdown-button"
                    onClick={() => {
                      setIsMapStateDropdownOpen(!isMapStateDropdownOpen);
                      setMapStateSearch('');
                    }}
                  >
                    <span>{userSelectedState}</span>
                    <svg
                      className={`dropdown-arrow ${isMapStateDropdownOpen ? 'open' : ''}`}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {isMapStateDropdownOpen && (
                    <>
                      <div
                        className="dropdown-overlay"
                        onClick={() => {
                          setIsMapStateDropdownOpen(false);
                          setMapStateSearch('');
                        }}
                      ></div>
                      <div className="custom-dropdown-menu">
                        <div className="dropdown-search-container">
                          <input
                            type="text"
                            className="dropdown-search-input"
                            placeholder="Search states..."
                            value={mapStateSearch}
                            onChange={(e) => setMapStateSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                        <div className="dropdown-items-container">
                          {getFilteredStates(mapStateSearch).map((state, index) => (
                            <div
                              key={index}
                              className={`custom-dropdown-item ${userSelectedState === state ? 'selected' : ''}`}
                              onClick={() => {
                                handleStateChange(state);
                                setIsMapStateDropdownOpen(false);
                                setMapStateSearch('');
                              }}
                            >
                              {state}
                            </div>
                          ))}
                          {getFilteredStates(mapStateSearch).length === 0 && (
                            <div className="dropdown-no-results">No states found</div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <button className="explore-btn">
                  Explore ▶
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join the Conversation Section */}
      <section className="conversation-section">
        <div className="conversation-container">
          <h2 className="conversation-title">Join the Conversation</h2>
          <p className="conversation-subtitle">Join the voices behind the numbers and make yours count.</p>

          <div className="social-posts-grid">
            {socialPosts.map((post, index) => (
              <div key={index} className="social-post-card">
                <div className="post-header">
                  <div className="post-user-info">
                    <div className="post-avatar">
                      <img 
                        src={`https://i.pravatar.cc/150?img=${index + 10}`} 
                        alt={post.username}
                      />
                    </div>
                    <div className="post-meta">
                      <div className="post-username">
                        {post.username}
                        {post.verified && (
                          <svg className="verified-badge" width="16" height="16" viewBox="0 0 24 24" fill="#1d9bf0">
                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
                          </svg>
                        )}
                      </div>
                      <div className="post-platform">
                        <span className="platform-icon">𝕏</span>
                        {post.platform} · {post.timeAgo}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="post-text">{post.text}</p>

                <div className="post-image-container">
                  <img src={post.image} alt="Post" className="post-image" />
                </div>

                <div className="post-footer">
                  <div className="post-stats">
                    <div className="stat-item">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                      <span>{post.comments}</span>
                    </div>
                    <div className="stat-item">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="17 1 21 5 17 9" />
                        <path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4" />
                        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                      </svg>
                      <span>{post.retweets}</span>
                    </div>
                    <div className="stat-item">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      <span>{post.likes}</span>
                    </div>
                  </div>
                  <button className="share-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="live-chatter-btn">See the Live Chatter</button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-card">
            <div className="cta-background-decoration">
              <svg className="chain-decoration left" viewBox="0 0 200 200" fill="none">
                <path d="M50 100 Q75 50, 100 100 T 150 100" stroke="rgba(255,255,255,0.1)" strokeWidth="30" strokeLinecap="round"/>
                <circle cx="50" cy="100" r="35" stroke="rgba(255,255,255,0.15)" strokeWidth="25" fill="none"/>
                <circle cx="150" cy="100" r="35" stroke="rgba(255,255,255,0.15)" strokeWidth="25" fill="none"/>
              </svg>
              <svg className="chain-decoration right" viewBox="0 0 200 200" fill="none">
                <path d="M50 100 Q75 50, 100 100 T 150 100" stroke="rgba(255,255,255,0.1)" strokeWidth="30" strokeLinecap="round"/>
                <circle cx="50" cy="100" r="35" stroke="rgba(255,255,255,0.15)" strokeWidth="25" fill="none"/>
                <circle cx="150" cy="100" r="35" stroke="rgba(255,255,255,0.15)" strokeWidth="25" fill="none"/>
              </svg>
            </div>
            
            <div className="cta-content">
              <h2 className="cta-title">Ready to See How Policy Impacts<br />Your Wallet?</h2>
              <p className="cta-description">
                Chat instantly with our AI or explore your local impact map to uncover the<br />
                hidden costs behind rising bills.
              </p>
              <div className="cta-buttons">
                <button className="cta-btn primary" onClick={() => navigate('/chatbot')}>Ask AI Now</button>
                <button className="cta-btn secondary">Explore Local Impact</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Price Impact Modal */}
      {showImpactModal && (
        <div className="impact-modal-overlay" onClick={() => setShowImpactModal(false)}>
          <div className="impact-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowImpactModal(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <h2 className="impact-modal-title">Price Impact: {productQuery || 'Housing'}</h2>

            {/* Price Cards */}
            <div className="impact-price-cards">
              <div className="impact-price-card">
                <div className="impact-price-value">$ 2.15</div>
                <div className="impact-price-date">January 20, 2024</div>
                <div className="impact-price-label">Starting Price</div>
              </div>
              <div className="impact-price-card">
                <div className="impact-price-value">$ 3.89</div>
                <div className="impact-price-date">September 20, 2024</div>
                <div className="impact-price-label">Current Price</div>
              </div>
              <div className="impact-price-card">
                <div className="impact-price-value">+ 80.9%</div>
                <div className="impact-price-date">+ $ 1.74</div>
                <div className="impact-price-label">Total Increase</div>
              </div>
            </div>

            {/* What Pushed The Price Up */}
            <h3 className="impact-section-title">What Pushed The Price Up?</h3>

            <div className="impact-tariff-card">
              <div className="impact-tariff-header">
                <h4 className="impact-tariff-title">Tariffs on Building materials</h4>
                <div className="impact-tariff-badges">
                  <span className="impact-badge">Steel: 25%</span>
                  <span className="impact-badge">Aluminum: 10%</span>
                  <span className="impact-badge">Lumber duties: -14.5%</span>
                </div>
              </div>
              <p className="impact-tariff-text">
                Import duties on steel, aluminum, lumber, gypsum, windows, roofing raise input costs. NAHB notes sizeable share of building materials are imported.
              </p>
              <p className="impact-tariff-source">
                <span className="source-label">Sources:</span> <span className="source-link">National Association of Home Builders</span>
              </p>
            </div>

            {/* Lobbying Section */}
            <div className="impact-lobbying-card">
              <h3 className="impact-lobbying-amount">$2.3 BILLION Spent in DC</h3>
              <p className="impact-lobbying-text">
                While your housing costs jumped <span className="highlight-orange">+80.9%</span>, real estate fat cats poured
                <span className="highlight-orange"> $2.3B</span> into lobbying for the very policies that drove your costs up.
              </p>
              <button className="ask-ai-modal-btn" onClick={() => navigate('/chatbot')}>Ask AI</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

