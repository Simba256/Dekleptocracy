import { useHomepage } from '../../../context/HomepageContext';

export function BudgetImpactSection() {
  const { state, actions } = useHomepage();
  const { timelineDate, productQuery, timelineConfig } = state;

  // Use timeline config from API or fallback
  const milestones = timelineConfig?.milestones || [
    { position: 0, dateDisplay: 'Jul 1, 2024', label: 'Before Policy' },
    { position: 20, dateDisplay: 'Oct 1, 2024', label: 'Pre-Election' },
    { position: 50, dateDisplay: 'Jan 20, 2025', label: 'Inauguration Day', highlighted: true },
    { position: 70, dateDisplay: 'Apr 1, 2025', label: 'Early Months' },
    { position: 85, dateDisplay: 'Jul 1, 2025', label: 'Mid-Year' },
    { position: 100, dateDisplay: 'Oct 1, 2025', label: 'Current Snapshot' }
  ];

  // Find the active milestone based on timeline position
  const getActiveMilestoneIndex = () => {
    for (let i = milestones.length - 1; i >= 0; i--) {
      if (timelineDate >= milestones[i].position) {
        return i;
      }
    }
    return 0;
  };

  const activeMilestoneIndex = getActiveMilestoneIndex();

  return (
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
              {milestones.map((milestone, index) => (
                <div key={index} className="timeline-point">
                  <div className={`timeline-date ${index === activeMilestoneIndex ? 'active' : ''}`}>
                    {milestone.dateDisplay}
                  </div>
                  <div className={`timeline-label ${index === activeMilestoneIndex ? 'active' : ''}`}>
                    {milestone.label}
                  </div>
                </div>
              ))}
            </div>

            <input
              type="range"
              id="timeline-slider"
              min="0"
              max="100"
              value={timelineDate}
              onChange={(e) => actions.setTimelineDate(Number(e.target.value))}
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
          <h3 className="product-search-title">What&apos;s affecting your budget?</h3>
          <div className="product-search-container">
            <input
              type="text"
              placeholder="housing"
              value={productQuery}
              onChange={(e) => actions.setProductQuery(e.target.value)}
              className="product-search-input"
            />
            <button
              className="show-impact-btn"
              onClick={() => actions.showImpactModal(productQuery || 'Housing')}
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
  );
}

export default BudgetImpactSection;
