import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { scaleLinear } from 'd3-scale';
import { Tooltip } from 'react-tooltip';
import StateDetailPanel from './StateDetailPanel';
import './InteractiveMap.css';

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
  const [clickIndicator, setClickIndicator] = useState(null);
  const mapRef = useRef(null);

  const US_TOPO_JSON = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

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
    if (e.target.closest('.heat-blob')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - center.x, y: e.clientY - center.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setCenter({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (!e.target.closest('.heat-blob') && !e.target.closest('.map-controls')) {
      const closestState = findClosestState(e.clientX, e.clientY);
      setHoveredState(closestState);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredState(null);
  };

  const findClosestState = useCallback((clickX, clickY) => {
    const mapRect = mapRef.current?.getBoundingClientRect();
    if (!mapRect) return null;

    const svg = mapRef.current?.querySelector('.heat-overlay');
    if (!svg) return null;

    const svgRect = svg.getBoundingClientRect();
    const viewBoxWidth = 960;
    const viewBoxHeight = 600;

    const relativeX = clickX - svgRect.left;
    const relativeY = clickY - svgRect.top;

    const centerX = svgRect.width / 2;
    const centerY = svgRect.height / 2;

    const svgX = (relativeX - centerX) / zoom + centerX;
    const svgY = (relativeY - centerY) / zoom + centerY;

    const viewBoxX = (svgX / svgRect.width) * viewBoxWidth;
    const viewBoxY = (svgY / svgRect.height) * viewBoxHeight;

    let closestState = null;
    let minDistance = Infinity;

    Object.entries(stateColors).forEach(([stateName, coords]) => {
      const rx = coords.rx * (1 + 0.3 * (zoom - 1));
      const ry = coords.ry * (1 + 0.3 * (zoom - 1));

      const distance = Math.sqrt(
        Math.pow((viewBoxX - coords.cx) / rx, 2) +
        Math.pow((viewBoxY - coords.cy) / ry, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestState = stateName;
      }
    });

    return minDistance < 1.3 ? closestState : null;
  }, [stateColors, zoom]);

  const colorScale = useMemo(() => {
    const values = data?.map(d => d.intensity || 0) || [];
    const maxValue = Math.max(...values, 100);

    return scaleLinear()
      .domain([0, maxValue * 0.33, maxValue * 0.66, maxValue])
      .range(['#fef3c7', '#f97316', '#dc2626', '#b91c1c']);
  }, [data]);

  const getStateData = useCallback((stateName) => {
    return data?.find(d => d.name === stateName);
  }, [data]);

  const handleStateClick = (stateName) => {
    const stateData = getStateData(stateName);
    if (stateData) {
      onStateSelect?.(stateName);
      onDrillDown?.(stateName);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(8, prev * 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(1, prev / 1.5));
  const handleReset = () => {
    setZoom(1);
    setCenter({ x: 0, y: 0 });
    onStateSelect?.(null);
    setClickIndicator(null);
  };

  const stateColors = {
    'California': { cx: 85, cy: 285, rx: 75, ry: 90 },
    'Texas': { cx: 420, cy: 445, rx: 120, ry: 95 },
    'Arizona': { cx: 175, cy: 360, rx: 55, ry: 65 },
    'New Mexico': { cx: 245, cy: 375, rx: 50, ry: 70 },
    'Oklahoma': { cx: 340, cy: 375, rx: 55, ry: 50 },
    'Louisiana': { cx: 465, cy: 480, rx: 50, ry: 45 },
    'Washington': { cx: 75, cy: 135, rx: 55, ry: 45 },
    'Oregon': { cx: 75, cy: 190, rx: 60, ry: 50 },
    'Nevada': { cx: 135, cy: 260, rx: 50, ry: 70 },
    'Utah': { cx: 185, cy: 265, rx: 45, ry: 60 },
    'Colorado': { cx: 250, cy: 280, rx: 55, ry: 55 },
    'Kansas': { cx: 350, cy: 300, rx: 60, ry: 45 },
    'Illinois': { cx: 500, cy: 280, rx: 40, ry: 70 },
    'Indiana': { cx: 540, cy: 285, rx: 40, ry: 55 },
    'Ohio': { cx: 590, cy: 275, rx: 50, ry: 55 },
    'Wisconsin': { cx: 480, cy: 205, rx: 50, ry: 60 },
    'Michigan': { cx: 540, cy: 215, rx: 55, ry: 70 },
    'New York': { cx: 755, cy: 195, rx: 65, ry: 55 },
    'Pennsylvania': { cx: 705, cy: 255, rx: 60, ry: 45 },
    'Georgia': { cx: 630, cy: 380, rx: 50, ry: 60 },
    'Alabama': { cx: 570, cy: 395, rx: 45, ry: 60 },
    'Arkansas': { cx: 445, cy: 375, rx: 45, ry: 55 },
    'Missouri': { cx: 450, cy: 310, rx: 55, ry: 50 },
    'Iowa': { cx: 440, cy: 245, rx: 55, ry: 45 },
    'Tennessee': { cx: 570, cy: 350, rx: 70, ry: 40 },
    'Kentucky': { cx: 600, cy: 310, rx: 65, ry: 40 },
    'North Carolina': { cx: 700, cy: 345, rx: 70, ry: 45 },
    'South Carolina': { cx: 680, cy: 385, rx: 45, ry: 45 },
    'Virginia': { cx: 710, cy: 305, rx: 65, ry: 45 },
    'Florida': { cx: 700, cy: 485, rx: 60, ry: 100 },
    'Mississippi': { cx: 510, cy: 420, rx: 40, ry: 65 },
    'Wyoming': { cx: 240, cy: 220, rx: 50, ry: 55 },
    'Montana': { cx: 200, cy: 155, rx: 80, ry: 50 },
    'Idaho': { cx: 155, cy: 195, rx: 45, ry: 75 },
    'Minnesota': { cx: 450, cy: 165, rx: 55, ry: 65 },
    'North Dakota': { cx: 370, cy: 140, rx: 55, ry: 45 },
    'South Dakota': { cx: 360, cy: 205, rx: 60, ry: 45 },
    'Nebraska': { cx: 340, cy: 255, rx: 65, ry: 40 },
    'West Virginia': { cx: 655, cy: 295, rx: 40, ry: 50 },
    'Maryland': { cx: 735, cy: 285, rx: 35, ry: 35 },
    'Vermont': { cx: 770, cy: 170, rx: 30, ry: 50 },
    'New Hampshire': { cx: 770, cy: 170, rx: 30, ry: 50 },
    'Maine': { cx: 800, cy: 145, rx: 35, ry: 70 },
    'Alaska': { cx: 120, cy: 535, rx: 80, ry: 50 },
    'Hawaii': { cx: 300, cy: 555, rx: 50, ry: 20 },
    'Connecticut': { cx: 765, cy: 220, rx: 30, ry: 30 },
    'Delaware': { cx: 735, cy: 285, rx: 35, ry: 35 },
    'Massachusetts': { cx: 770, cy: 170, rx: 30, ry: 50 },
    'New Jersey': { cx: 740, cy: 240, rx: 40, ry: 40 },
    'Rhode Island': { cx: 770, cy: 170, rx: 30, ry: 50 }
  };

  const style = {
    transform: `scale(${zoom}) translate(${center.x}px, ${center.y}px)`,
    transformOrigin: 'center',
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  return (
    <div className="interactive-map-container">
      <div className="map-controls">
        <button onClick={handleZoomIn} aria-label="Zoom in">+</button>
        <button onClick={handleZoomOut} aria-label="Zoom out">−</button>
        <button onClick={handleReset} aria-label="Reset view">↺</button>
      </div>

      <div
        className="map-wrapper"
        ref={mapRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          if (!e.target.closest('.heat-blob') && !e.target.closest('.map-controls')) {
            const clickX = e.clientX;
            const clickY = e.clientY;
            const closestState = findClosestState(clickX, clickY);
            
            const mapRect = mapRef.current?.getBoundingClientRect();
            if (mapRect) {
              const svg = mapRef.current?.querySelector('.heat-overlay');
              if (svg) {
                const svgRect = svg.getBoundingClientRect();
                setClickIndicator({
                  x: ((clickX - svgRect.left) / svgRect.width) * 960,
                  y: ((clickY - svgRect.top) / svgRect.height) * 600
                });
                
                setTimeout(() => setClickIndicator(null), 1500);
              }
            }
            
            if (closestState) {
              handleStateClick(closestState);
            }
          }
        }}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Blank_US_Map_%28states_only%29.svg/1280px-Blank_US_Map_%28states_only%29.svg.png"
          alt="US Map"
          className="us-map-base"
          loading="lazy"
          decoding="async"
          width="1280"
          height="800"
          style={style}
        />

        <svg viewBox="0 0 960 600" className="heat-overlay" preserveAspectRatio="xMidYMid meet" style={style}>
           {Object.entries(stateColors).map(([stateName, coords]) => {
             const stateData = getStateData(stateName);
             const intensity = stateData?.intensity || Math.random() * 100;
             const isSelected = selectedState === stateName;
             const isHovered = hoveredState === stateName;
             const isClosest = hoveredState === stateName && !isHovered;

            return (
              <ellipse
                key={stateName}
                cx={coords.cx}
                cy={coords.cy}
                rx={coords.rx}
                ry={coords.ry}
                fill={colorScale(intensity)}
                opacity="0.85"
                className={`heat-blob ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                data-tooltip-id="map-tooltip"
                data-tooltip-content={stateName}
                onClick={() => handleStateClick(stateName)}
                onMouseEnter={() => setHoveredState(stateName)}
                onMouseLeave={() => setHoveredState(null)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  stroke: isSelected ? '#2d3748' : (isHovered ? '#4A5D3F' : '#fff'),
                  strokeWidth: isSelected ? 3 : (isHovered ? 2 : 0.5)
                }}
              />
             );
           })}
           
           {clickIndicator && (
             <circle
               cx={clickIndicator.x}
               cy={clickIndicator.y}
               r="8"
               fill="none"
               stroke="#4A5D3F"
               strokeWidth="3"
               opacity="0.9"
               style={{
                 animation: 'ping 0.6s cubic-bezier(0, 0, 0.2, 1) infinite'
               }}
             />
           )}
        </svg>
      </div>

      <Tooltip
        id="map-tooltip"
        render={({ content }) => {
          const stateData = getStateData(content);
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

      {selectedState && (
        <StateDetailPanel
          stateCode={selectedState}
          stateData={getStateData(selectedState)}
          onClose={() => onStateSelect?.(null)}
          onDrillDown={onDrillDown}
        />
      )}
    </div>
  );
};

export default InteractiveMap;
