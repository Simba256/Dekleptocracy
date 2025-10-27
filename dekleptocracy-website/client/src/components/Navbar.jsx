import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsInsightsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <span className="logo-bold">
              d<span className="e-with-dash">e</span>
            </span>
            <span className="logo-light">kleptocracy</span>
          </Link>

          {/* Navigation Links - Centered */}
          <div className="navbar-links-wrapper">
            <div className="navbar-links">
              <Link to="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>
                Home
              </Link>

              <Link to="/about" className={`navbar-link ${isActive('/about') ? 'active' : ''}`}>
                About Us
              </Link>

              <Link to="/reports" className={`navbar-link ${isActive('/reports') ? 'active' : ''}`}>
                Reports
              </Link>

              {/* Insights Dropdown */}
              <div className="insights-dropdown">
                <button
                  onClick={() => setIsInsightsOpen(!isInsightsOpen)}
                  className={`insights-button ${location.pathname.includes('/insights') ? 'active' : ''}`}
                >
                  <span>Insights</span>
                  <svg
                    className={`dropdown-icon ${isInsightsOpen ? 'open' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isInsightsOpen && (
                  <div className="dropdown-menu">
                    <Link
                      to="/insights"
                      onClick={() => setIsInsightsOpen(false)}
                      className="dropdown-link"
                    >
                      All Insights
                    </Link>
                    <Link
                      to="/insights/articles"
                      onClick={() => setIsInsightsOpen(false)}
                      className="dropdown-link"
                    >
                      Articles
                    </Link>
                    <Link
                      to="/insights/research"
                      onClick={() => setIsInsightsOpen(false)}
                      className="dropdown-link"
                    >
                      Research
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/chatbot" className={`navbar-link ${isActive('/chatbot') ? 'active' : ''}`}>
                Chatbot
              </Link>

              <Link to="/contact" className={`navbar-link ${isActive('/contact') ? 'active' : ''}`}>
                Contact Us
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className={`hamburger-icon ${isMobileMenuOpen ? 'open' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Profile Avatar */}
          <div className="profile-container">
            <div className="profile-avatar">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                alt="Profile"
              />
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-overlay" onClick={closeMobileMenu}>
            <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
              <Link 
                to="/" 
                className={`mobile-menu-link ${isActive('/') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Home
              </Link>

              <Link 
                to="/about" 
                className={`mobile-menu-link ${isActive('/about') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                About Us
              </Link>

              <Link 
                to="/reports" 
                className={`mobile-menu-link ${isActive('/reports') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Reports
              </Link>

              {/* Mobile Insights Section */}
              <div className="mobile-insights-section">
                <button
                  onClick={() => setIsInsightsOpen(!isInsightsOpen)}
                  className={`mobile-menu-link ${location.pathname.includes('/insights') ? 'active' : ''}`}
                >
                  <span>Insights</span>
                  <svg
                    className={`mobile-dropdown-icon ${isInsightsOpen ? 'open' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isInsightsOpen && (
                  <div className="mobile-dropdown-items">
                    <Link
                      to="/insights"
                      onClick={closeMobileMenu}
                      className="mobile-dropdown-link"
                    >
                      All Insights
                    </Link>
                    <Link
                      to="/insights/articles"
                      onClick={closeMobileMenu}
                      className="mobile-dropdown-link"
                    >
                      Articles
                    </Link>
                    <Link
                      to="/insights/research"
                      onClick={closeMobileMenu}
                      className="mobile-dropdown-link"
                    >
                      Research
                    </Link>
                  </div>
                )}
              </div>

              <Link 
                to="/chatbot" 
                className={`mobile-menu-link ${isActive('/chatbot') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Chatbot
              </Link>

              <Link 
                to="/contact" 
                className={`mobile-menu-link ${isActive('/contact') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Contact Us
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

