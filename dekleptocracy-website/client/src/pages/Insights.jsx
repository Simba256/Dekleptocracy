import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './Insights.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Insights = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const category = searchParams.get('category') || 'all';
  const slug = searchParams.get('slug');
  const state = searchParams.get('state') || 'CALIFORNIA';

  const [articles, setArticles] = useState([]);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    return <AllInsightsView articles={articles} state={state} />;
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
          <img src={insightData.heroImage} alt={insightData.title} />
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
                      price trend
                    </text>
                    <text x="47.5" y="-10" textAnchor="middle" fill="white" fontSize="11" fontWeight="500">
                      rising
                    </text>
                  </g>
                </svg>
                <div className="insights-chart-x-labels">
                  {insightData.chartData && insightData.chartData.map((data, index) => (
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

        {/* Generated By Tag */}
        {insightData.generatedBy === 'llm' && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '40px', 
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              This article was generated by AI using verified data sources • 
              Published on {new Date(insightData.publishedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// All Insights Overview Component
const AllInsightsView = ({ articles, state }) => {
  const navigate = useNavigate();

  return (
    <div className="insights-page">
      <div className="insights-container">
        {/* Location Badge */}
        <div className="insights-badge-wrapper">
          <span className="insights-location-badge">{state}</span>
        </div>

        {/* Title */}
        <h1 className="insights-page-title">Latest Policy Impact Articles</h1>
        <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '40px' }}>
          AI-generated insights based on verified data sources, updated every 2-3 hours
        </p>

        {/* Insights Grid */}
        {articles.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '2px dashed #e5e7eb',
            marginTop: '20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📰</div>
            <h2 style={{ color: '#4A5D3F', marginBottom: '15px' }}>No Articles Yet</h2>
            <p style={{ color: '#6b7280', marginBottom: '25px', maxWidth: '500px', margin: '0 auto 25px' }}>
              Articles are automatically generated every 2 hours using your MCP server. 
              The first batch of articles will appear shortly!
            </p>
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`${API_URL}/api/articles/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ count: 5 })
                  });
                  if (response.ok) {
                    alert('Articles are being generated! Refresh the page in a minute.');
                  }
                } catch (error) {
                  console.error('Error generating articles:', error);
                  alert('Error generating articles. Make sure your MCP server is running.');
                }
              }}
              style={{
                padding: '12px 30px',
                backgroundColor: '#4A5D3F',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                marginRight: '10px'
              }}
            >
              🚀 Generate Articles Now
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 30px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              🔄 Refresh Page
            </button>
          </div>
        ) : (
          <div className="all-insights-grid">
            {articles.map((article) => (
              <div key={article._id} className="all-insights-card">
                <div className="all-insights-hero">
                  <img src={article.heroImage} alt={article.title} />
                  <div className="all-insights-category-badge">{article.category}</div>
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
