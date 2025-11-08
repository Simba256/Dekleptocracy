# Environment Variables Setup Guide

This guide explains how to set up environment variables for the client (frontend) application.

## Location of .env File

Create a `.env` file in the `client/` directory (same level as `package.json`):

```
dekleptocracy-website/
  client/
    .env          ← Create this file here
    package.json
    src/
    ...
```

## Required Environment Variables

### VITE_GOOGLE_CLIENT_ID

Your Google OAuth Client ID from Google Cloud Console.

**Format:**
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Important Notes:**
- **No quotes**: Don't use quotes around the value
- **No spaces**: No spaces before or after the `=`
- **Exact name**: Must be exactly `VITE_GOOGLE_CLIENT_ID` (Vite requires `VITE_` prefix)
- **Restart server**: You MUST restart the dev server after adding/changing this variable

### VITE_API_URL (Optional)

The backend API URL. In development, this is optional as Vite proxy is configured.

```env
VITE_API_URL=http://localhost:5000
```

## Example .env File

Create `client/.env` with:

```env
# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com

# API URL (optional for development)
VITE_API_URL=http://localhost:5000
```

## Troubleshooting

### Issue: "Google Sign-In is not configured" message appears

**Possible Causes:**

1. **.env file not in the correct location**
   - Make sure `.env` is in the `client/` directory
   - Not in `client/src/` or root directory

2. **Dev server not restarted**
   - **CRITICAL**: Vite only reads `.env` files when the dev server starts
   - Stop the dev server (Ctrl+C)
   - Start it again: `npm run dev`

3. **Incorrect variable name**
   - Must be exactly: `VITE_GOOGLE_CLIENT_ID`
   - Case-sensitive
   - Must start with `VITE_`

4. **Spaces or quotes in value**
   ```env
   # ❌ WRONG - has quotes
   VITE_GOOGLE_CLIENT_ID="your-client-id"
   
   # ❌ WRONG - has spaces
   VITE_GOOGLE_CLIENT_ID = your-client-id
   
   # ✅ CORRECT - no quotes, no spaces
   VITE_GOOGLE_CLIENT_ID=your-client-id
   ```

5. **.env file not being read**
   - Check browser console for debug logs
   - Look for "Environment variables" log message
   - Verify the variable appears in the log

### How to Verify

1. **Check browser console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for "Environment variables" log
   - Check if `hasGoogleClientId` is `true`

2. **Check .env file:**
   ```bash
   # In client/ directory
   cat .env
   # or on Windows
   type .env
   ```

3. **Verify variable name:**
   - Open `.env` file
   - Make sure it says exactly: `VITE_GOOGLE_CLIENT_ID=...`
   - No typos, no extra spaces

### Steps to Fix

1. **Create/Update .env file:**
   ```bash
   cd client
   # Create .env file (if it doesn't exist)
   # Add: VITE_GOOGLE_CLIENT_ID=your-client-id
   ```

2. **Verify file location:**
   ```
   client/
     .env          ← Should be here
     package.json
     src/
   ```

3. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   # Then start again
   npm run dev
   ```

4. **Check browser console:**
   - Refresh the page
   - Check console for environment variable logs
   - Verify Google button appears

### Common Mistakes

1. **Wrong directory:**
   - Putting `.env` in root instead of `client/`
   - Putting `.env` in `client/src/` instead of `client/`

2. **Wrong variable name:**
   - Using `GOOGLE_CLIENT_ID` instead of `VITE_GOOGLE_CLIENT_ID`
   - Missing `VITE_` prefix

3. **Not restarting server:**
   - Vite only reads `.env` on startup
   - Must restart after changing `.env`

4. **Quotes around value:**
   - Vite includes quotes as part of the value
   - Don't use quotes

5. **Spaces around `=` sign:**
   - `VITE_GOOGLE_CLIENT_ID = value` (wrong)
   - `VITE_GOOGLE_CLIENT_ID=value` (correct)

## Testing

After setting up:

1. Restart dev server
2. Go to login or signup page
3. Check browser console for logs
4. Google Sign-In button should appear
5. No warning message should be shown

## Production

For production deployment:

1. Set environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Use the same variable names: `VITE_GOOGLE_CLIENT_ID`
3. No need for `.env` file in production (use platform's env vars)

## Debug Mode

The application logs environment variables in development mode. Check the browser console to see:
- Whether `VITE_GOOGLE_CLIENT_ID` is set
- What value it has (first 20 characters)
- All available `VITE_` environment variables

