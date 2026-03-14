// Google OAuth utility functions
import { clearPreferences, loadPreferences } from './preferences';

// Load Google Identity Services script
export const loadGoogleScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google) {
      resolve(window.google);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(script);
  });
};

// Initialize Google Sign-In
export const initializeGoogleSignIn = (clientId, callback) => {
  loadGoogleScript().then((google) => {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: callback,
    });
  }).catch((error) => {
    if (import.meta.env.DEV) {
      console.error('[DEV] Error loading Google script:', error);
    }
  });
};

// Render Google Sign-In button
export const renderGoogleButton = (elementId, clientId, callback, text = 'signin_with') => {
  loadGoogleScript().then((google) => {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: callback,
    });

    google.accounts.id.renderButton(
      document.getElementById(elementId),
      {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: text,
        width: '100%',
      }
    );
  }).catch((error) => {
    if (import.meta.env.DEV) {
      console.error('[DEV] Error rendering Google button:', error);
    }
  });
};

// Handle Google Sign-In response
export const handleGoogleSignIn = async (response, apiUrl, onSuccess, onError) => {
  try {
    const requestUrl = `${apiUrl}/api/auth/google`;

    const requestBody = {
      credential: response.credential,
      preferences: loadPreferences(),
    };

    const res = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Google sign-in failed');
    }

    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    clearPreferences();

    onSuccess(data);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[DEV] Google sign-in error:', error);
    }
    onError(error);
  }
};

