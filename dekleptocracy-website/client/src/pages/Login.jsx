import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

// Use proxy in development, or full URL in production
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:5000');

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get the intended destination from location state, or default to chatbot
  const from = location.state?.from?.pathname || '/chatbot';

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please try again.');
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect to intended destination or chatbot after successful login
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Section - Form */}
        <div className="form-section">

          <div className="form-content">
            <h1 className="form-title">Login</h1>
            <p className="form-description">Add your credentials to log in</p>

            {/* Info Message if redirected from protected route */}
            {location.state?.from && (
              <div className="info-message" style={{
                padding: '12px 16px',
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                border: '1px solid #90caf9'
              }}>
                Please login to access the chatbot
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="error-message" style={{
                padding: '12px 16px',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                border: '1px solid #fcc'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Your email*</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password*</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    className="form-input password-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showPassword ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="checkbox-input"
                    required
                  />
                  <span className="checkbox-text">I agree to terms & conditions</span>
                </label>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="divider">
                <span>Or</span>
              </div>

              <button type="button" className="google-button">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Register with Google
              </button>

              <div className="signup-link">
                Don't have an Account? <Link to="/chatbot/create-account" className="signup-text">Sign up</Link>
              </div>
            </form>
          </div>
        </div>

        {/* Right Section - 3D Illustration */}
        <div className="illustration-section">
          <div className="robot-illustration">
            <div className="speech-bubbles">
              <div className="speech-bubble bubble-1"></div>
              <div className="speech-bubble bubble-2"></div>
              <div className="speech-bubble bubble-3"></div>
            </div>
            <div className="robot-image-container">
              <img src="/robo.jpg" alt="Friendly AI Robot" className="robot-image" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
