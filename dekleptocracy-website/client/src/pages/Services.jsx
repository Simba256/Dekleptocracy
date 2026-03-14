import { useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';
import './Services.css';

const Services = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: '🤖',
      title: 'AI-Powered Policy Intelligence',
      description: 'Ask our AI chatbot anything about policy impacts, price changes, and budget effects. Get instant, data-driven answers tailored to your location.',
      features: ['Natural language queries', 'Real-time policy analysis', 'Personalized insights', 'Historical trend analysis']
    },
    {
      icon: '📊',
      title: 'Real-Time Price Tracking',
      description: 'Monitor how government policies affect the prices of everyday items, from groceries to gas, utilities to tech products.',
      features: ['Daily price updates', 'Multi-category tracking', 'Price comparison tools', 'Trend visualization']
    },
    {
      icon: '🗺️',
      title: 'Interactive Impact Maps',
      description: 'Visualize where prices are surging across the country. See how your state compares to others and identify regional trends.',
      features: ['State-by-state comparison', 'Heat map visualization', 'Local impact data', 'District-level analysis']
    },
    {
      icon: '💰',
      title: 'Budget Impact Analysis',
      description: 'Understand exactly how policy changes affect your household budget. Track spending increases and identify cost drivers.',
      features: ['Personalized budget tracking', 'Policy impact calculation', 'Category-wise breakdown', 'Savings recommendations']
    },
    {
      icon: '📈',
      title: 'Comprehensive Reports',
      description: 'Access detailed reports on lobbying activities, tariff impacts, and policy changes. Download PDFs for offline reference.',
      features: ['District reports', 'Policy analysis', 'Lobbying tracking', 'Downloadable formats']
    },
    {
      icon: '🔔',
      title: 'Custom Alerts & Notifications',
      description: 'Stay informed about policy changes and price shocks in your area. Set up custom alerts for topics you care about.',
      features: ['Price alerts', 'Policy updates', 'Location-based notifications', 'Custom topics']
    },
    {
      icon: '📱',
      title: 'Multi-Device Access',
      description: 'Access Dekleptocracy from any device. Our responsive design works seamlessly on desktop, tablet, and mobile.',
      features: ['Web platform', 'Mobile responsive', 'Sync across devices']
    },
    {
      icon: '🔍',
      title: 'Data Transparency',
      description: 'All our data comes from verified public sources including government databases, economic research, and official records.',
      features: ['Source citations', 'Data methodology', 'Regular updates', 'Quality assurance']
    }
  ];

  return (
    <div className="services-page">
      <SEO
        title="Our Services"
        description="Explore Dekleptocracy's suite of tools: AI-powered policy intelligence, real-time price tracking, interactive impact maps, and budget analysis for your household."
        url="/services"
        keywords="policy analysis tools, price tracking, budget impact, AI chatbot, government policy impact"
      />
      {/* Hero Section */}
      <section className="services-hero">
        <div className="services-hero-content">
          <h1 className="services-hero-title">Our Services</h1>
          <p className="services-hero-subtitle">
            Empowering you with data-driven insights to understand how government decisions impact your budget
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="services-main">
        <div className="services-container">
          <div className="services-grid">
            {services.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <ul className="service-features">
                  {service.features.map((feature, idx) => (
                    <li key={idx}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Highlight Section */}
      <section className="features-highlight">
        <div className="features-container">
          <h2 className="features-title">Why Choose Dekleptocracy?</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-number">01</div>
              <h3>Data-Driven Insights</h3>
              <p>All our analysis is backed by verified data from official sources and rigorous research methodologies.</p>
            </div>
            <div className="feature-item">
              <div className="feature-number">02</div>
              <h3>User-Friendly Interface</h3>
              <p>Complex data made simple. Our intuitive design makes it easy to find the information you need.</p>
            </div>
            <div className="feature-item">
              <div className="feature-number">03</div>
              <h3>Personalized Experience</h3>
              <p>Get insights tailored to your location and preferences, making the data more relevant to you.</p>
            </div>
            <div className="feature-item">
              <div className="feature-number">04</div>
              <h3>Continuous Updates</h3>
              <p>We update our data continuously to ensure you always have access to the latest information.</p>
            </div>
            <div className="feature-item">
              <div className="feature-number">05</div>
              <h3>Transparency First</h3>
              <p>We believe in full transparency - all our sources are cited and our methodologies are explained.</p>
            </div>
            <div className="feature-item">
              <div className="feature-number">06</div>
              <h3>Free Access</h3>
              <p>Most of our features are completely free because we believe everyone deserves access to this information.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="how-it-works-container">
          <h2 className="how-it-works-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3>1. Create Your Account</h3>
              <p>Sign up in seconds and set your location preferences to get personalized insights.</p>
            </div>
            <div className="step">
              <div className="step-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <h3>2. Explore the Data</h3>
              <p>Browse reports, use our AI chatbot, or explore interactive maps to understand policy impacts.</p>
            </div>
            <div className="step">
              <div className="step-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <h3>3. Stay Informed</h3>
              <p>Get alerts about new policy changes and price impacts relevant to your area.</p>
            </div>
            <div className="step">
              <div className="step-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3>4. Share & Discuss</h3>
              <p>Share insights with your community and join the conversation about policy impacts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="services-cta">
        <div className="services-cta-container">
          <h2 className="services-cta-title">Ready to Get Started?</h2>
          <p className="services-cta-text">
            Join thousands of users who are already making informed decisions with Dekleptocracy
          </p>
          <div className="services-cta-buttons">
            <button className="cta-primary" onClick={() => navigate('/chatbot/create-account')}>
              Create Free Account
            </button>
            <button className="cta-secondary" onClick={() => navigate('/chatbot')}>
              Try AI Chatbot
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
