import { useHomepage } from '../../../context/HomepageContext';
import StateDropdown from '../../../components/common/StateDropdown';

export function CostDriversSection() {
  const { state, actions } = useHomepage();
  const { costDrivers, stateComparisons, timePeriod, selectedState, dropdownStates, searchStates } = state;

  // Fallback comparison data if API data not available
  const comparisonData = stateComparisons.length > 0 ? stateComparisons : [
    { label: 'Grocery basket', percentDisplay: '+4%', stateValue: '$412', nationalValue: '$395' },
    { label: 'Fuel Price', percentDisplay: '+3.8%', stateValue: '$3.84', nationalValue: '$3.70' },
    { label: 'Electricity Bill', percentDisplay: '+69%', stateValue: '$282', nationalValue: '$187' },
    { label: 'Books & Printing', percentDisplay: '+12%', stateValue: '4.8%', nationalValue: '4.1%' }
  ];

  // Fallback cost drivers
  const drivers = costDrivers.length > 0 ? costDrivers : [
    { label: 'Tariffs', percentage: 34, color: '#3E5132', type: 'direct' },
    { label: 'Fuels', percentage: 22, color: '#6B7F5F', type: 'direct' },
    { label: 'Labor', percentage: 20, color: '#A8B89C', type: 'direct' },
    { label: 'Supply Chain', percentage: 18, color: '#A8B89C', type: 'indirect' },
    { label: 'Currency', percentage: 13, color: '#C5D4BC', type: 'indirect' },
    { label: 'Weather', percentage: 5, color: '#9CA3AF', type: 'indirect' }
  ];

  return (
    <section className="cost-impact-section">
      <div className="cost-impact-container">
        {/* Header */}
        <div className="cost-impact-header">
          <div className="cost-impact-text">
            <h2 className="cost-impact-title">Cost Drivers & Household Impact</h2>
            <p className="cost-impact-subtitle">
              Lean, authoritative data views. Explore what&apos;s driving prices and how it hits your bills.
            </p>
          </div>
          <div className="cost-impact-controls">
            <StateDropdown
              value={selectedState}
              onChange={actions.setSelectedState}
              isOpen={dropdownStates.costImpact}
              onToggle={() => actions.toggleDropdown('costImpact')}
              onClose={actions.closeAllDropdowns}
              searchValue={searchStates.costImpact}
              onSearchChange={(v) => actions.setDropdownSearch('costImpact', v)}
              variant="coral"
              label="Select Your Location:"
              sublabel="Current Location"
            />
            <div className="time-period-buttons">
              {['YoY', '3 months', '30 days'].map((period) => (
                <button
                  key={period}
                  onClick={() => actions.setTimePeriod(period)}
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
            <h3 className="panel-title">What&apos;s pushing prices up</h3>
            <p className="panel-subtitle">Share of contribution to overall increase (illustrative)</p>

            <div className="drivers-chart">
              {drivers.map((driver, index) => (
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
              {comparisonData.slice(0, 4).map((item, index) => (
                <div key={index} className="comparison-card">
                  <h4 className="comparison-category">{item.label}</h4>
                  <div className="comparison-percent">{item.percentDisplay} higher</div>
                  <p className="comparison-values">
                    (Your state: {item.stateValue} vs Nat&apos;l: {item.nationalValue})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="cost-impact-actions">
          <button className="action-btn primary" onClick={actions.downloadReport}>Download report (PDF)</button>
          <button className="action-btn secondary">Compare states</button>
        </div>
      </div>
    </section>
  );
}

export default CostDriversSection;
