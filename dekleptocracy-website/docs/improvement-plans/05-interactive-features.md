# Phase 5: Interactive Features

## Overview

This phase focuses on making the landing page more interactive and engaging through an enhanced map experience, functional timeline slider, product search with autocomplete, and real-time data updates.

## Goals

1. Create fully interactive US heat map with state drill-down
2. Implement functional timeline slider that filters data
3. Build product search with autocomplete and live results
4. Add real-time updates via WebSockets
5. Implement multi-state comparison tool
6. Add social integration features

---

## Current State Analysis

### Interactive Elements Status

| Feature | Current State | Target State |
|---------|---------------|--------------|
| US Map | Static SVG overlay | Clickable, zoomable, drill-down |
| Timeline Slider | Visual only | Filters all data by date |
| Product Search | Shows hardcoded modal | Autocomplete + live results |
| State Comparison | Button does nothing | Multi-state comparison tool |
| Social Posts | Static display | Live feed + user submissions |
| Reactions | Works | Add undo, prevent duplicates |

---

## Implementation Strategies

### 1. Interactive US Heat Map

#### Map Component Architecture

```jsx
// src/components/charts/InteractiveMap/index.jsx
import { useState, useCallback, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Tooltip } from 'react-tooltip';
import './InteractiveMap.css';

const US_TOPO_JSON = '/data/us-states.json';

const InteractiveMap = ({
  data,
  selectedState,
  onStateSelect,
  metric = 'priceImpact',
  onDrillDown
}) => {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState([-96, 38]);
  const [hoveredState, setHoveredState] = useState(null);

  // Color scale based on metric
  const colorScale = useMemo(() => {
    const values = data.map(d => d.metrics[metric]?.intensity || 0);
    const maxValue = Math.max(...values);

    return scaleLinear()
      .domain([0, maxValue * 0.5, maxValue])
      .range(['#fef3c7', '#f97316', '#b91c1c']);
  }, [data, metric]);

  // Get state data
  const getStateData = useCallback((stateCode) => {
    return data.find(d => d.stateCode === stateCode);
  }, [data]);

  // Handle state click
  const handleStateClick = (geo) => {
    const stateCode = geo.properties.postal;
    const stateData = getStateData(stateCode);

    if (stateData) {
      onStateSelect(stateCode);

      // Zoom to state
      const centroid = geo.properties.centroid || [-96, 38];
      setCenter(centroid);
      setZoom(4);
    }
  };

  // Handle zoom controls
  const handleZoomIn = () => setZoom(Math.min(zoom * 1.5, 8));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.5, 1));
  const handleReset = () => {
    setZoom(1);
    setCenter([-96, 38]);
    onStateSelect(null);
  };

  return (
    <div className="interactive-map-container">
      {/* Zoom Controls */}
      <div className="map-controls">
        <button onClick={handleZoomIn} aria-label="Zoom in">+</button>
        <button onClick={handleZoomOut} aria-label="Zoom out">−</button>
        <button onClick={handleReset} aria-label="Reset view">↺</button>
      </div>

      {/* Map */}
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1000 }}
        className="us-map"
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={({ coordinates, zoom }) => {
            setCenter(coordinates);
            setZoom(zoom);
          }}
        >
          <Geographies geography={US_TOPO_JSON}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateCode = geo.properties.postal;
                const stateData = getStateData(stateCode);
                const intensity = stateData?.metrics[metric]?.intensity || 0;
                const isSelected = selectedState === stateCode;
                const isHovered = hoveredState === stateCode;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    data-tooltip-id="map-tooltip"
                    data-tooltip-content={stateCode}
                    onClick={() => handleStateClick(geo)}
                    onMouseEnter={() => setHoveredState(stateCode)}
                    onMouseLeave={() => setHoveredState(null)}
                    style={{
                      default: {
                        fill: colorScale(intensity),
                        stroke: '#fff',
                        strokeWidth: isSelected ? 2 : 0.5,
                        outline: 'none',
                        cursor: 'pointer'
                      },
                      hover: {
                        fill: colorScale(intensity),
                        stroke: '#4A5D3F',
                        strokeWidth: 2,
                        outline: 'none'
                      },
                      pressed: {
                        fill: colorScale(intensity),
                        stroke: '#2d3a28',
                        strokeWidth: 2,
                        outline: 'none'
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      <Tooltip
        id="map-tooltip"
        render={({ content }) => {
          const stateData = getStateData(content);
          if (!stateData) return null;

          return (
            <div className="map-state-tooltip">
              <h4>{stateData.stateName}</h4>
              {stateData.metrics[metric]?.tooltips?.map((tip, i) => (
                <div key={i} className="tooltip-item">
                  <span className="tooltip-icon">{tip.icon}</span>
                  <span>{tip.text}</span>
                </div>
              ))}
              <p className="tooltip-cta">Click to explore</p>
            </div>
          );
        }}
      />

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-title">Price Impact</div>
        <div className="legend-scale">
          <div className="legend-bar" />
          <div className="legend-labels">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Selected State Panel */}
      {selectedState && (
        <StateDetailPanel
          stateCode={selectedState}
          stateData={getStateData(selectedState)}
          onClose={handleReset}
          onDrillDown={onDrillDown}
        />
      )}
    </div>
  );
};

// State Detail Panel
const StateDetailPanel = ({ stateCode, stateData, onClose, onDrillDown }) => (
  <div className="state-detail-panel">
    <button className="close-btn" onClick={onClose}>×</button>
    <h3>{stateData.stateName}</h3>

    <div className="state-stats">
      {stateData.metrics.priceImpact?.tooltips?.map((tip, i) => (
        <div key={i} className="stat-item">
          <span className="stat-icon">{tip.icon}</span>
          <div className="stat-info">
            <span className="stat-value">{tip.text}</span>
            <span className={`stat-trend ${tip.trend}`}>
              {tip.trend === 'up' ? '↑' : '↓'}
            </span>
          </div>
        </div>
      ))}
    </div>

    <div className="panel-actions">
      <button onClick={() => onDrillDown(stateCode, 'cities')}>
        View Cities
      </button>
      <button onClick={() => onDrillDown(stateCode, 'timeline')}>
        View History
      </button>
    </div>
  </div>
);

export default InteractiveMap;
```

### 2. Functional Timeline Slider

```jsx
// src/components/inputs/TimelineSlider/index.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import './TimelineSlider.css';

const TimelineSlider = ({
  config,
  value,
  onChange,
  onMilestoneClick
}) => {
  const {
    minDate,
    maxDate,
    milestones = [],
    defaultDate
  } = config;

  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(null);

  // Convert date to slider position (0-100)
  const dateToPosition = useCallback((date) => {
    const min = parseISO(minDate);
    const max = parseISO(maxDate);
    const current = parseISO(date);

    const totalDays = differenceInDays(max, min);
    const currentDays = differenceInDays(current, min);

    return (currentDays / totalDays) * 100;
  }, [minDate, maxDate]);

  // Convert slider position to date
  const positionToDate = useCallback((position) => {
    const min = parseISO(minDate);
    const max = parseISO(maxDate);

    const totalDays = differenceInDays(max, min);
    const days = Math.round((position / 100) * totalDays);

    return format(addDays(min, days), 'yyyy-MM-dd');
  }, [minDate, maxDate]);

  // Current position
  const position = useMemo(() => {
    return value ? dateToPosition(value) : dateToPosition(defaultDate);
  }, [value, defaultDate, dateToPosition]);

  // Handle slider change
  const handleChange = (e) => {
    const newPosition = parseFloat(e.target.value);
    const newDate = positionToDate(newPosition);
    onChange(newDate);
  };

  // Handle mouse move for preview
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setHoverPosition(Math.max(0, Math.min(100, percentage)));
  };

  // Find nearest milestone
  const nearestMilestone = useMemo(() => {
    if (!hoverPosition) return null;

    return milestones.reduce((nearest, milestone) => {
      const distance = Math.abs(milestone.position - hoverPosition);
      if (!nearest || distance < nearest.distance) {
        return { ...milestone, distance };
      }
      return nearest;
    }, null);
  }, [hoverPosition, milestones]);

  return (
    <div className="timeline-slider-container">
      {/* Milestone Labels */}
      <div className="milestone-labels">
        {milestones.map((milestone, index) => (
          <button
            key={index}
            className={`milestone-label ${milestone.highlighted ? 'highlighted' : ''} ${
              position >= milestone.position ? 'passed' : ''
            }`}
            style={{ left: `${milestone.position}%` }}
            onClick={() => {
              onMilestoneClick?.(milestone);
              onChange(format(parseISO(milestone.date), 'yyyy-MM-dd'));
            }}
          >
            <div className="milestone-date">
              {format(parseISO(milestone.date), 'MMM d, yyyy')}
            </div>
            <div className="milestone-name">{milestone.label}</div>
          </button>
        ))}
      </div>

      {/* Slider Track */}
      <div
        className="slider-track-wrapper"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverPosition(null)}
      >
        {/* Progress bar */}
        <div
          className="slider-progress"
          style={{ width: `${position}%` }}
        />

        {/* Milestone markers */}
        {milestones.map((milestone, index) => (
          <div
            key={index}
            className={`milestone-marker ${milestone.highlighted ? 'highlighted' : ''}`}
            style={{ left: `${milestone.position}%` }}
          />
        ))}

        {/* Hover preview */}
        {hoverPosition !== null && (
          <div
            className="hover-preview"
            style={{ left: `${hoverPosition}%` }}
          >
            <span className="preview-date">
              {format(parseISO(positionToDate(hoverPosition)), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        {/* Actual slider input */}
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={position}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          className={`timeline-slider ${isDragging ? 'dragging' : ''}`}
          aria-label="Select timeline date"
          aria-valuetext={value ? format(parseISO(value), 'MMMM d, yyyy') : ''}
        />
      </div>

      {/* Current date display */}
      <div className="current-date-display">
        <span className="label">Viewing data from:</span>
        <span className="date">
          {value ? format(parseISO(value), 'MMMM d, yyyy') : 'Select a date'}
        </span>
      </div>
    </div>
  );
};

export default TimelineSlider;
```

### 3. Product Search with Autocomplete

```jsx
// src/components/inputs/ProductSearch/index.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { homepageApi } from '../../../api/homepage';
import './ProductSearch.css';

const ProductSearch = ({
  onSearch,
  onSelect,
  placeholder = 'Search for a product...',
  trendingProducts = []
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await homepageApi.searchProducts(debouncedQuery);
        setSuggestions(response.products || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const items = query.length >= 2 ? suggestions : trendingProducts;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < items.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          handleSelect(items[selectedIndex]);
        } else if (query.trim()) {
          onSearch(query.trim());
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;

      default:
        break;
    }
  };

  // Handle selection
  const handleSelect = (product) => {
    setQuery(product.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(product);
  };

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target) &&
        listRef.current &&
        !listRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayItems = query.length >= 2 ? suggestions : trendingProducts;
  const showTrending = query.length < 2 && trendingProducts.length > 0;

  return (
    <div className="product-search-container">
      <div className="search-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="product-search-input"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-controls="product-suggestions"
          aria-expanded={isOpen}
        />

        {isLoading && <span className="search-spinner" />}

        <button
          className="search-submit-btn"
          onClick={() => query.trim() && onSearch(query.trim())}
          disabled={!query.trim()}
        >
          Show Impact
        </button>
      </div>

      {/* Suggestions dropdown */}
      {isOpen && displayItems.length > 0 && (
        <ul
          ref={listRef}
          id="product-suggestions"
          className="suggestions-list"
          role="listbox"
        >
          {showTrending && (
            <li className="suggestions-header">
              <span className="trending-icon">🔥</span> Trending searches
            </li>
          )}

          {displayItems.map((product, index) => (
            <li
              key={product.name}
              role="option"
              aria-selected={index === selectedIndex}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(product)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="product-name">{product.name}</span>
              {product.trending && (
                <span className="trending-badge">Trending</span>
              )}
              {product.changePercent && (
                <span className={`change ${product.changePercent > 0 ? 'up' : 'down'}`}>
                  {product.changePercent > 0 ? '+' : ''}{product.changePercent}%
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Quick suggestions */}
      {!isOpen && (
        <div className="quick-suggestions">
          <span className="suggestions-label">Try these:</span>
          {trendingProducts.slice(0, 3).map((product) => (
            <button
              key={product.name}
              className="quick-suggestion-btn"
              onClick={() => handleSelect(product)}
            >
              {product.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
```

### 4. Real-Time Updates with WebSockets

```jsx
// src/hooks/useRealtimeUpdates.js
import { useEffect, useRef, useCallback } from 'react';

export const useRealtimeUpdates = (options = {}) => {
  const {
    url = process.env.REACT_APP_WS_URL,
    onUpdate,
    onError,
    reconnectDelay = 3000,
    maxReconnects = 5
  } = options;

  const wsRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      reconnectCountRef.current = 0;
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate?.(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket closed');

      // Attempt reconnection
      if (reconnectCountRef.current < maxReconnects) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectCountRef.current++;
          connect();
        }, reconnectDelay);
      }
    };
  }, [url, onUpdate, onError, reconnectDelay, maxReconnects]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, []);

  const subscribe = useCallback((channel) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        channel
      }));
    }
  }, []);

  const unsubscribe = useCallback((channel) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        channel
      }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { subscribe, unsubscribe, disconnect };
};

// Usage in component
const WalletShocksSection = () => {
  const { state, actions } = useHomepage();

  useRealtimeUpdates({
    onUpdate: (data) => {
      if (data.type === 'wallet-shock-update') {
        actions.updateWalletShock(data.payload);
      }
      if (data.type === 'new-reaction') {
        actions.updateReactions(data.payload);
      }
    }
  });

  // ... rest of component
};
```

### 5. Multi-State Comparison Tool

```jsx
// src/components/features/StateComparison/index.jsx
import { useState, useEffect } from 'react';
import { homepageApi } from '../../../api/homepage';
import './StateComparison.css';

const StateComparison = ({
  isOpen,
  onClose,
  initialState
}) => {
  const [selectedStates, setSelectedStates] = useState(
    initialState ? [initialState] : []
  );
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const MAX_STATES = 4;

  // Fetch comparison data
  useEffect(() => {
    if (selectedStates.length < 2) {
      setComparisonData(null);
      return;
    }

    const fetchComparison = async () => {
      setLoading(true);
      try {
        const response = await homepageApi.compareStates(selectedStates);
        setComparisonData(response);
      } catch (error) {
        console.error('Error fetching comparison:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [selectedStates]);

  // Add state
  const addState = (state) => {
    if (selectedStates.length < MAX_STATES && !selectedStates.includes(state)) {
      setSelectedStates([...selectedStates, state]);
    }
  };

  // Remove state
  const removeState = (state) => {
    setSelectedStates(selectedStates.filter(s => s !== state));
  };

  if (!isOpen) return null;

  return (
    <div className="comparison-modal-overlay" onClick={onClose}>
      <div className="comparison-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <h2>Compare States</h2>
        <p className="modal-subtitle">
          Select up to {MAX_STATES} states to compare costs and impacts
        </p>

        {/* State selector */}
        <div className="state-selector">
          <div className="selected-states">
            {selectedStates.map(state => (
              <div key={state} className="selected-state-chip">
                {state}
                <button onClick={() => removeState(state)}>×</button>
              </div>
            ))}

            {selectedStates.length < MAX_STATES && (
              <StateDropdown
                value=""
                onChange={addState}
                placeholder="Add state..."
                excludeStates={selectedStates}
              />
            )}
          </div>
        </div>

        {/* Category filter */}
        {comparisonData && (
          <div className="category-tabs">
            {['all', 'grocery', 'fuel', 'electricity', 'housing'].map(cat => (
              <button
                key={cat}
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Comparison results */}
        {loading ? (
          <div className="comparison-loading">
            <span className="spinner" />
            Loading comparison...
          </div>
        ) : comparisonData ? (
          <div className="comparison-results">
            {/* Summary cards */}
            <div className="comparison-summary">
              {selectedStates.map(state => {
                const stateData = comparisonData.states[state];
                return (
                  <div key={state} className="state-summary-card">
                    <h3>{state}</h3>
                    <div className="summary-value">
                      <span className="label">Avg. Impact</span>
                      <span className="value">{stateData.averageImpact}%</span>
                    </div>
                    <div className="summary-rank">
                      Rank: #{stateData.nationalRank} of 50
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comparison chart */}
            <div className="comparison-chart">
              <ComparisonBarChart
                data={comparisonData.categories}
                states={selectedStates}
                category={activeCategory}
              />
            </div>

            {/* Detailed breakdown */}
            <div className="comparison-details">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    {selectedStates.map(state => (
                      <th key={state}>{state}</th>
                    ))}
                    <th>National Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.categories
                    .filter(cat => activeCategory === 'all' || cat.id === activeCategory)
                    .map(category => (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        {selectedStates.map(state => {
                          const value = category.values[state];
                          const diff = category.diffs[state];
                          return (
                            <td key={state}>
                              <span className="value">{value}</span>
                              <span className={`diff ${diff > 0 ? 'up' : 'down'}`}>
                                {diff > 0 ? '+' : ''}{diff}%
                              </span>
                            </td>
                          );
                        })}
                        <td>{category.nationalAvg}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="comparison-empty">
            <p>Select at least 2 states to compare</p>
          </div>
        )}

        {/* Export options */}
        {comparisonData && (
          <div className="comparison-actions">
            <button onClick={() => exportComparison('pdf')}>
              Export PDF
            </button>
            <button onClick={() => exportComparison('csv')}>
              Export CSV
            </button>
            <button onClick={() => shareComparison()}>
              Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StateComparison;
```

### 6. Enhanced Social Integration

```jsx
// src/components/features/SocialFeed/index.jsx
import { useState, useEffect, useCallback } from 'react';
import { homepageApi } from '../../../api/homepage';
import SocialPostCard from '../../data-display/SocialPostCard';
import './SocialFeed.css';

const SocialFeed = ({
  initialPosts = [],
  showSubmitButton = true
}) => {
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('featured'); // 'featured' | 'recent' | 'trending'
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await homepageApi.getSocialPosts(6, filter === 'featured', page + 1);
      const newPosts = response.posts || [];

      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, filter, page]);

  // Filter change
  const handleFilterChange = async (newFilter) => {
    setFilter(newFilter);
    setPage(1);
    setHasMore(true);
    setLoading(true);

    try {
      const response = await homepageApi.getSocialPosts(6, newFilter === 'featured');
      setPosts(response.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit post
  const handleSubmitPost = async (postData) => {
    try {
      await homepageApi.submitSocialPost(postData);
      setShowSubmitModal(false);
      // Show success message
    } catch (error) {
      console.error('Error submitting post:', error);
    }
  };

  return (
    <div className="social-feed">
      {/* Header */}
      <div className="feed-header">
        <h2>Join the Conversation</h2>
        <p>Join the voices behind the numbers and make yours count.</p>

        <div className="feed-controls">
          <div className="filter-tabs">
            {['featured', 'recent', 'trending'].map(f => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => handleFilterChange(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {showSubmitButton && (
            <button
              className="submit-post-btn"
              onClick={() => setShowSubmitModal(true)}
            >
              Share Your Story
            </button>
          )}
        </div>
      </div>

      {/* Posts grid */}
      <div className="posts-grid">
        {posts.map(post => (
          <SocialPostCard
            key={post._id}
            post={post}
            onShare={() => sharePost(post)}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="load-more-container">
          <button
            className="load-more-btn"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'See the Live Chatter'}
          </button>
        </div>
      )}

      {/* Submit modal */}
      {showSubmitModal && (
        <SubmitPostModal
          onClose={() => setShowSubmitModal(false)}
          onSubmit={handleSubmitPost}
        />
      )}
    </div>
  );
};

// Submit Post Modal
const SubmitPostModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    platform: 'twitter',
    text: '',
    image: null,
    consent: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.text && formData.consent) {
      onSubmit(formData);
    }
  };

  return (
    <div className="submit-modal-overlay" onClick={onClose}>
      <div className="submit-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>

        <h3>Share Your Price Story</h3>
        <p>Tell us how rising prices have affected you</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Platform</label>
            <select
              value={formData.platform}
              onChange={e => setFormData({ ...formData, platform: e.target.value })}
            >
              <option value="twitter">X (Twitter)</option>
              <option value="threads">Threads</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Your Story</label>
            <textarea
              value={formData.text}
              onChange={e => setFormData({ ...formData, text: e.target.value })}
              placeholder="Share how price changes have impacted you..."
              maxLength={280}
              required
            />
            <span className="char-count">{formData.text.length}/280</span>
          </div>

          <div className="form-group">
            <label>Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setFormData({ ...formData, image: e.target.files[0] })}
            />
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="consent"
              checked={formData.consent}
              onChange={e => setFormData({ ...formData, consent: e.target.checked })}
              required
            />
            <label htmlFor="consent">
              I consent to having my story featured on Dekleptocracy
            </label>
          </div>

          <button type="submit" className="submit-btn">
            Submit for Review
          </button>
        </form>
      </div>
    </div>
  );
};

export default SocialFeed;
```

---

## Implementation Steps

### Step 1: Interactive Map (Day 1-2)

- [ ] Install react-simple-maps and dependencies
- [ ] Download US TopoJSON data
- [ ] Create InteractiveMap component
- [ ] Implement zoom and pan controls
- [ ] Add state selection and tooltips
- [ ] Create StateDetailPanel component
- [ ] Connect to map data API

### Step 2: Timeline Slider (Day 2-3)

- [ ] Create TimelineSlider component
- [ ] Implement date calculations
- [ ] Add milestone markers
- [ ] Create hover preview
- [ ] Connect to timeline config API
- [ ] Integrate with data filtering

### Step 3: Product Search (Day 3-4)

- [ ] Create ProductSearch component
- [ ] Implement debounced search
- [ ] Add autocomplete suggestions
- [ ] Create keyboard navigation
- [ ] Build trending products display
- [ ] Connect to search API

### Step 4: Real-Time Updates (Day 4-5)

- [ ] Set up WebSocket server
- [ ] Create useRealtimeUpdates hook
- [ ] Implement reconnection logic
- [ ] Add subscription management
- [ ] Integrate with homepage context
- [ ] Add visual update indicators

### Step 5: State Comparison (Day 5-6)

- [ ] Create StateComparison modal
- [ ] Build multi-state selector
- [ ] Implement comparison chart
- [ ] Create detailed breakdown table
- [ ] Add export functionality
- [ ] Connect to comparison API

### Step 6: Social Integration (Day 6-7)

- [ ] Enhance SocialFeed component
- [ ] Add infinite scroll
- [ ] Create filter tabs
- [ ] Build SubmitPostModal
- [ ] Implement moderation flow
- [ ] Add share functionality

---

## API Endpoints Required

| Endpoint | Purpose |
|----------|---------|
| `GET /api/homepage/map-data` | Heat map data with intensities |
| `GET /api/homepage/timeline-config` | Timeline milestones and dates |
| `GET /api/search/products` | Product search autocomplete |
| `GET /api/compare/states` | Multi-state comparison data |
| `POST /api/social/submit` | User story submission |
| `WS /realtime` | WebSocket for live updates |

---

## Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Map | Interaction rate | 30%+ of visitors |
| Timeline | Usage rate | 20%+ of visitors |
| Search | Completion rate | 40%+ of searches |
| Comparison | Usage rate | 15%+ of visitors |
| Social | Submission rate | 5%+ of visitors |

---

## Next Steps

After completing Phase 5:
1. Proceed to Phase 6 (Content & Data Quality)
2. Interactive features enable:
   - Deeper user engagement
   - More valuable insights
   - User-generated content
