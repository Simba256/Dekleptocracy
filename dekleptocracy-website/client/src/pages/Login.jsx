import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loadGoogleScript, handleGoogleSignIn } from '../utils/googleAuth';
import './Login.css';

// Use proxy in development, or full URL in production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';

// Debug: Log environment variables
console.log('🔧 [Login] Environment configuration:', {
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  API_URL: API_URL,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 30)}...` : 'NOT SET',
  hasGoogleClientId: !!GOOGLE_CLIENT_ID,
  allViteEnvKeys: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
});

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
  const googleButtonRef = useRef(null);

  // Initialize Google Sign-In
  useEffect(() => {
    console.log('🔄 [Login] Google Sign-In initialization started');
    console.log('🔑 [Login] GOOGLE_CLIENT_ID available:', !!GOOGLE_CLIENT_ID);
    console.log('🎯 [Login] Button ref exists:', !!googleButtonRef.current);

    if (GOOGLE_CLIENT_ID && googleButtonRef.current) {
      console.log('✅ [Login] Prerequisites met, loading Google script...');
      loadGoogleScript().then((google) => {
        console.log('✅ [Login] Google script loaded successfully');
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            console.log('🎉 [Login] Google callback triggered');
            console.log('🎫 [Login] Response received:', response ? 'Yes' : 'No');
            setLoading(true);
            setError('');
            try {
              await handleGoogleSignIn(
                response,
                API_URL,
                (data) => {
                  console.log('✅ [Login] Sign-in successful, navigating to:', from);
                  if (data?.isNewUser) {
                    navigate('/survey', { replace: true });
                  } else {
                    navigate(from, { replace: true });
                  }
                },
                (error) => {
                  console.error('❌ [Login] Sign-in failed:', error);
                  setError(error.message || 'Google sign-in failed. Please try again.');
                  setLoading(false);
                }
              );
            } catch (error) {
              console.error('❌ [Login] Exception during sign-in:', error);
              setError(error.message || 'Google sign-in failed. Please try again.');
              setLoading(false);
            }
          },
        });

        // Render Google button
        console.log('🎨 [Login] Rendering Google button...');
        google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: '100%',
        });
        console.log('✅ [Login] Google button rendered successfully');
      }).catch((error) => {
        console.error('❌ [Login] Error loading Google script:', error);
      });
    } else {
      if (!GOOGLE_CLIENT_ID) {
        console.warn('⚠️ [Login] GOOGLE_CLIENT_ID not set');
      }
      if (!googleButtonRef.current) {
        console.warn('⚠️ [Login] Button ref not ready yet');
      }
    }
  }, [from, navigate]);

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

              <div ref={googleButtonRef} id="google-signin-button" style={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center',
                marginTop: '8px',
                minHeight: '40px'
              }}></div>
              {!GOOGLE_CLIENT_ID && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fff3cd',
                  color: '#856404',
                  borderRadius: '8px',
                  fontSize: '13px',
                  textAlign: 'left',
                  marginTop: '12px',
                  border: '1px solid #ffc107'
                }}>
                  <strong>⚠️ Google Sign-In Not Configured</strong>
                  <div style={{ marginTop: '8px', fontSize: '12px' }}>
                    <p style={{ margin: '4px 0' }}>To enable Google Sign-In:</p>
                    <ol style={{ margin: '4px 0', paddingLeft: '20px' }}>
                      <li>Create a <code>.env</code> file in the <code>client/</code> directory</li>
                      <li>Add: <code>VITE_GOOGLE_CLIENT_ID=your-client-id</code></li>
                      <li><strong>Restart the dev server</strong> (Ctrl+C then npm run dev)</li>
                    </ol>
                    <p style={{ margin: '8px 0 4px 0', fontSize: '11px', color: '#666' }}>
                      Check browser console (F12) for debug info. See ENV_SETUP.md for details.
                    </p>
                  </div>
                </div>
              )}

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
