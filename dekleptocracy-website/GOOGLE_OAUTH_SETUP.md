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
   - **Authorized JavaScript origins** (CRITICAL - must match your app's URL exactly):
     - Click "+ ADD URI"
     - Add `http://localhost:5173` (for development - Vite default port)
     - **Important:** If your app runs on a different port, use that port instead
     - For production: Add your production domain (e.g., `https://yourdomain.com`)
     - **Note:** No trailing slashes, include protocol and port
   - **Authorized redirect URIs:**
     - Click "+ ADD URI"
     - Add `http://localhost:5173` (for development)
     - For production: Add your production domain
   - Click "Create"

**⚠️ IMPORTANT:** The "Authorized JavaScript origins" must **exactly** match the URL in your browser's address bar, including:

- Protocol: `http://` or `https://`
- Domain: `localhost` or your domain
- Port: `:5173` (or whatever port your app uses)
- **NO trailing slash** (`/`)

If you get a "no registered origin" error, double-check this section!

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

### Error: "no registered origin" or "Error 401: invalid_client"

**This is the most common error!** It means your app's URL is not registered in Google Cloud Console.

**Fix Steps:**

1. **Find your app's exact URL:**
   - Look at your browser's address bar when the app is running
   - Common development URLs:
     - `http://localhost:5173` (Vite default)
     - `http://localhost:3000` (if using Create React App)
     - `http://127.0.0.1:5173` (alternative localhost format)

2. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Select your project
   - Go to "APIs & Services" → "Credentials"
   - Click on your OAuth 2.0 Client ID

3. **Add Authorized JavaScript origins:**
   - Scroll down to "Authorized JavaScript origins"
   - Click "+ ADD URI"
   - Add **EXACTLY** the URL from step 1 (e.g., `http://localhost:5173`)
   - **Important:**
     - Include the protocol (`http://` or `https://`)
     - Include the port number (`:5173`)
     - NO trailing slash (`/`)
     - For localhost, use `http://localhost:5173` OR `http://127.0.0.1:5173` (add both if needed)

4. **Save the changes:**
   - Click "SAVE" at the bottom
   - **Wait 1-2 minutes** for changes to propagate (Google says it can take up to 5 minutes)

5. **Clear browser cache and try again:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache for localhost

6. **Verify your Client ID is correct:**
   - Make sure `VITE_GOOGLE_CLIENT_ID` in `client/.env` matches the Client ID in Google Cloud Console
   - Make sure `GOOGLE_CLIENT_ID` in `server/.env` matches the same Client ID
   - Restart both frontend and backend servers after changing `.env` files

**Common Mistakes:**

- ❌ Missing port number: `http://localhost` (wrong)
- ✅ Correct: `http://localhost:5173`
- ❌ Using `https://` for localhost: `https://localhost:5173` (wrong for local dev)
- ✅ Correct: `http://localhost:5173`
- ❌ Trailing slash: `http://localhost:5173/` (wrong)
- ✅ Correct: `http://localhost:5173`
- ❌ Wrong Client ID: Using a different project's Client ID
- ✅ Correct: Use the exact Client ID from your OAuth 2.0 credentials

### Google Sign-In button doesn't appear

- Check that `VITE_GOOGLE_CLIENT_ID` is set in your frontend `.env` file
- Check the browser console for errors
- Make sure the Google script is loading (check Network tab)
- **Restart your dev server** after adding the environment variable

### "Invalid Google token" error

- Verify that `GOOGLE_CLIENT_ID` is set correctly in your backend `.env` file
- Make sure the Client ID matches between frontend and backend
- Check that the authorized JavaScript origins include your current domain
- Verify the token hasn't expired (try signing in again)

### "Google OAuth is not configured" error

- Make sure `GOOGLE_CLIENT_ID` is set in your backend `.env` file
- Restart your backend server after adding the environment variable
- Check server console for error messages

### Redirect URI mismatch

- Make sure your current domain (including port) is added to "Authorized JavaScript origins" in Google Cloud Console
- For localhost development, use `http://localhost:5173`
- For production, use your full production URL (e.g., `https://yourdomain.com`)

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
