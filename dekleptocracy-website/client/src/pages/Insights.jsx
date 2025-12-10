import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import './Insights.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Insights = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const category = searchParams.get('category') || 'all';
  const slug = searchParams.get('slug');
  const state = searchParams.get('state') || 'CALIFORNIA';

  const [articles, setArticles] = useState([]);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Determine content type filter from URL path
  const getContentTypeFromPath = () => {
    if (location.pathname === '/insights/articles') return 'article';
    if (location.pathname === '/insights/research') return 'research';
    return 'all';
  };
  
  const [contentTypeFilter, setContentTypeFilter] = useState(getContentTypeFromPath());

  // Update filter when path changes
  useEffect(() => {
    setContentTypeFilter(getContentTypeFromPath());
  }, [location.pathname]);
  
  // Fetch articles from API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(null);

        let url = `${API_URL}/api/articles`;
        
        // If slug is provided, fetch single article
        if (slug) {
          url = `${API_URL}/api/articles/${slug}`;
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch article');
          const data = await response.json();
          setCurrentArticle(data.article);
        } 
        // If category is specified, fetch by category
        else if (category !== 'all') {
          url = `${API_URL}/api/articles/category/${category}?limit=10`;
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch articles');
          const data = await response.json();
          setArticles(data.articles);
          if (data.articles.length > 0) {
            setCurrentArticle(data.articles[0]);
          }
        }
        // Fetch all articles
        else {
          url = `${API_URL}/api/articles?status=published&limit=20`;
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch articles');
          const data = await response.json();
          setArticles(data.articles);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [category, slug]);

  if (loading) {
    return (
      <div className="insights-page">
        <div className="insights-container">
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <div className="loading-spinner" style={{ 
              width: '50px', 
              height: '50px', 
              border: '4px solid #f3f4f6', 
              borderTop: '4px solid #4A5D3F',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading articles...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights-page">
        <div className="insights-container">
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h2 style={{ color: '#ef4444', marginBottom: '20px' }}>Error Loading Articles</h2>
            <p style={{ color: '#6b7280', marginBottom: '30px' }}>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 30px',
                backgroundColor: '#4A5D3F',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If category is 'all', show all insights overview
  if (category === 'all' && !slug) {
    return <AllInsightsView articles={articles} state={state} contentTypeFilter={contentTypeFilter} navigate={navigate} />;
  }

  // Show single article view
  const insightData = currentArticle;

  if (!insightData) {
    return (
      <div className="insights-page">
        <div className="insights-container">
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h2 style={{ color: '#4A5D3F' }}>No Articles Found</h2>
            <p style={{ color: '#6b7280', margin: '20px 0' }}>
              There are no articles available in this category yet.
            </p>
            <button 
              onClick={() => navigate('/insights')}
              style={{
                padding: '12px 30px',
                backgroundColor: '#4A5D3F',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              View All Articles
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <img 
            src={insightData.heroImage} 
            alt={insightData.title}
            onError={(e) => {
              e.target.onerror = null; // Prevent infinite loop
              e.target.src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&h=600&fit=crop&q=80';
            }}
          />
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
              <h3 className="insights-impact-title">Impact Score</h3>
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
                This score reflects the impact on household budgets. A higher score indicates stronger inflationary pressure and greater consumer burden.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section - Chart and Repeat Text */}
        <div className="insights-bottom-section">
          {/* Chart */}
          <div className="insights-chart-section">
            <div className="insights-chart-container">
              {(() => {
                // Calculate chart data dynamically
                const chartData = insightData.chartData || [];
                const maxValue = Math.max(...chartData.map(d => d.value), 16);
                const yLabels = [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map(v => Math.round(v));
                
                // Generate points for the polyline
                const points = chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1)) * 400;
                  const y = 200 - (d.value / maxValue) * 200;
                  return `${x},${y}`;
                }).join(' ');
                
                // Last point for the tooltip
                const lastPoint = chartData.length > 0 ? {
                  x: 400,
                  y: 200 - (chartData[chartData.length - 1].value / maxValue) * 200,
                  value: chartData[chartData.length - 1].value
                } : { x: 400, y: 10, value: 0 };
                
                return (
                  <>
                    <div className="insights-chart-y-labels">
                      {yLabels.map((label, i) => (
                        <span key={i}>{label}</span>
                      ))}
                    </div>
                    <div className="insights-chart-area">
                      <svg className="insights-line-chart" viewBox="0 0 400 200" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1="0" y1="0" x2="400" y2="0" stroke="#f3f4f6" strokeWidth="1" />
                        <line x1="0" y1="50" x2="400" y2="50" stroke="#f3f4f6" strokeWidth="1" />
                        <line x1="0" y1="100" x2="400" y2="100" stroke="#f3f4f6" strokeWidth="1" />
                        <line x1="0" y1="150" x2="400" y2="150" stroke="#f3f4f6" strokeWidth="1" />
                        <line x1="0" y1="200" x2="400" y2="200" stroke="#f3f4f6" strokeWidth="1" />
                        
                        {/* Line path with actual data */}
                        {points && (
                          <polyline
                            points={points}
                            fill="none"
                            stroke="#FF6B5A"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                        
                        {/* Data point with tooltip showing actual value */}
                        <circle cx={lastPoint.x} cy={lastPoint.y} r="5" fill="#FF6B5A" />
                        <g transform={`translate(${Math.min(lastPoint.x - 50, 300)}, ${lastPoint.y})`}>
                          <rect x="0" y="-40" width="95" height="35" rx="4" fill="#2d3748" />
                          <text x="47.5" y="-20" textAnchor="middle" fill="white" fontSize="11" fontWeight="500">
                            {insightData.priceUnit}
                          </text>
                          <text x="47.5" y="-10" textAnchor="middle" fill="white" fontSize="11" fontWeight="500">
                            {lastPoint.value.toFixed(2)}
                          </text>
                        </g>
                      </svg>
                      <div className="insights-chart-x-labels">
                        {chartData.map((data, index) => (
                          <span key={index}>{data.month}</span>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
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
        {insightData.sources && insightData.sources.length > 0 && (
          <div className="insights-sources">
            <h3 className="insights-sources-title">Sources:</h3>
            <ul className="insights-sources-list">
              {insightData.sources.map((source, index) => (
                <li key={index}>
                  <a 
                    href={source.url} 
                    className="insights-source-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.title}
                  </a>
                  {source.publishedDate && (
                    <span style={{ color: '#9ca3af', fontSize: '13px', marginLeft: '10px' }}>
                      ({new Date(source.publishedDate).toLocaleDateString()})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// All Insights Overview Component
const AllInsightsView = ({ articles, state, contentTypeFilter, navigate }) => {
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState('');
  
  // Get unique locations from articles
  const uniqueLocations = ['All Locations', ...new Set(articles.map(a => a.location).filter(Boolean))];
  
  // Filter articles by location
  const filteredArticles = selectedLocation === 'all' 
    ? articles 
    : articles.filter(article => article.location === selectedLocation);
  
  // Handle research generation
  const handleGenerateResearch = async () => {
    setGenerating(true);
    setGenerateMessage('');
    
    try {
      const response = await fetch(`${API_URL}/api/research/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: 3 }) // Generate 3 research reports
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGenerateMessage(`✅ Successfully generated ${data.count} research reports!`);
        // Reload the page after 2 seconds to show new research
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setGenerateMessage(`❌ Error: ${data.error || 'Failed to generate research'}`);
      }
    } catch (error) {
      setGenerateMessage(`❌ Error: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <div className="insights-page">
      <div className="insights-container">
        {/* Location Filter Badge */}
        <div className="insights-badge-wrapper">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="insights-location-badge"
            style={{
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              paddingRight: '30px',
              backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              backgroundSize: '14px'
            }}
          >
            <option value="all" style={{ backgroundColor: 'white', color: '#374151' }}>All Locations</option>
            {uniqueLocations.filter(loc => loc !== 'All Locations').map(location => (
              <option key={location} value={location} style={{ backgroundColor: 'white', color: '#374151' }}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <h1 className="insights-page-title">Latest Policy Impact Content</h1>

        {/* Generate Research Button - Only show on research page */}
        {contentTypeFilter === 'research' && (
          <div style={{ 
            marginBottom: '30px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleGenerateResearch}
              disabled={generating}
              style={{
                padding: '12px 24px',
                backgroundColor: generating ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: generating ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => !generating && (e.target.style.backgroundColor = '#2563eb')}
              onMouseOut={(e) => !generating && (e.target.style.backgroundColor = '#3b82f6')}
            >
              {generating ? (
                <>
                  <span style={{ 
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></span>
                  Generating Research...
                </>
              ) : (
                <>
                  🔬 Generate Research Reports
                </>
              )}
            </button>
            {generateMessage && (
              <span style={{ 
                fontSize: '14px', 
                color: generateMessage.includes('✅') ? '#10b981' : '#ef4444',
                fontWeight: '500'
              }}>
                {generateMessage}
              </span>
            )}
          </div>
        )}

        {/* Insights Grid */}
        {filteredArticles.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '2px dashed #e5e7eb',
            marginTop: '20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📰</div>
            <h2 style={{ color: '#4A5D3F', marginBottom: '15px' }}>
              {selectedLocation === 'all' ? 'No Articles Yet' : `No Articles for ${selectedLocation}`}
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '25px', maxWidth: '500px', margin: '0 auto 25px' }}>
              {selectedLocation === 'all' 
                ? 'Articles are automatically generated weekly. Check back soon for new policy impact analysis!'
                : 'Try selecting a different location to see more articles.'}
            </p>
          </div>
        ) : (
          <div className="all-insights-grid">
            {filteredArticles
              .filter(article => 
                contentTypeFilter === 'all' || 
                article.contentType === contentTypeFilter ||
                !article.contentType // backwards compatibility for articles without contentType
              )
              .map((article) => (
              <div key={article._id} className="all-insights-card">
                <div className="all-insights-hero">
                  <img 
                    src={article.heroImage} 
                    alt={article.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&h=600&fit=crop&q=80';
                    }}
                  />
                  <div className="all-insights-category-badge">{article.category}</div>
                  
                  {/* Content Type Badge - RIGHT */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: article.contentType === 'research' ? '#3b82f6' : '#10b981',
                    color: 'white',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {article.contentType === 'research' ? '🔬 Research' : '📰 Article'}
                  </div>
                </div>
              
              <div className="all-insights-content">
                <div className="all-insights-header">
                  <div className="all-insights-icon" style={{ backgroundColor: article.iconBg }}>
                    {article.icon}
                  </div>
                  <div className="all-insights-text">
                    <h3 className="all-insights-title">{article.title}</h3>
                    <p className="all-insights-description">{article.description}</p>
                  </div>
                </div>

                <div className="all-insights-price-section">
                  <div className="all-insights-price">
                    <span className="all-insights-price-value">{article.price}</span>
                    <span className="all-insights-price-unit">{article.priceUnit}</span>
                  </div>
                  <span className="all-insights-price-change">{article.priceChange}</span>
                </div>

                <div className="all-insights-impact">
                  <div className="all-insights-impact-score">
                    <span className="all-insights-score-label">Impact Score</span>
                    <span className="all-insights-score-value">{article.impactScore}</span>
                    <span className="all-insights-score-level">{article.impactLevel}</span>
                  </div>
                </div>

                <div style={{ 
                  fontSize: '12px', 
                  color: '#9ca3af', 
                  marginBottom: '15px',
                  paddingTop: '10px',
                  borderTop: '1px solid #f3f4f6'
                }}>
                  Published: {new Date(article.publishedAt).toLocaleDateString()} • Views: {article.views || 0}
                </div>

                <button 
                  className="all-insights-see-details"
                  onClick={() => navigate(`/insights?category=${article.category}&slug=${article.slug}&state=${state}`)}
                >
                  See details →
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Insights;
