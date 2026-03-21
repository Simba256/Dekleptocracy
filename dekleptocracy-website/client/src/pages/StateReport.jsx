import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../utils/apiUrl';
import SEO, { generateStateReportSchema } from '../components/common/SEO';
import Breadcrumbs from '../components/common/Breadcrumbs';
import './StateReport.css';

// AI Insight Card Component
const AIInsightCard = ({ insight, variant = 'default', icon, title, children }) => {
  if (!insight && !children) return null;

  const variantClass = variant !== 'default' ? `ai-insight-card--${variant}` : '';

  return (
    <div className={`ai-insight-card ${variantClass}`}>
      <div className="ai-insight-header">
        {icon && <div className="ai-insight-icon">{icon}</div>}
        {title && <h4 className="ai-insight-title">{title}</h4>}
      </div>
      <p className="ai-insight-text">{insight || children}</p>
    </div>
  );
};

// Squeeze Index Badge Component
const SqueezeIndexBadge = ({ squeezeIndex }) => {
  if (!squeezeIndex) return null;

  const statusConfig = {
    high_squeeze: { label: 'High Pressure', color: '#dc2626', icon: '⚠️' },
    moderate_squeeze: { label: 'Moderate Pressure', color: '#ea580c', icon: '📊' },
    mild_squeeze: { label: 'Mild Pressure', color: '#ca8a04', icon: '📈' },
    stable: { label: 'Stable', color: '#059669', icon: '✓' },
    relief: { label: 'Some Relief', color: '#0891b2', icon: '📉' },
    significant_relief: { label: 'Significant Relief', color: '#16a34a', icon: '💰' }
  };

  const config = statusConfig[squeezeIndex.status] || statusConfig.stable;

  return (
    <div className="squeeze-index-badge" style={{ borderColor: config.color }}>
      <span className="squeeze-index-icon">{config.icon}</span>
      <span className="squeeze-index-label" style={{ color: config.color }}>{config.label}</span>
      <span className="squeeze-index-details">
        {squeezeIndex.pressures > 0 && <span className="pressure-count">{squeezeIndex.pressures} rising</span>}
        {squeezeIndex.reliefs > 0 && <span className="relief-count">{squeezeIndex.reliefs} falling</span>}
      </span>
    </div>
  );
};

// Household Impact Display Component
const HouseholdImpactCard = ({ impact, crossMetricText, squeezeIndex }) => {
  if (!impact || impact.total === 0) return null;

  const isIncrease = impact.total > 0;

  return (
    <div className="ai-insight-card ai-insight-card--highlight">
      <div className="ai-insight-header">
        <div className="ai-insight-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <h4 className="ai-insight-title">Household Budget Impact</h4>
        <SqueezeIndexBadge squeezeIndex={squeezeIndex} />
      </div>
      {crossMetricText && <p className="ai-insight-text">{crossMetricText}</p>}
      <div className="household-impact">
        <div className="household-impact-total">
          {isIncrease ? '+' : '-'}${Math.abs(impact.total)}<span>/month</span>
        </div>
        {impact.breakdown?.length > 0 && (
          <div className="household-impact-breakdown">
            {impact.breakdown.map((item, index) => (
              <div key={index} className="household-impact-item">
                <span className="household-impact-item-category">{item.category}: </span>
                <span className={`household-impact-item-amount ${item.amount < 0 ? 'positive' : ''}`}>
                  {item.amount > 0 ? '+' : '-'}${Math.abs(item.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Forward Looking Insight Component
const ForwardLookingCard = ({ insight }) => {
  if (!insight?.text) return null;

  return (
    <div className="ai-insight-card ai-insight-card--projection">
      <div className="ai-insight-header">
        <div className="ai-insight-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        </div>
        <h4 className="ai-insight-title">Looking Ahead</h4>
      </div>
      <p className="ai-insight-text">{insight.text}</p>
      {insight.basedOnTrends?.length > 0 && (
        <div className="forward-looking-trends">
          {insight.basedOnTrends.map((trend, index) => (
            <span key={index} className="forward-looking-trend">{trend}</span>
          ))}
        </div>
      )}
    </div>
  );
};

const StateReport = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const name = searchParams.get('name') || 'California Resident';
  const stateName = searchParams.get('state') || 'California';
  const role = searchParams.get('role') || 'VOTER';
  const [reportData, setReportData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [triggeringRefresh, setTriggeringRefresh] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadReport() {
      try {
        setLoading(true);
        setError(null);
        setErrorCode(null);
        const response = await fetch(`${API_URL}/api/reports/state?state=${encodeURIComponent(stateName)}&role=${encodeURIComponent(role)}&name=${encodeURIComponent(name)}`, {
          signal: controller.signal
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle specific error codes
          setErrorCode(data.errorCode || null);
          throw new Error(data.message || `Failed to fetch state report: ${response.status}`);
        }

        setReportData(data.report || null);
        setMetadata(data.metadata || null);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setReportData(null);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
    return () => controller.abort();
  }, [API_URL, name, role, stateName]);

  const triggerDataRefresh = async () => {
    if (triggeringRefresh) return;
    setTriggeringRefresh(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/reports/state/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: stateName })
      });
      const data = await response.json();

      if (data.success) {
        if (data.status === 'in_progress') {
          // Data refresh started in background - poll for completion
          setError(`Data collection started for ${stateName}. This usually takes 30-60 seconds. The page will reload automatically when data is ready.`);
          setErrorCode('REFRESHING');

          // Poll for data availability every 10 seconds
          let attempts = 0;
          const maxAttempts = 12; // 2 minutes max
          const pollInterval = setInterval(async () => {
            attempts++;
            try {
              const checkResponse = await fetch(
                `${API_URL}/api/reports/state?state=${encodeURIComponent(stateName)}&role=${encodeURIComponent(role)}&name=${encodeURIComponent(name)}`
              );
              if (checkResponse.ok) {
                clearInterval(pollInterval);
                window.location.reload();
              } else if (attempts >= maxAttempts) {
                clearInterval(pollInterval);
                setError('Data collection is taking longer than expected. Please try reloading the page manually.');
                setErrorCode('NO_DATA_AVAILABLE');
                setTriggeringRefresh(false);
              }
            } catch (_e) {
              // Continue polling
            }
          }, 10000);
        } else {
          // Refresh completed immediately
          window.location.reload();
        }
      } else {
        setError('Failed to refresh data. Please try again later.');
        setTriggeringRefresh(false);
      }
    } catch (err) {
      setError('Failed to refresh data: ' + err.message);
      setTriggeringRefresh(false);
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'recently';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      const response = await fetch(
        `${API_URL}/api/reports/state?state=${encodeURIComponent(stateName)}&role=${encodeURIComponent(role)}&name=${encodeURIComponent(name)}&t=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch state report: ${response.status}`);
      }

      const data = await response.json();
      setReportData(data.report || null);
      setMetadata(data.metadata || null);
      setError(null);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Refresh failed:', err);
      }
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadPDF = async (event) => {
    if (!reportRef.current) return;

    try {
      const originalText = event.target.textContent;
      event.target.textContent = 'Generating PDF...';
      event.target.disabled = true;

      // Dynamic import - saves ~30KB from initial bundle
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1200
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      const fileName = `${reportData.stateName}-${reportData.role}-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      event.target.textContent = originalText;
      event.target.disabled = false;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('PDF generation failed:', error);
      }
      alert('Failed to generate PDF. Please try again.');
      event.target.textContent = 'Download Report';
      event.target.disabled = false;
    }
  };

  const _generateComparisonText = (comparisonData, stateName) => {
    if (!comparisonData || comparisonData.length === 0) {
      return `Living costs in ${stateName} vary from the national average.`;
    }

    const higher = comparisonData.filter(i => i.change.includes('+'));
    const lower = comparisonData.filter(i => i.change.includes('-'));

    let sentences = [];

    if (higher.length > 0) {
      const higherItems = higher.map(i => `${i.category.toLowerCase()} (${i.change})`).join(' and ');
      sentences.push(`${stateName} residents pay more for ${higherItems} compared to the national average.`);
    }

    if (lower.length > 0) {
      const lowerItems = lower.map(i => `${i.category.toLowerCase()} (${i.change})`).join(' and ');
      sentences.push(`On the plus side, ${lower.length > 1 ? 'costs are' : 'the cost is'} lower for ${lowerItems}.`);
    }

    if (sentences.length === 0) {
      return `${stateName}'s costs are roughly in line with national averages.`;
    }

    return sentences.join(' ');
  };

  if (loading) {
    return (
      <div className="district-report-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Generating report for {stateName}...</p>
          <p className="loading-subtext">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (error && !reportData) {
    const isNoDataError = errorCode === 'NO_DATA_AVAILABLE';
    const isRefreshing = errorCode === 'REFRESHING';

    return (
      <div className="district-report-page">
        <div className="error-container">
          {isRefreshing ? (
            <div className="spinner"></div>
          ) : (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isNoDataError ? (
                <>
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                </>
              ) : (
                <>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </>
              )}
            </svg>
          )}
          <h2>
            {isRefreshing
              ? 'Collecting Data...'
              : isNoDataError
                ? 'Data Not Yet Available'
                : 'Unable to Generate Report'}
          </h2>
          <p>{error}</p>
          {isNoDataError && !isRefreshing && (
            <p className="error-subtext">
              Government data needs to be fetched first. Click below to start collecting data for {stateName}.
            </p>
          )}
          <div className="error-actions">
            <button onClick={() => navigate('/')} className="secondary-button">
              Go Home
            </button>
            {isNoDataError && !isRefreshing ? (
              <button
                onClick={triggerDataRefresh}
                className="primary-button"
                disabled={triggeringRefresh}
              >
                {triggeringRefresh ? 'Fetching Data...' : 'Fetch Data Now'}
              </button>
            ) : !isRefreshing && (
              <button onClick={() => window.location.reload()} className="primary-button">
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const data = reportData;

  return (
    <div className="district-report-page" ref={reportRef}>
      <SEO
        title={`${stateName} Economic Impact Report`}
        description={`Comprehensive economic impact report for ${stateName}. See how federal policies, tariffs, and economic changes affect gas prices, electricity, food costs, and more.`}
        url={`/reports/state-report?state=${encodeURIComponent(stateName)}`}
        structuredData={generateStateReportSchema(stateName, data)}
      />

      {/* Breadcrumbs Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Reports', path: '/reports' },
          { label: stateName, path: `/reports/state-report?state=${encodeURIComponent(stateName)}` }
        ]}
      />

      {/* Header Section */}
      <div className="district-report-header">
        <div className="district-report-header-content">
          <div className="district-report-avatar">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="district-report-info">
            <h1 className="district-report-name">{data.name}</h1>
            <div className="district-report-tags">
              <span className="district-report-tag">{data.stateName}</span>
              <span className="district-report-tag">{data.role}</span>
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
          <span className={`district-report-dot ${metadata?.dataFreshness === 'stale' ? 'dot-stale' : ''}`}></span>
          {metadata?.source === 'real_data' ? (
            <span>
              {metadata?.dataFreshness === 'stale' ? (
                <span className="status-warning">Cached Data</span>
              ) : (
                <span className="status-fresh">Live Data</span>
              )}
              {' '} • Last updated {formatTimestamp(metadata?.generatedAt)}
              {metadata?.sources?.length > 0 && (
                <span className="data-sources"> • Sources: {metadata.sources.join(', ')}</span>
              )}
              {' '} •
              <button onClick={handleRefresh} className="retry-link" disabled={refreshing}>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </span>
          ) : (
            <span className="status-warning">
              Sample Data • <button onClick={handleRefresh} className="retry-link">Retry</button>
            </span>
          )}
        </div>
        <div className="district-report-buttons">
          <button
            className="district-report-button"
            onClick={handleDownloadPDF}
            disabled={!reportData}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Report
          </button>
        </div>
      </div>

      {/* Fallback Warning Banner */}
      {metadata?.source === 'fallback' && (
        <div className="fallback-warning-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>
            <strong>Sample Data:</strong> Live data generation is temporarily unavailable.
            Showing generic sample data. <button onClick={handleRefresh} className="retry-link">Try again</button>
          </span>
        </div>
      )}

      {/* State Impact Overview */}
      <div className="district-report-overview">
        <div className="district-report-overview-container">
          <div className="district-report-overview-header">
            <h2 className="district-report-overview-title">{data.overviewTitle || 'State Impact Overview'}</h2>
            {data.aiInsights?.crossMetric?.squeezeIndex && (
              <SqueezeIndexBadge squeezeIndex={data.aiInsights.crossMetric.squeezeIndex} />
            )}
          </div>

          {/* AI-Generated Executive Summary */}
          <div className="overview-executive-summary">
            <p className="district-report-overview-statement">
              {data.overviewStatement || 'Lobbyists and corporations profit while working families and schools lose'}
            </p>
          </div>

          {/* Cross-Metric AI Insight with Household Impact */}
          {data.aiInsights?.crossMetric && (
            <HouseholdImpactCard
              impact={data.aiInsights.crossMetric.householdImpact}
              crossMetricText={data.aiInsights.crossMetric.text}
              squeezeIndex={data.aiInsights.crossMetric.squeezeIndex}
            />
          )}

          {/* Quick AI Insights Grid */}
          {data.aiInsights?.sections && (
            <div className="overview-insights-grid">
              {data.aiInsights.sections.energy && (
                <div className="overview-insight-item overview-insight-energy">
                  <div className="overview-insight-icon">⚡</div>
                  <div className="overview-insight-content">
                    <span className="overview-insight-label">Energy</span>
                    <p className="overview-insight-text">{data.aiInsights.sections.energy}</p>
                  </div>
                </div>
              )}
              {data.aiInsights.sections.employment && (
                <div className="overview-insight-item overview-insight-employment">
                  <div className="overview-insight-icon">💼</div>
                  <div className="overview-insight-content">
                    <span className="overview-insight-label">Jobs & Economy</span>
                    <p className="overview-insight-text">{data.aiInsights.sections.employment}</p>
                  </div>
                </div>
              )}
              {data.aiInsights.sections.food && (
                <div className="overview-insight-item overview-insight-food">
                  <div className="overview-insight-icon">🛒</div>
                  <div className="overview-insight-content">
                    <span className="overview-insight-label">Food & Groceries</span>
                    <p className="overview-insight-text">{data.aiInsights.sections.food}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="district-report-comparison">
          {data.comparisonCards?.[0] && (
            <div className="district-report-comparison-card">
              <div className="district-report-comparison-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
                </svg>
              </div>
                <div className="district-report-comparison-value">{data.comparisonCards[0].value}</div>
              <div className="district-report-comparison-label">{data.comparisonCards[0].label}</div>
              <p className="district-report-comparison-description">
                {data.comparisonCards[0].description}
              </p>
            </div>
          )}
          
          <div className="district-report-vs">VS</div>
          
          {data.comparisonCards?.[1] && (
            <div className="district-report-comparison-card">
              <div className="district-report-comparison-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 9l-10-4-10 4 10 4 10-4z"/>
                  <path d="M22 9v6l-10 4-10-4V9"/>
                  <path d="M12 5v14"/>
                </svg>
              </div>
                <div className="district-report-comparison-value">{data.comparisonCards[1].value}</div>
              <div className="district-report-comparison-label">{data.comparisonCards[1].label}</div>
              <p className="district-report-comparison-description">
                {data.comparisonCards[1].description}
              </p>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="district-report-metrics">
        <h2 className="district-report-section-title">Real-time data showing how federal policies affect {data.stateName} residents.</h2>

        {/* Section Insights Row */}
        {data.aiInsights?.sections && (
          <div className="metrics-insights-row">
            {data.aiInsights.sections.energy && (
              <AIInsightCard
                insight={data.aiInsights.sections.energy}
                variant="compact"
                title="Energy Insight"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
                  </svg>
                }
              />
            )}
            {data.aiInsights.sections.employment && (
              <AIInsightCard
                insight={data.aiInsights.sections.employment}
                variant="compact"
                title="Employment Insight"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                }
              />
            )}
          </div>
        )}

        <div className="district-report-metrics-grid">
          {data.keyMetrics?.map((metric, index) => (
            <div key={index} className="district-report-metric-card">
              <div className="district-report-metric-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </div>
              <div className="district-report-metric-title">{metric.title}</div>
              <div className="district-report-metric-value" style={{ color: metric.color }}>
                {metric.value}
              </div>
              <div className="district-report-metric-change" style={{ color: metric.color }}>
                {metric.change}
              </div>
              {metric.historicalContext?.summaryDescription && (
                <div className="district-report-metric-context">
                  {metric.historicalContext.summaryDescription}
                </div>
              )}
              {metric.historicalContext?.yearOverYear?.description && (
                <div className="district-report-metric-yoy">
                  {metric.historicalContext.yearOverYear.description}
                </div>
              )}
              {metric.alerts?.length > 0 && (
                <div className="district-report-metric-alerts">
                  {metric.alerts.slice(0, 2).map((alert, alertIndex) => (
                    <span
                      key={alertIndex}
                      className={`metric-alert metric-alert--${alert.severity}`}
                    >
                      {alert.message}
                    </span>
                  ))}
                </div>
              )}
              {metric.source && (
                <div className="district-report-metric-source">
                  Source: {metric.source}
                  {metric.isStale && <span className="stale-indicator"> (older data)</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trend Over Time */}
      <div className="district-report-trends">
        <h2 className="district-report-section-title">Trend Over Time</h2>

        {/* Forward Looking AI Insight */}
        {data.aiInsights?.forwardLooking && (
          <ForwardLookingCard insight={data.aiInsights.forwardLooking} />
        )}

        <div className="district-report-trends-grid">
          {data.trendData?.map((trend, index) => {
            if (!trend.data || trend.data.length === 0) return null;

            // Calculate dynamic scaling based on actual data values
            const values = trend.data.map(p => p.value);
            const maxValue = Math.max(...values);
            const minValue = Math.min(...values);
            const range = maxValue - minValue || 1;
            const padding = range * 0.1; // 10% padding
            const adjustedMin = minValue - padding;
            const adjustedMax = maxValue + padding;
            const adjustedRange = adjustedMax - adjustedMin || 1;

            // Helper to calculate Y position (inverted for SVG)
            const getY = (value) => 100 - ((value - adjustedMin) / adjustedRange) * 80;

            return (
            <div key={index} className="district-report-trend-card">
              <div className="district-report-trend-header">
                <h3 className="district-report-trend-title">{trend.title}</h3>
                {trend.trendSummary && (
                  <span className={`trend-momentum trend-momentum--${trend.momentum || 'stable'}`}>
                    {trend.trendSummary}
                  </span>
                )}
              </div>
              <div className="district-report-trend-value">{trend.currentValue}</div>
              {trend.historicalContext && (
                <div className="district-report-trend-context">
                  {trend.historicalContext.summaryDescription && (
                    <span className={`historical-badge historical-badge--${trend.historicalContext.historicalRank?.type || 'typical'}`}>
                      {trend.historicalContext.summaryDescription}
                    </span>
                  )}
                  {trend.historicalContext.yearOverYear?.description && (
                    <span className="historical-yoy">
                      {trend.historicalContext.yearOverYear.description}
                    </span>
                  )}
                  {trend.historicalContext.peakTrough && trend.historicalContext.peakTrough.peak.fromPeak !== 0 && (
                    <span className="historical-peak">
                      {trend.historicalContext.peakTrough.peak.fromPeak < 0
                        ? `${Math.abs(trend.historicalContext.peakTrough.peak.fromPeak)}% below peak (${trend.historicalContext.peakTrough.peak.label})`
                        : `At or near peak`}
                    </span>
                  )}
                </div>
              )}
              {trend.alerts?.length > 0 && (
                <div className="district-report-trend-alerts">
                  {trend.alerts.slice(0, 2).map((alert, alertIndex) => (
                    <span
                      key={alertIndex}
                      className={`metric-alert metric-alert--${alert.severity}`}
                    >
                      {alert.message}
                    </span>
                  ))}
                </div>
              )}
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
                    d={`M 0,${getY(trend.data[0].value)} ${trend.data.map((point, i) => `L ${(i * 60) + 30},${getY(point.value)}`).join(' ')} L 270,100 L 0,100 Z`}
                    fill={`url(#gradient-${index})`}
                  />

                  {/* Line path */}
                  <path
                    d={`M 0,${getY(trend.data[0].value)} ${trend.data.map((point, i) => `L ${(i * 60) + 30},${getY(point.value)}`).join(' ')}`}
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
                      cy={getY(point.value)}
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
          )})}
        </div>
      </div>

      {/* State Comparison */}
      <div className="district-report-comparison-section">
        <h2 className="district-report-section-title">State Comparison</h2>

        {/* AI Comparison Narrative - Enhanced */}
        {data.aiInsights?.comparison?.text && (
          <div className="ai-comparison-narrative ai-comparison-narrative--enhanced">
            <div className="ai-insight-header">
              <div className="ai-insight-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 20V10"/>
                  <path d="M12 20V4"/>
                  <path d="M6 20v-6"/>
                </svg>
              </div>
              <h4 className="ai-insight-title">How {data.stateName} Compares to National Averages</h4>
            </div>
            <p className="ai-insight-text ai-insight-text--large">{data.aiInsights.comparison.text}</p>
          </div>
        )}

        <div className="district-report-comparison-content">
          <div className="district-report-comparison-box district-report-comparison-box--enhanced">
            <h3 className="district-report-comparison-box-title">
              <span className="comparison-box-icon">📊</span>
              {data.stateName} vs. National Average
            </h3>
            <div className="district-report-comparison-grid district-report-comparison-grid--enhanced">
              {data.comparisonData?.map((item, index) => {
                const stateVal = parseFloat(item.stateValue?.replace(/[^0-9.-]/g, '')) || 0;
                const natVal = parseFloat(item.nationalValue?.replace(/[^0-9.-]/g, '')) || 0;
                const isHigher = stateVal > natVal;
                const diffPercent = natVal > 0 ? ((stateVal - natVal) / natVal * 100).toFixed(1) : 0;

                return (
                  <div key={index} className={`comparison-card ${isHigher ? 'comparison-card--higher' : 'comparison-card--lower'}`}>
                    <div className="comparison-card-header">
                      <span className="comparison-card-category">{item.category}</span>
                      <span className={`comparison-card-badge ${isHigher ? 'badge--higher' : 'badge--lower'}`}>
                        {isHigher ? '↑' : '↓'} {Math.abs(diffPercent)}% {isHigher ? 'above' : 'below'}
                      </span>
                    </div>
                    <div className="comparison-card-values">
                      <div className="comparison-card-state">
                        <span className="comparison-card-label">{data.stateName}</span>
                        <span className="comparison-card-value">{item.stateValue}</span>
                      </div>
                      <div className="comparison-card-vs">vs</div>
                      <div className="comparison-card-national">
                        <span className="comparison-card-label">National</span>
                        <span className="comparison-card-value">{item.nationalValue}</span>
                      </div>
                    </div>
                    <div className="comparison-card-change">
                      <span className="comparison-card-yoy">YoY: {item.change}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Forward Looking tied to comparison context */}
        {data.aiInsights?.forwardLooking?.text && (
          <div className="comparison-forward-looking">
            <div className="ai-insight-header">
              <div className="ai-insight-icon">🔮</div>
              <h4 className="ai-insight-title">What This Means Going Forward</h4>
            </div>
            <p className="ai-insight-text">{data.aiInsights.forwardLooking.text}</p>
            {data.aiInsights.forwardLooking.projections?.length > 0 && (
              <div className="forward-projections">
                {data.aiInsights.forwardLooking.projections.map((proj, idx) => (
                  <span key={idx} className="projection-tag">{proj}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StateReport;
