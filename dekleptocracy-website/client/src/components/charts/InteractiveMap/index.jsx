import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { scaleLinear } from 'd3-scale';
import { Tooltip } from 'react-tooltip';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { feature } from 'topojson-client';
import './InteractiveMap.css';

const US_TOPO_JSON = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

const InteractiveMap = ({
  data,
  selectedState,
  onStateSelect,
  metric = 'priceImpact',
  onDrillDown
}) => {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [hoveredState, setHoveredState] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isLoading, setIsLoading] = useState(true);
  const [geoData, setGeoData] = useState(null);
  const mapRef = useRef(null);
  const wrapperRef = useRef(null);

  // Fetch and parse the TopoJSON data
  useEffect(() => {
    fetch(US_TOPO_JSON)
      .then(response => response.json())
      .then(topology => {
        const geojson = feature(topology, topology.objects.states);
        setGeoData(geojson);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load US map data:', err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(1, Math.min(8, prev * delta)));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = wrapperRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left - center.x,
      y: e.clientY - rect.top - center.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setCenter({
        x: e.clientX - rect.left - dragStart.x,
        y: e.clientY - rect.top - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredState(null);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(8, prev * 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(1, prev / 1.5));
  const handleReset = () => {
    setZoom(1);
    setCenter({ x: 0, y: 0 });
    onStateSelect?.(null);
  };

  const colorScale = useMemo(() => {
    const values = data?.map(d => d.intensity || 0) || [];
    const maxValue = Math.max(...values, 100);

    return scaleLinear()
      .domain([0, maxValue * 0.33, maxValue * 0.66, maxValue])
      .range(['#fef3c7', '#f97316', '#dc2626', '#b91c1c']);
  }, [data]);

  const getStateData = useCallback((stateId) => {
    if (!stateId || !data) return null;

    const stateMap = {
      '01': 'Alabama',
      '02': 'Alaska',
      '04': 'Arizona',
      '05': 'Arkansas',
      '06': 'California',
      '08': 'Colorado',
      '09': 'Connecticut',
      '10': 'Delaware',
      '11': 'Florida',
      '12': 'Georgia',
      '13': 'Hawaii',
      '15': 'Hawaii',
      '16': 'Idaho',
      '17': 'Illinois',
      '18': 'Indiana',
      '19': 'Iowa',
      '20': 'Kansas',
      '21': 'Kentucky',
      '22': 'Louisiana',
      '23': 'Maine',
      '24': 'Maryland',
      '25': 'Massachusetts',
      '26': 'Michigan',
      '27': 'Minnesota',
      '28': 'Mississippi',
      '29': 'Missouri',
      '30': 'Montana',
      '31': 'Nebraska',
      '32': 'Nevada',
      '33': 'New Hampshire',
      '34': 'New Jersey',
      '35': 'New Mexico',
      '36': 'New York',
      '37': 'North Carolina',
      '38': 'North Dakota',
      '39': 'Ohio',
      '40': 'Oklahoma',
      '41': 'Oregon',
      '42': 'Pennsylvania',
      '44': 'Rhode Island',
      '45': 'South Carolina',
      '46': 'South Dakota',
      '47': 'Tennessee',
      '48': 'Texas',
      '49': 'Utah',
      '50': 'Vermont',
      '51': 'Virginia',
      '53': 'Washington',
      '54': 'West Virginia',
      '55': 'Wisconsin',
      '56': 'Wyoming'
    };

    const stateName = stateMap[stateId];
    if (!stateName) return null;

    return data.find(d => d.name === stateName);
  }, [data]);

  const handleStateClick = (stateName, stateId) => {
    const stateData = data?.find(d => d.name === stateName);
    if (stateData) {
      onStateSelect?.(stateName);
      onDrillDown?.(stateName);
    }
  };

  const mapStyle = {
    width: '100%',
    height: '100%',
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  return (
    <div className="interactive-map-container">
      {isLoading && (
        <div className="map-loading">
          <div className="loading-spinner" />
          <span>Loading map...</span>
        </div>
      )}

      <div className="map-controls">
        <button onClick={handleZoomIn} aria-label="Zoom in">+</button>
        <button onClick={handleZoomOut} aria-label="Zoom out">−</button>
        <button onClick={handleReset} aria-label="Reset view">↺</button>
      </div>

      <div
        ref={wrapperRef}
        className="map-wrapper"
        style={{
          transform: `translate(${center.x}px, ${center.y}px) scale(${zoom})`,
          transformOrigin: 'center'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div ref={mapRef} style={mapStyle}>
          {geoData && (
            <ComposableMap
              projection="geoAlbersUsa"
              width={960}
              height={600}
              style={{ width: '100%', height: 'auto' }}
            >
              <Geographies geography={geoData}>
                {({ geographies }) => {
                  return (geographies || []).map((geo) => {
                    // Get state name from properties or look up by ID
                    const stateName = geo.properties?.name || getStateData(geo.id)?.name;
                    const stateData = data?.find(d => d.name === stateName);
                    const intensity = stateData?.intensity || 0;
                    const isSelected = selectedState === stateName;
                    const isHovered = hoveredState === stateName;

                    return (
                      <Geography
                        key={geo.rsmKey || geo.id}
                        geography={geo}
                        fill={colorScale(intensity)}
                        stroke={isSelected ? '#2d3748' : (isHovered ? '#4A5D3F' : '#ffffff')}
                        strokeWidth={isSelected ? 3 : (isHovered ? 2 : 1)}
                        className={`state-geo ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                        onMouseEnter={() => setHoveredState(stateName)}
                        onMouseLeave={() => setHoveredState(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStateClick(stateName, geo.id);
                        }}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          filter: isSelected ? 'brightness(1.1)' : 'none'
                        }}
                        data-tooltip-id="map-tooltip"
                        data-tooltip-content={stateName}
                      />
                    );
                  });
                }}
              </Geographies>
            </ComposableMap>
          )}
        </div>
      </div>

      <Tooltip
        id="map-tooltip"
        render={({ content }) => {
          const stateData = data?.find(d => d.name === content);
          if (!stateData) return null;

          return (
            <div className="map-state-tooltip">
              <h4>{content}</h4>
              {stateData.topShocks?.slice(0, 2).map((shock, i) => (
                <div key={i} className="tooltip-item">
                  <span className="tooltip-icon">{shock.icon}</span>
                  <span>{shock.item}</span>
                  <span className="tooltip-change">
                    {shock.change > 0 ? '+' : ''}{shock.change}%
                  </span>
                </div>
              ))}
              <p className="tooltip-cta">Click to explore</p>
            </div>
          );
        }}
      />

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

    </div>
  );
};

export default InteractiveMap;
