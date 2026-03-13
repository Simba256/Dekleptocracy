import { memo, useState, useMemo } from 'react';
import { useHomepage } from '../../../context/HomepageContext';
import TimelineSlider from '../../../components/inputs/TimelineSlider';
import ProductSearch from '../../../components/inputs/ProductSearch';

export const BudgetImpactSection = memo(function BudgetImpactSection() {
  const { state, actions } = useHomepage();
  const { timelineDate, timelineConfig, trendingProducts } = state;
  const [selectedDate, setSelectedDate] = useState('2025-01-20');

  // Use timeline config from API or fallback
  const milestones = timelineConfig?.milestones || [
    { date: '2024-07-01', label: 'Before Policy' },
    { date: '2024-10-01', label: 'Pre-Election' },
    { date: '2025-01-20', label: 'Inauguration Day', highlighted: true },
    { date: '2025-04-01', label: 'Early Months' },
    { date: '2025-07-01', label: 'Mid-Year' },
    { date: '2025-10-01', label: 'Current Snapshot' }
  ];

  const timelineConfigData = useMemo(() => ({
    minDate: '2024-01-01',
    maxDate: '2025-12-31',
    milestones,
    defaultDate: '2025-01-20'
  }), [milestones]);

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

          <TimelineSlider
            config={timelineConfigData}
            value={selectedDate}
            onChange={setSelectedDate}
            onMilestoneClick={(milestone) => {
              console.log('Milestone clicked:', milestone);
            }}
          />
        </div>

        <div className="product-search-section">
          <h3 className="product-search-title">What&apos;s affecting your budget?</h3>
          <ProductSearch
            onSearch={(product) => actions.showImpactModal(product)}
            onSelect={(product) => actions.showImpactModal(product.name || product)}
            placeholder="housing"
            trendingProducts={trendingProducts || [
              { name: 'Housing', changePercent: 80.9, trending: true },
              { name: 'Groceries', changePercent: 15.2, trending: true },
              { name: 'Gasoline', changePercent: 12.5, trending: true }
            ]}
          />
        </div>
      </div>
    </section>
  );
});

export default BudgetImpactSection;
