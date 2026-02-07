import { useNavigate } from 'react-router-dom';
import { useHomepage, FEATURED_STATES } from '../../../context/HomepageContext';
import StateDropdown from '../../../components/common/StateDropdown';

export function WalletShocksSection() {
  const navigate = useNavigate();
  const { state, actions, getEffectiveState } = useHomepage();
  const { walletShocks, selectedState, dropdownStates, searchStates, isRefreshing } = state;

  // Get the currently selected featured state for highlighting
  const selectedFeaturedState = selectedState?.toUpperCase() || 'CALIFORNIA';

  return (
    <section className="wallet-shocks-section">
      <div className="wallet-shocks-container">
        <h2 className="wallet-shocks-title">Top Wallet Shocks This Week</h2>

        {/* State Filter Tabs */}
        <div className="state-filters">
          {FEATURED_STATES.map((state) => (
            <button
              key={state}
              onClick={() => {
                const properCase = state.split(' ').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
                actions.setSelectedState(properCase);
              }}
              className={`state-tab ${selectedFeaturedState === state ? 'active' : ''}`}
            >
              {state}
            </button>
          ))}
        </div>

        {/* Custom Dropdown */}
        <div className="state-controls">
          <StateDropdown
            value={selectedState}
            onChange={actions.setSelectedState}
            isOpen={dropdownStates.walletShocks}
            onToggle={() => actions.toggleDropdown('walletShocks')}
            onClose={actions.closeAllDropdowns}
            searchValue={searchStates.walletShocks}
            onSearchChange={(v) => actions.setDropdownSearch('walletShocks', v)}
            variant="coral"
            label="Select Your Location"
            sublabel="Current Location"
          />
        </div>

        {/* Wallet Shock Cards */}
        <div className="wallet-cards" style={{ opacity: isRefreshing ? 0.6 : 1, transition: 'opacity 0.3s' }}>
          {walletShocks.map((shock, index) => (
            <div key={shock._id || index} className="wallet-card">
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
                  onClick={() => navigate(`/insights?category=${shock.category.toLowerCase()}&state=${getEffectiveState()}`)}
                  className="see-details"
                >
                  See details {String.fromCharCode(8594)}
                </button>
                <div className="reactions">
                  <span
                    onClick={() => actions.addReaction(shock._id, 'shock')}
                    style={{ cursor: 'pointer' }}
                  >
                    😱 {shock.reactions?.shock || 0}
                  </span>
                  <span
                    onClick={() => actions.addReaction(shock._id, 'angry')}
                    style={{ cursor: 'pointer' }}
                  >
                    😠 {shock.reactions?.angry || 0}
                  </span>
                  <span
                    onClick={() => actions.addReaction(shock._id, 'sad')}
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
          Red {String.fromCharCode(8599)} indicates price increases; blue lines indicate neutral to declining trends. Values are illustrative for layout only.
        </p>
      </div>
    </section>
  );
}

export default WalletShocksSection;
