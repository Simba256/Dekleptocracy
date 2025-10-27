import React from 'react';
import { useSearchParams } from 'react-router-dom';
import './Insights.css';

const Insights = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'all';
  const state = searchParams.get('state') || 'CALIFORNIA';

  // Data based on category and state
  const getInsightData = (category, state) => {
    const dataMap = {
      groceries: {
        location: state,
        title: 'Top Wallet Shocks This Week',
        heroImage: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=1200&h=400&fit=crop',
        icon: '🥚',
        iconBg: '#fef3c7',
        category: 'Groceries',
        description: 'A dozen eggs hit $5.90 in February 2025 nearly $3 higher than last year.',
        price: '$5.90',
        priceUnit: 'per dozen',
        priceChange: '+5.7%',
        impactScore: 83,
        impactLevel: 'high',
        mainText: 'In February 2025, the price of a dozen eggs in California climbed to $5.90, almost double last year\'s price. Families are now paying nearly $25 more per month just for eggs, a staple in most households.',
        whyItHappened: [
          {
            title: 'Feed Tariffs:',
            description: 'New tariffs on imported grains like corn and soy — critical for chicken feed — increased production costs.'
          },
          {
            title: 'Supply Issues:',
            description: 'Ongoing outbreaks of avian flu reduced poultry supply nationwide.'
          },
          {
            title: 'Market Demand:',
            description: 'Holiday demand for eggs (baking, festive dishes) amplified the price surge.'
          }
        ],
        chartData: [
          { month: 'Jan', value: 3.2 },
          { month: 'Feb', value: 3.5 },
          { month: 'Mar', value: 3.8 },
          { month: 'Apr', value: 4.2 },
          { month: 'May', value: 4.8 },
          { month: 'Jun', value: 5.4 },
          { month: 'Jul', value: 5.9 }
        ],
        sources: [
          { title: 'USDA Weekly Egg Market Report', url: '#' },
          { title: 'California Agriculture Dept. Bulletin', url: '#' },
          { title: 'Reuters: Egg Prices and Policy Impact', url: '#' }
        ]
      },
      fuel: {
        location: state,
        title: 'Top Wallet Shocks This Week',
        heroImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop',
        icon: '⛽',
        iconBg: '#fef3c7',
        category: 'Fuel',
        description: 'Gas prices tick up 2¢ in the last week to reach $3.15/gal nationwide.',
        price: '$3.15',
        priceUnit: 'per gallon',
        priceChange: '+2¢',
        impactScore: 63,
        impactLevel: 'medium',
        mainText: 'Gas prices have been steadily climbing across the nation, with California seeing some of the highest increases. The recent 2-cent jump brings the national average to $3.15 per gallon, putting additional strain on commuters and families.',
        whyItHappened: [
          {
            title: 'Crude Oil Prices:',
            description: 'Global crude oil prices have increased due to supply chain disruptions and geopolitical tensions.'
          },
          {
            title: 'Refinery Issues:',
            description: 'Several refineries have experienced maintenance issues, reducing gasoline production capacity.'
          },
          {
            title: 'Transportation Costs:',
            description: 'Increased costs for transporting fuel from refineries to gas stations.'
          }
        ],
        chartData: [
          { month: 'Jan', value: 2.8 },
          { month: 'Feb', value: 2.9 },
          { month: 'Mar', value: 3.0 },
          { month: 'Apr', value: 3.1 },
          { month: 'May', value: 3.2 },
          { month: 'Jun', value: 3.15 },
          { month: 'Jul', value: 3.15 }
        ],
        sources: [
          { title: 'AAA Gas Price Report', url: '#' },
          { title: 'Energy Information Administration', url: '#' },
          { title: 'California Energy Commission', url: '#' }
        ]
      },
      utilities: {
        location: state,
        title: 'Top Wallet Shocks This Week',
        heroImage: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&h=400&fit=crop',
        icon: '💡',
        iconBg: '#fef3c7',
        category: 'Utilities',
        description: 'U.S. residential electricity rates rose about 6.7% in the past year.',
        price: '+6.7%',
        priceUnit: 'nationwide',
        priceChange: '+0.6%',
        impactScore: 72,
        impactLevel: 'medium',
        mainText: 'Electricity costs have surged across the United States, with residential rates increasing by 6.7% over the past year. This translates to an average increase of $15-25 per month for typical households.',
        whyItHappened: [
          {
            title: 'Natural Gas Prices:',
            description: 'Rising natural gas prices have increased the cost of electricity generation.'
          },
          {
            title: 'Grid Infrastructure:',
            description: 'Aging grid infrastructure requires significant investment, costs passed to consumers.'
          },
          {
            title: 'Renewable Energy Transition:',
            description: 'Investment in renewable energy infrastructure has led to short-term cost increases.'
          }
        ],
        chartData: [
          { month: 'Jan', value: 12.5 },
          { month: 'Feb', value: 12.8 },
          { month: 'Mar', value: 13.2 },
          { month: 'Apr', value: 13.5 },
          { month: 'May', value: 13.8 },
          { month: 'Jun', value: 14.1 },
          { month: 'Jul', value: 14.3 }
        ],
        sources: [
          { title: 'U.S. Energy Information Administration', url: '#' },
          { title: 'Federal Energy Regulatory Commission', url: '#' },
          { title: 'State Public Utility Commissions', url: '#' }
        ]
      },
      tech: {
        location: state,
        title: 'Top Wallet Shocks This Week',
        heroImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=400&fit=crop',
        icon: '📱',
        iconBg: '#fef3c7',
        category: 'Tech',
        description: 'iPhone 17 expected to cost $50 more due to tariff increases.',
        price: '+$50',
        priceUnit: 'projected',
        priceChange: '+2.1%',
        impactScore: 45,
        impactLevel: 'low',
        mainText: 'New tariffs on imported electronics components are expected to increase the cost of the upcoming iPhone 17 by approximately $50. This represents a 2.1% increase over previous models.',
        whyItHappened: [
          {
            title: 'Component Tariffs:',
            description: 'New tariffs on imported semiconductors and electronic components increase manufacturing costs.'
          },
          {
            title: 'Supply Chain Costs:',
            description: 'Increased costs for shipping and logistics due to global supply chain disruptions.'
          },
          {
            title: 'Currency Fluctuations:',
            description: 'Exchange rate changes between the dollar and other currencies affect component costs.'
          }
        ],
        chartData: [
          { month: 'Jan', value: 999 },
          { month: 'Feb', value: 1005 },
          { month: 'Mar', value: 1010 },
          { month: 'Apr', value: 1015 },
          { month: 'May', value: 1020 },
          { month: 'Jun', value: 1025 },
          { month: 'Jul', value: 1049 }
        ],
        sources: [
          { title: 'Apple Inc. Financial Reports', url: '#' },
          { title: 'U.S. Trade Representative', url: '#' },
          { title: 'Consumer Technology Association', url: '#' }
        ]
      }
    };

    return dataMap[category] || dataMap.groceries;
  };

  // If category is 'all', show all insights overview
  if (category === 'all') {
    return <AllInsightsView state={state} />;
  }

  const insightData = getInsightData(category, state);

  return (
    <div className="insights-page">
      <div className="insights-container">
        {/* Location Badge */}
        <div className="insights-badge-wrapper">
          <span className="insights-location-badge">{insightData.location}</span>
        </div>

        {/* Title */}
        <h1 className="insights-page-title">{insightData.title}</h1>

        {/* Hero Image */}
        <div className="insights-hero-image">
          <img src={insightData.heroImage} alt="Eggs on shelf" />
        </div>

        {/* Main Content Grid */}
        <div className="insights-content-grid">
          {/* Left Column */}
          <div className="insights-left-column">
            {/* Icon + Description */}
            <div className="insights-icon-section">
              <div className="insights-icon-circle" style={{ backgroundColor: insightData.iconBg }}>
                {insightData.icon}
              </div>
              <p className="insights-description">{insightData.description}</p>
            </div>


            {/* Main Text */}
            <p className="insights-main-text">{insightData.mainText}</p>

            {/* Why It Happened */}
            <div className="insights-why-section">
              <h2 className="insights-why-title">Why It Happened</h2>
              <ul className="insights-why-list">
                {insightData.whyItHappened.map((reason, index) => (
                  <li key={index} className="insights-why-item">
                    <strong>{reason.title}</strong> {reason.description}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column */}
          <div className="insights-right-column">
            {/* Price Display */}
            <div className="insights-price-display">
              <div className="insights-price-main">
                <span className="insights-price-value">{insightData.price}</span>
                <span className="insights-price-unit">{insightData.priceUnit}</span>
              </div>
              <span className="insights-price-change">{insightData.priceChange}</span>
            </div>

            {/* Impact Score Gauge */}
            <div className="insights-impact-score">
              <h3 className="insights-impact-title">Egg Price Impact Score</h3>
              <span className="insights-impact-level">{insightData.impactLevel}</span>
              
              <div className="insights-gauge-wrapper">
                <svg className="insights-gauge" viewBox="0 0 200 120">
                  {/* Background arc */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="20"
                    strokeLinecap="round"
                  />
                  {/* Progress arc */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#6B7F5F"
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeDasharray={`${(insightData.impactScore / 100) * 251.2} 251.2`}
                  />
                </svg>
                <div className="insights-gauge-value">
                  <div className="insights-gauge-number">{insightData.impactScore}</div>
                  <div className="insights-gauge-label">OUT OF 100</div>
                </div>
              </div>

              <p className="insights-impact-description">
                This score reflects the impact of rising egg prices on household grocery budgets compared to last year. A higher score indicates stronger inflationary pressure and a greater consumer burden.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section - Chart and Repeat Text */}
        <div className="insights-bottom-section">
          {/* Chart */}
          <div className="insights-chart-section">
            <div className="insights-chart-container">
              <div className="insights-chart-y-labels">
                <span>16</span>
                <span>12</span>
                <span>8</span>
                <span>4</span>
                <span>0</span>
              </div>
              <div className="insights-chart-area">
                <svg className="insights-line-chart" viewBox="0 0 400 200" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="0" x2="400" y2="0" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="0" y1="50" x2="400" y2="50" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="0" y1="100" x2="400" y2="100" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="0" y1="150" x2="400" y2="150" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="0" y1="200" x2="400" y2="200" stroke="#f3f4f6" strokeWidth="1" />
                  
                  {/* Line path */}
                  <polyline
                    points="0,150 66,135 133,120 200,95 266,65 333,35 400,10"
                    fill="none"
                    stroke="#FF6B5A"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Data point with tooltip */}
                  <circle cx="400" cy="10" r="5" fill="#FF6B5A" />
                  <g transform="translate(300, 10)">
                    <rect x="0" y="-40" width="95" height="35" rx="4" fill="#2d3748" />
                    <text x="47.5" y="-20" textAnchor="middle" fill="white" fontSize="11" fontWeight="500">
                      rising egg
                    </text>
                    <text x="47.5" y="-10" textAnchor="middle" fill="white" fontSize="11" fontWeight="500">
                      prices
                    </text>
                  </g>
                </svg>
                <div className="insights-chart-x-labels">
                  {insightData.chartData.map((data, index) => (
                    <span key={index}>{data.month}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Text Column */}
          <div className="insights-text-column">
            <p className="insights-repeat-text">{insightData.mainText}</p>
            
            <div className="insights-why-section-bottom">
              <h3 className="insights-why-title-bottom">Why It Happened</h3>
              <ul className="insights-why-list-bottom">
                {insightData.whyItHappened.map((reason, index) => (
                  <li key={index} className="insights-why-item-bottom">
                    <strong>{reason.title}</strong> {reason.description}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sources */}
        <div className="insights-sources">
          <h3 className="insights-sources-title">Sources:</h3>
          <ul className="insights-sources-list">
            {insightData.sources.map((source, index) => (
              <li key={index}>
                <a href={source.url} className="insights-source-link">{source.title}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// All Insights Overview Component
const AllInsightsView = ({ state }) => {
  const allInsights = [
    {
      id: 'groceries',
      category: 'Groceries',
      icon: '🥚',
      iconBg: '#fef3c7',
      title: 'Egg prices hit $5.90 in February 2025',
      description: 'A dozen eggs hit $5.90 in February 2025 nearly $3 higher than last year.',
      price: '$5.90',
      priceUnit: 'per dozen',
      priceChange: '+5.7%',
      impactScore: 83,
      impactLevel: 'high',
      heroImage: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=300&fit=crop'
    },
    {
      id: 'fuel',
      category: 'Fuel',
      icon: '⛽',
      iconBg: '#fef3c7',
      title: 'Gas prices tick up 2¢ to reach $3.15/gal',
      description: 'Gas prices tick up 2¢ in the last week to reach $3.15/gal nationwide.',
      price: '$3.15',
      priceUnit: 'per gallon',
      priceChange: '+2¢',
      impactScore: 63,
      impactLevel: 'medium',
      heroImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
    },
    {
      id: 'utilities',
      category: 'Utilities',
      icon: '💡',
      iconBg: '#fef3c7',
      title: 'Electricity rates rose 6.7% nationwide',
      description: 'U.S. residential electricity rates rose about 6.7% in the past year.',
      price: '+6.7%',
      priceUnit: 'nationwide',
      priceChange: '+0.6%',
      impactScore: 72,
      impactLevel: 'medium',
      heroImage: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop'
    },
    {
      id: 'tech',
      category: 'Tech',
      icon: '📱',
      iconBg: '#fef3c7',
      title: 'iPhone 17 expected to cost $50 more',
      description: 'iPhone 17 expected to cost $50 more due to tariff increases.',
      price: '+$50',
      priceUnit: 'projected',
      priceChange: '+2.1%',
      impactScore: 45,
      impactLevel: 'low',
      heroImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop'
    }
  ];

  return (
    <div className="insights-page">
      <div className="insights-container">
        {/* Location Badge */}
        <div className="insights-badge-wrapper">
          <span className="insights-location-badge">{state}</span>
        </div>

        {/* Title */}
        <h1 className="insights-page-title">All Wallet Shocks This Week</h1>

        {/* Insights Grid */}
        <div className="all-insights-grid">
          {allInsights.map((insight) => (
            <div key={insight.id} className="all-insights-card">
              <div className="all-insights-hero">
                <img src={insight.heroImage} alt={insight.category} />
                <div className="all-insights-category-badge">{insight.category}</div>
              </div>
              
              <div className="all-insights-content">
                <div className="all-insights-header">
                  <div className="all-insights-icon" style={{ backgroundColor: insight.iconBg }}>
                    {insight.icon}
                  </div>
                  <div className="all-insights-text">
                    <h3 className="all-insights-title">{insight.title}</h3>
                    <p className="all-insights-description">{insight.description}</p>
                  </div>
                </div>

                <div className="all-insights-price-section">
                  <div className="all-insights-price">
                    <span className="all-insights-price-value">{insight.price}</span>
                    <span className="all-insights-price-unit">{insight.priceUnit}</span>
                  </div>
                  <span className="all-insights-price-change">{insight.priceChange}</span>
                </div>

                <div className="all-insights-impact">
                  <div className="all-insights-impact-score">
                    <span className="all-insights-score-label">Impact Score</span>
                    <span className="all-insights-score-value">{insight.impactScore}</span>
                    <span className="all-insights-score-level">{insight.impactLevel}</span>
                  </div>
                </div>

                <button 
                  className="all-insights-see-details"
                  onClick={() => window.location.href = `/insights?category=${insight.id}&state=${state}`}
                >
                  See details →
              </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Insights;
