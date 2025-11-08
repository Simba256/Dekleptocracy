# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Dekleptocracy application.

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

## Step 2: Create OAuth 2.0 Client ID

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (unless you have a Google Workspace account)
   - Fill in the required information (app name, user support email, etc.)
   - Add your email to test users (for testing)
   - Save and continue

4. Create OAuth client ID:
   - Application type: "Web application"
   - Name: "Dekleptocracy"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs:
     - `http://localhost:5173` (for development)
     - Your production domain
   - Click "Create"

5. Copy the Client ID (you'll need this for both frontend and backend)

## Step 3: Configure Backend

Add the Google Client ID to your backend `.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Step 4: Configure Frontend

Add the Google Client ID to your frontend `.env` file (in `client/` directory):

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Note:** Make sure the Client ID is the same in both frontend and backend `.env` files.

## Step 5: Install Dependencies

The required packages are already in `package.json`. Just run:

```bash
# Backend
cd server
npm install

# Frontend dependencies should already be installed
```

## Step 6: Test Google Sign-In

1. Start your backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start your frontend:
   ```bash
   cd client
   npm run dev
   ```

3. Navigate to the login or signup page
4. You should see a Google Sign-In button
5. Click it and sign in with your Google account
6. You should be redirected to the chatbot after successful authentication

## Troubleshooting

### Google Sign-In button doesn't appear
- Check that `VITE_GOOGLE_CLIENT_ID` is set in your frontend `.env` file
- Check the browser console for errors
- Make sure the Google script is loading (check Network tab)

### "Invalid Google token" error
- Verify that `GOOGLE_CLIENT_ID` is set correctly in your backend `.env` file
- Make sure the Client ID matches between frontend and backend
- Check that the authorized JavaScript origins include your current domain

### "Google OAuth is not configured" error
- Make sure `GOOGLE_CLIENT_ID` is set in your backend `.env` file
- Restart your backend server after adding the environment variable

### Redirect URI mismatch
- Make sure your current domain (including port) is added to "Authorized JavaScript origins" in Google Cloud Console
- For localhost development, use `http://localhost:5173`
- For production, use your full production URL

## Production Deployment

When deploying to production:

1. Update the authorized JavaScript origins in Google Cloud Console to include your production domain
2. Update the authorized redirect URIs to include your production domain
3. Make sure both frontend and backend environment variables are set correctly
4. The Client ID can be the same for both development and production, or you can create separate OAuth clients

## Security Notes

- Never commit your `.env` files to version control
- Keep your Google Client ID secure
- Use environment variables for all sensitive configuration
- Regularly rotate your OAuth credentials if compromised

