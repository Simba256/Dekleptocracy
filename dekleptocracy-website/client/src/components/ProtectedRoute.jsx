import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { isAuthenticated, verifyToken, logout } from '../utils/auth';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Check authentication with backend verification
    const checkAuth = async () => {
      // First check if token exists
      if (!isAuthenticated()) {
        setIsAuth(false);
        setIsLoading(false);
        return;
      }

      // Verify token with backend
      try {
        const isValid = await verifyToken();
        if (!isValid) {
          // Token is invalid, clear it
          logout();
          setIsAuth(false);
        } else {
          setIsAuth(true);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[DEV] Auth verification error:', error);
        }
        logout();
        setIsAuth(false);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="protected-route__loading">
        <div className="protected-route__spinner"></div>
        <p className="protected-route__text">Checking authentication...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  // Save the current location so we can redirect back after login
  if (!isAuth) {
    return <Navigate to="/chatbot/login" state={{ from: location }} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
