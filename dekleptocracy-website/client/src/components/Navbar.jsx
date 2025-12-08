import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isAuthenticated, logout } from '../utils/auth';
import './Navbar.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Navbar = () => {
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      
      if (authenticated) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            setUserProfile(user);
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
      } else {
        setUserProfile(null);
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 1500);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Close dropdown on Escape and on route change
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsInsightsOpen(false);
  };

  const toggleProfileDropdown = useCallback(() => {
    setIsProfileDropdownOpen(prev => !prev);
    setIsInsightsOpen(false);
  }, []);

  const closeProfileDropdown = () => {
    setIsProfileDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    navigate('/');
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
                  <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
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

          {/* Profile Avatar with Dropdown */}
          <div className="profile-container" ref={profileMenuRef}>
            <button 
              className="profile-avatar-button"
              onClick={toggleProfileDropdown}
              aria-label="Profile menu"
              aria-expanded={isProfileDropdownOpen}
              aria-controls="profile-dropdown-menu"
              type="button"
            >
              <div className="profile-avatar">
                {isLoggedIn && userProfile?.profilePhoto ? (
                  <img
                    src={userProfile.profilePhoto.startsWith('http') 
                      ? userProfile.profilePhoto 
                      : `${API_URL}/${userProfile.profilePhoto}`}
                    alt="Profile"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.fullName || 'User')}&background=ff6b35&color=fff&size=128`;
                    }}
                  />
                ) : isLoggedIn ? (
                  <div className="profile-avatar-initials">
                    {(userProfile?.fullName || 'U').charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="profile-avatar-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                )}
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div
                id="profile-dropdown-menu"
                className="profile-dropdown-menu"
              >
                {isLoggedIn ? (
                  <>
                    <Link 
                      to="/dashboard" 
                      className="profile-dropdown-link"
                      onClick={closeProfileDropdown}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/profile" 
                      className="profile-dropdown-link"
                      onClick={closeProfileDropdown}
                    >
                      My Profile
                    </Link>
                    <button 
                      className="profile-dropdown-link logout-button"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/chatbot/login" 
                      className="profile-dropdown-link"
                      onClick={closeProfileDropdown}
                    >
                      Login
                    </Link>
                    <Link 
                      to="/chatbot/create-account" 
                      className="profile-dropdown-link"
                      onClick={closeProfileDropdown}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            )}
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
                to="/dashboard" 
                className={`mobile-menu-link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Dashboard
              </Link>

              <Link 
                to="/contact" 
                className={`mobile-menu-link ${isActive('/contact') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Contact Us
              </Link>

              {/* Mobile Profile/Login Link */}
              {isLoggedIn ? (
                <Link 
                  to="/profile" 
                  className={`mobile-menu-link ${isActive('/profile') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  My Profile
                </Link>
              ) : (
                <Link 
                  to="/chatbot/login" 
                  className={`mobile-menu-link ${isActive('/chatbot/login') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
