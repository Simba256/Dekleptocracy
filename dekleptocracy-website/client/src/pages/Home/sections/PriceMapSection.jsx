import { useHomepage } from '../../../context/HomepageContext';
import StateDropdown from '../../../components/common/StateDropdown';

export function PriceMapSection() {
  const { state, actions } = useHomepage();
  const { mapRegions, nearbyShocks, selectedState, dropdownStates, searchStates } = state;

  // Fallback data for nearby shocks
  const shocksNearYou = nearbyShocks.length > 0 ? nearbyShocks : [
    { item: 'Milk +10%', location: 'Chicago, IL', icon: 'milk emoji', bgColor: '#fef3c7' },
    { item: 'iPhone tax $45', location: 'San Jose, CA', icon: 'phone emoji', bgColor: '#dbeafe' },
    { item: 'Coffee +12%', location: 'Seattle, WA', icon: 'coffee emoji', bgColor: '#fed7d7' },
    { item: 'School funding -8.7%', location: 'Seattle, WA', icon: 'books emoji', bgColor: '#d1f4dd' },
    { item: 'Energy costs +68%', location: 'Seattle, WA', icon: 'lightbulb emoji', bgColor: '#fed7d7' }
  ];

  return (
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
                loading="lazy"
                decoding="async"
                width="1280"
                height="800"
              />

              {/* Colored overlay with heat map */}
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
                    egg emoji Eggs +15% in NY
                  </text>
                </g>

                <g className="map-tooltip" transform="translate(340, 260)">
                  <rect x="-90" y="-20" width="180" height="40" rx="20" fill="#2d3748" />
                  <text x="0" y="8" textAnchor="middle" fill="white" fontSize="14" fontWeight="500">
                    car emoji Fuel +8% in Texas
                  </text>
                </g>

                <g className="map-tooltip" transform="translate(480, 480)">
                  <rect x="-150" y="-32" width="300" height="64" rx="20" fill="#2d3748" />
                  <text x="0" y="-5" textAnchor="middle" fill="white" fontSize="14" fontWeight="500">
                    school emoji Schools -$2,847/student {String.fromCharCode(8594)}
                  </text>
                  <text x="0" y="15" textAnchor="middle" fill="white" fontSize="14" fontWeight="500">
                    Funding DOWN warning emoji
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
