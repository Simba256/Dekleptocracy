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
    console.error('Error loading Google script:', error);
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
    console.error('Error rendering Google button:', error);
  });
};

// Handle Google Sign-In response
export const handleGoogleSignIn = async (response, apiUrl, onSuccess, onError) => {
  console.log('🔐 [Frontend] Google Sign-In initiated');
  console.log('📍 [Frontend] API URL:', apiUrl);
  console.log('🎫 [Frontend] Credential received:', response.credential?.substring(0, 30) + '...');

  try {
    const requestUrl = `${apiUrl}/api/auth/google`;
    console.log('📤 [Frontend] Sending request to:', requestUrl);

    const requestBody = { 
      credential: response.credential,
      preferences: loadPreferences(),
    };
    console.log('📦 [Frontend] Request body:', { credential: requestBody.credential?.substring(0, 30) + '...' });

    const res = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 [Frontend] Response status:', res.status, res.statusText);
    console.log('📥 [Frontend] Response headers:', {
      contentType: res.headers.get('content-type'),
      cors: res.headers.get('access-control-allow-origin')
    });

    const data = await res.json();
    console.log('📥 [Frontend] Response data:', data);

    if (!res.ok) {
      console.error('❌ [Frontend] Request failed:', data);
      throw new Error(data.message || 'Google sign-in failed');
    }

    // Store token in localStorage
    if (data.token) {
      console.log('💾 [Frontend] Storing token and user in localStorage');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('✅ [Frontend] Token stored successfully');
    } else {
      console.warn('⚠️ [Frontend] No token in response');
    }
    clearPreferences();

    console.log('✅ [Frontend] Google Sign-In successful');
    onSuccess(data);
  } catch (error) {
    console.error('❌ [Frontend] Google sign-in error:', error);
    console.error('❌ [Frontend] Error type:', error.constructor.name);
    console.error('❌ [Frontend] Error message:', error.message);
    if (error.stack) {
      console.error('❌ [Frontend] Stack trace:', error.stack);
    }
    onError(error);
  }
};

