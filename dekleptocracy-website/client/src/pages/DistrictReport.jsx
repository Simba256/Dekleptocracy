import React from 'react';
import { useSearchParams } from 'react-router-dom';
import './DistrictReport.css';

const DistrictReport = () => {
  const [searchParams] = useSearchParams();
  const name = searchParams.get('name') || 'Alexandria Ocasio-Cortez';
  const district = searchParams.get('district') || 'NY-14 (BRONX & QUEENS)';
  const role = searchParams.get('role') || 'VOTER';

  const keyMetrics = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      ),
      title: "Average Monthly Rent Increase",
      value: "+$340",
      change: "▲ 18% since 2022",
      color: "#FF6B5A"
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      ),
      title: "Green Jobs Created (IRA)",
      value: "1,200",
      change: "▲ +450 this quarter",
      color: "#FF6B5A"
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      ),
      title: "Residents Still Uninsured",
      value: "12%",
      change: "▲ Down from 15%",
      color: "#FF6B5A"
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      ),
      title: "DACA Recipients Protected",
      value: "4,847",
      change: "▲ +340 this month",
      color: "#FF6B5A"
    }
  ];

  const trendData = [
    {
      title: "Monthly Average Rent",
      currentValue: "$1,200",
      data: [
        { month: "Jan", value: 800, color: "#4A5D3F" },
        { month: "Feb", value: 850, color: "#4A5D3F" },
        { month: "March", value: 900, color: "#4A5D3F" },
        { month: "April", value: 950, color: "#FF6B5A" },
        { month: "June", value: 1200, color: "#FF6B5A" }
      ]
    },
    {
      title: "Fuel Prices Over Time",
      currentValue: "$1,200",
      data: [
        { month: "Jan", value: 600, color: "#4A5D3F" },
        { month: "Feb", value: 650, color: "#4A5D3F" },
        { month: "March", value: 700, color: "#4A5D3F" },
        { month: "April", value: 800, color: "#FF6B5A" },
        { month: "June", value: 1200, color: "#FF6B5A" }
      ]
    },
    {
      title: "Grocery Basket Trend",
      currentValue: "$1,200",
      data: [
        { month: "Jan", value: 700, color: "#4A5D3F" },
        { month: "Feb", value: 750, color: "#4A5D3F" },
        { month: "March", value: 800, color: "#4A5D3F" },
        { month: "April", value: 900, color: "#FF6B5A" },
        { month: "June", value: 1200, color: "#FF6B5A" }
      ]
    }
  ];

  const comparisonData = [
    {
      category: "Grocery basket",
      change: "+4% higher",
      stateValue: "$412",
      nationalValue: "$395"
    },
    {
      category: "Fuel Price",
      change: "+3.8% higher",
      stateValue: "$3.84",
      nationalValue: "$3.70"
    },
    {
      category: "Electricity Bill",
      change: "+69% higher",
      stateValue: "$282",
      nationalValue: "$167"
    },
    {
      category: "Books & Printing",
      change: "+12% higher",
      stateValue: "$4.6",
      nationalValue: "$4.1"
    }
  ];

  return (
    <div className="district-report-page">
      {/* Header Section */}
      <div className="district-report-header">
        <div className="district-report-header-content">
          <div className="district-report-avatar">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="district-report-info">
            <h1 className="district-report-name">{name}</h1>
            <div className="district-report-tags">
              <span className="district-report-tag">{district}</span>
              <span className="district-report-tag">{role}</span>
            </div>
            <p className="district-report-description">
              Generate personalized reports showing how federal policies impact your community. 
              Perfect for voters, advocates, candidates, and anyone who wants data-driven insights.
            </p>
          </div>
        </div>
      </div>

      {/* Data Status and Actions */}
      <div className="district-report-actions">
        <div className="district-report-status">
          <span className="district-report-dot"></span>
          Live Data • Last updated 2 hours ago • Next update in 5 days (Tuesday, Oct 8)
        </div>
        <div className="district-report-buttons">
          <button className="district-report-button">Download Report</button>
          <button className="district-report-button">Get Widget</button>
        </div>
      </div>

      {/* District Impact Overview */}
      <div className="district-report-overview">
        <div className="district-report-overview-container">
          <div className="district-report-overview-header">
            <h2 className="district-report-overview-title">District Impact Overview</h2>
          </div>
          <p className="district-report-overview-statement">
            Lobbyists and corporations profit while working families and schools lose
          </p>
          
          <div className="district-report-comparison">
          <div className="district-report-comparison-card">
            <div className="district-report-comparison-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
              </svg>
            </div>
            <div className="district-report-comparison-value">+68%</div>
            <div className="district-report-comparison-label">Energy Costs Rising</div>
            <p className="district-report-comparison-description">
              Our electricity and gas bills increased by 68% since tariffs, directly impacting household budgets
            </p>
          </div>
          
          <div className="district-report-vs">VS</div>
          
          <div className="district-report-comparison-card">
            <div className="district-report-comparison-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 9l-10-4-10 4 10 4 10-4z"/>
                <path d="M22 9v6l-10 4-10-4V9"/>
                <path d="M12 5v14"/>
              </svg>
            </div>
            <div className="district-report-comparison-value">-$2,847</div>
            <div className="district-report-comparison-label">Per-Student School Funding Cut</div>
            <p className="district-report-comparison-description">
              Local schools lost $2,847 per student while Washington lobbyists gained $9.2M in your district
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="district-report-metrics">
        <h2 className="district-report-section-title">Real-time data showing how federal policies affect {district} residents.</h2>
        <div className="district-report-metrics-grid">
          {keyMetrics.map((metric, index) => (
            <div key={index} className="district-report-metric-card">
              <div className="district-report-metric-icon">
                {metric.icon}
              </div>
              <div className="district-report-metric-title">{metric.title}</div>
              <div className="district-report-metric-value" style={{ color: metric.color }}>
                {metric.value}
              </div>
              <div className="district-report-metric-change" style={{ color: metric.color }}>
                {metric.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Over Time */}
      <div className="district-report-trends">
        <h2 className="district-report-section-title">Trend Over Time</h2>
        <div className="district-report-trends-grid">
          {trendData.map((trend, index) => (
            <div key={index} className="district-report-trend-card">
              <h3 className="district-report-trend-title">{trend.title}</h3>
              <div className="district-report-trend-value">{trend.currentValue}</div>
              <div className="district-report-trend-chart">
                <svg className="district-report-line-chart" viewBox="0 0 300 120">
                  <defs>
                    <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={trend.data[0].color} stopOpacity="0.3"/>
                      <stop offset="100%" stopColor={trend.data[trend.data.length-1].color} stopOpacity="0.1"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  <line x1="0" y1="20" x2="300" y2="20" stroke="#e5e7eb" strokeWidth="1"/>
                  <line x1="0" y1="40" x2="300" y2="40" stroke="#e5e7eb" strokeWidth="1"/>
                  <line x1="0" y1="60" x2="300" y2="60" stroke="#e5e7eb" strokeWidth="1"/>
                  <line x1="0" y1="80" x2="300" y2="80" stroke="#e5e7eb" strokeWidth="1"/>
                  <line x1="0" y1="100" x2="300" y2="100" stroke="#e5e7eb" strokeWidth="1"/>
                  
                  {/* Area under the line */}
                  <path 
                    d={`M 0,${100 - (trend.data[0].value / 1200) * 80} ${trend.data.map((point, i) => `L ${(i * 60) + 30},${100 - (point.value / 1200) * 80}`).join(' ')} L 270,100 L 0,100 Z`}
                    fill="url(#gradient-${index})"
                  />
                  
                  {/* Line path */}
                  <path 
                    d={`M 0,${100 - (trend.data[0].value / 1200) * 80} ${trend.data.map((point, i) => `L ${(i * 60) + 30},${100 - (point.value / 1200) * 80}`).join(' ')}`}
                    stroke={trend.data[trend.data.length-1].color}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Data points */}
                  {trend.data.map((point, i) => (
                    <circle
                      key={i}
                      cx={(i * 60) + 30}
                      cy={100 - (point.value / 1200) * 80}
                      r="4"
                      fill={point.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                  ))}
                  
                  {/* Month labels */}
                  {trend.data.map((point, i) => (
                    <text
                      key={i}
                      x={(i * 60) + 30}
                      y="115"
                      textAnchor="middle"
                      fontSize="10"
                      fill="#6b7280"
                    >
                      {point.month}
                    </text>
                  ))}
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* District Comparison */}
      <div className="district-report-comparison-section">
        <h2 className="district-report-section-title">District Comparison</h2>
        <div className="district-report-comparison-content">
          <div className="district-report-comparison-text">
            <p>
              Living costs are rising faster than the national average. Your grocery baskets cost around 4% more, 
              fuel prices are 3.8% higher, and electricity bills are nearly 70% higher compared to the national average. 
              Books and printing costs have also increased significantly.
            </p>
            <p>
              These increases directly impact your wallet and make it harder for families to make ends meet in your district.
            </p>
          </div>
          <div className="district-report-comparison-box">
            <h3 className="district-report-comparison-box-title">Your state vs. national average</h3>
            <div className="district-report-comparison-grid">
              {comparisonData.map((item, index) => (
                <div key={index} className="district-report-comparison-item">
                  <div className="district-report-comparison-item-title">{item.category}</div>
                  <div className="district-report-comparison-item-change">{item.change}</div>
                  <div className="district-report-comparison-item-details">
                    (Your state: {item.stateValue} vs Nat'l: {item.nationalValue})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistrictReport;
