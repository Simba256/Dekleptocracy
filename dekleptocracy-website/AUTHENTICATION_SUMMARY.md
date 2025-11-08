# Authentication Summary

The Dekleptocracy application supports **both Email/Password and Google OAuth** authentication for both **login and signup**.

## Authentication Methods

### 1. Email/Password Authentication

#### Signup (`/chatbot/create-account`)
- User fills out form with:
  - Full Name
  - Email
  - Password (minimum 6 characters)
  - Agree to terms & conditions
- Account is created in MongoDB
- Password is hashed with bcrypt
- JWT token is generated and returned
- User is redirected to chatbot

#### Login (`/chatbot/login`)
- User enters:
  - Email
  - Password
- Credentials are verified
- JWT token is generated and returned
- User is redirected to chatbot

### 2. Google OAuth Authentication

#### How It Works
Google OAuth **automatically handles both signup and login** using a single endpoint:

1. **New User (Signup)**:
   - User clicks "Sign in with Google"
   - Google authentication popup appears
   - User authorizes the application
   - Backend creates new account automatically
   - JWT token is generated
   - User is redirected to chatbot

2. **Existing User (Login)**:
   - User clicks "Sign in with Google"
   - Google authentication popup appears
   - User authorizes the application
   - Backend finds existing account by Google ID
   - JWT token is generated
   - User is redirected to chatbot

3. **Account Linking**:
   - If user has an email/password account with the same email
   - Google account is automatically linked
   - User can now login with either method
   - Existing account data is preserved

## User Flow

### Signup Page (`/chatbot/create-account`)
```
┌─────────────────────────────────────┐
│   Create Account Form               │
│                                     │
│   [Email/Password Form]             │
│   - Full Name                       │
│   - Email                           │
│   - Password                        │
│   - Terms Checkbox                  │
│   [Sign up Button]                  │
│                                     │
│   ────────── Or ──────────          │
│                                     │
│   [Google Sign-Up Button]           │
│                                     │
│   [Already have account? Login]     │
└─────────────────────────────────────┘
```

### Login Page (`/chatbot/login`)
```
┌─────────────────────────────────────┐
│   Login Form                        │
│                                     │
│   [Email/Password Form]             │
│   - Email                           │
│   - Password                        │
│   - Terms Checkbox                  │
│   [Login Button]                    │
│                                     │
│   ────────── Or ──────────          │
│                                     │
│   [Google Sign-In Button]           │
│                                     │
│   [Don't have account? Sign up]     │
└─────────────────────────────────────┘
```

## Database Schema

Users can have:
- **Email/Password account**: `password` field, `isGoogleUser: false`
- **Google account**: `googleId` field, `isGoogleUser: true`, no password
- **Both methods**: User can link Google to existing email account

## API Endpoints

### `POST /api/auth/signup`
- Creates new email/password account
- Requires: `fullName`, `email`, `password`, `agreeToTerms`
- Returns: JWT token and user data

### `POST /api/auth/login`
- Authenticates email/password account
- Requires: `email`, `password`
- Returns: JWT token and user data

### `POST /api/auth/google`
- Handles Google OAuth (both signup and login)
- Requires: `credential` (Google ID token)
- Returns: JWT token and user data
- Automatically:
  - Creates new account if user doesn't exist
  - Logs in if user exists with Google ID
  - Links Google account if user exists with same email

## Security Features

- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ JWT token authentication (7-day expiration)
- ✅ Google OAuth token verification
- ✅ Email uniqueness validation
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ Protected routes (chatbot requires authentication)

## User Experience

### Scenario 1: New User
1. User visits signup page
2. Can choose:
   - Fill out email/password form → Sign up
   - Click Google button → Sign up with Google
3. Account is created
4. Redirected to chatbot

### Scenario 2: Existing User
1. User visits login page
2. Can choose:
   - Enter email/password → Login
   - Click Google button → Login with Google
3. Authenticated
4. Redirected to chatbot

### Scenario 3: Account Linking
1. User has email/password account (e.g., `user@example.com`)
2. User signs in with Google using same email
3. System automatically links Google account
4. User can now login with either method

## Configuration

### Required Environment Variables

**Backend** (`server/.env`):
```env
MONGODB_URI=mongodb://localhost:27017/dekleptocracy
PORT=5000
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Frontend** (`client/.env`):
```env
VITE_API_URL=http://localhost:5000  # Optional, uses proxy in dev
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Testing

### Test Email/Password Signup
1. Go to `/chatbot/create-account`
2. Fill out form
3. Submit
4. Should create account and redirect to chatbot

### Test Email/Password Login
1. Go to `/chatbot/login`
2. Enter credentials
3. Submit
4. Should authenticate and redirect to chatbot

### Test Google Signup
1. Go to `/chatbot/create-account`
2. Click Google button
3. Authorize with Google
4. Should create account and redirect to chatbot

### Test Google Login
1. Go to `/chatbot/login`
2. Click Google button
3. Authorize with Google
4. Should authenticate and redirect to chatbot

### Test Account Linking
1. Create account with email/password
2. Logout
3. Login with Google using same email
4. Google account should be linked
5. Can now login with either method

## Notes

- Google OAuth is optional - email/password works without it
- Users can use either method independently
- Accounts are automatically linked if same email is used
- Google users don't need a password
- All authenticated users get the same JWT token format
- Chatbot is protected and requires authentication

