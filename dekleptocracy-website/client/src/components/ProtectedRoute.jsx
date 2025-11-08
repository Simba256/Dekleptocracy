import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, verifyToken, logout } from '../utils/auth';

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
        console.error('Auth verification error:', error);
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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #ff6b35',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#666' }}>Checking authentication...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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

export default ProtectedRoute;

