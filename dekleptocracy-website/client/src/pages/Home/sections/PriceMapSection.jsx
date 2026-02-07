import { useHomepage } from '../../../context/HomepageContext';
import StateDropdown from '../../../components/common/StateDropdown';
import InteractiveMap from '../../../components/charts/InteractiveMap';
import { useState } from 'react';

export function PriceMapSection() {
  const { state, actions } = useHomepage();
  const { mapRegions, nearbyShocks, selectedState, dropdownStates, searchStates } = state;
  const [mapState, setMapState] = useState(null);

  // Fallback data for nearby shocks
  const shocksNearYou = nearbyShocks.length > 0 ? nearbyShocks : [
    { item: 'Milk +10%', location: 'Chicago, IL', icon: '🥛', bgColor: '#fef3c7' },
    { item: 'iPhone tax $45', location: 'San Jose, CA', icon: '📱', bgColor: '#dbeafe' },
    { item: 'Coffee +12%', location: 'Seattle, WA', icon: '☕', bgColor: '#fed7d7' },
    { item: 'School funding -8.7%', location: 'Seattle, WA', icon: '📚', bgColor: '#d1f4dd' },
    { item: 'Energy costs +68%', location: 'Seattle, WA', icon: '💡', bgColor: '#fed7d7' }
  ];

  return (
    <section className="price-map-section">
      <div className="price-map-container">
        <h2 className="price-map-title">See where Prices are Surging</h2>

        <div className="map-content">
          {/* Map Area */}
          <div className="map-area">
            <InteractiveMap
              data={mapRegions}
              selectedState={mapState}
              onStateSelect={(stateName) => {
                setMapState(stateName);
                actions.setSelectedState(stateName);
              }}
              onDrillDown={(stateName) => {
                console.log('Drill down to state:', stateName);
              }}
            />
          </div>

          {/* Right Sidebar */}
          <div className="map-sidebar">
            {/* Top Shocks Near You */}
            <div className="shocks-panel">
              <h3 className="shocks-title">TOP SHOCKS NEAR YOU</h3>
              <div className="shocks-list">
                {shocksNearYou.map((shock, index) => (
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
              <StateDropdown
                value={selectedState}
                onChange={actions.setSelectedState}
                isOpen={dropdownStates.map}
                onToggle={() => actions.toggleDropdown('map')}
                onClose={actions.closeAllDropdowns}
                searchValue={searchStates.map}
                onSearchChange={(v) => actions.setDropdownSearch('map', v)}
                variant="map"
              />
              <button className="explore-btn">
                Explore {String.fromCharCode(9654)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PriceMapSection;
