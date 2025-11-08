# Dekleptocracy Server

Backend server for the Dekleptocracy website with MongoDB database integration.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the server directory:

```env
# MongoDB Atlas Connection String
# Replace <db_password> with your actual database password
MONGODB_URI=mongodb+srv://hasankamal839_db_user:<db_password>@cluster0.fink5ub.mongodb.net/dekleptocracy?retryWrites=true&w=majority&appName=Cluster0

PORT=5000
JWT_SECRET=your-secret-key-change-in-production
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Important Notes:**
1. Replace `<db_password>` in the `MONGODB_URI` with your actual MongoDB Atlas database password.
2. Generate a secure JWT secret using: `npm run generate-secret` (see JWT Setup below)

#### Google OAuth Setup (Optional)

To enable Google Sign-In:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (see `GOOGLE_OAUTH_SETUP.md` for detailed instructions)
3. Add `GOOGLE_CLIENT_ID` to your backend `.env` file
4. Add `VITE_GOOGLE_CLIENT_ID` to your frontend `.env` file (same value)

See `GOOGLE_OAUTH_SETUP.md` in the root directory for complete setup instructions.

#### JWT Secret Setup

Generate a secure JWT secret for authentication:

1. Run the generator script:
   ```bash
   npm run generate-secret
   ```

2. Copy the generated secret

3. Add it to your `.env` file as `JWT_SECRET`

See `JWT_SETUP.md` for detailed JWT token setup and configuration.

### 3. MongoDB Setup

#### Using MongoDB Atlas (Recommended - Already Configured)

Your MongoDB Atlas connection string is already configured:
- Cluster: `cluster0.fink5ub.mongodb.net`
- Database User: `hasankamal839_db_user`
- Database Name: `dekleptocracy`

**Setup Steps:**
1. Get your database password from MongoDB Atlas
2. Replace `<db_password>` in the `MONGODB_URI` in your `.env` file with your actual password
3. The connection string format should be:
   ```
   mongodb+srv://hasankamal839_db_user:YOUR_ACTUAL_PASSWORD@cluster0.fink5ub.mongodb.net/dekleptocracy?retryWrites=true&w=majority&appName=Cluster0
   ```

**To get your password:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to "Database Access"
3. Find the user `hasankamal839_db_user`
4. Click "Edit" and then "Edit Password"
5. Either use the existing password or reset it

**Network Access:**
Make sure your IP address is whitelisted in MongoDB Atlas:
1. Go to "Network Access" in MongoDB Atlas
2. Click "Add IP Address"
3. Add your current IP or `0.0.0.0/0` for development (not recommended for production)

**Note**: This application is configured to use MongoDB Atlas. Local MongoDB is not supported. Make sure your `MONGODB_URI` is set correctly in your `.env` file.

### 4. Run the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

## API Endpoints

### Authentication

#### POST `/api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "agreeToTerms": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Response (400/409/500):**
```json
{
  "success": false,
  "message": "Error message here"
}
```

#### POST `/api/auth/google`
Login or signup with Google OAuth.

**Request Body:**
```json
{
  "credential": "google-id-token"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Google login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "picture": "profile-picture-url"
  }
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}
```

### Health Check

#### GET `/api/health`
Check server status.

**Response:**
```json
{
  "status": "ok",
  "uptime": 123.45
}
```

## Database Schema

### User Model

```javascript
{
  fullName: String (required, max 100 chars),
  email: String (required, unique, lowercase),
  password: String (required if not Google user, min 6 chars, hashed),
  googleId: String (unique, for Google OAuth users),
  isGoogleUser: Boolean (default: false),
  agreeToTerms: Boolean (required if not Google user),
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- Password hashing using bcrypt
- JWT token authentication
- Google OAuth 2.0 authentication
- Input validation
- Error handling
- CORS enabled for frontend
- Token verification for Google OAuth

## Development

- Uses Express.js for the server
- MongoDB with Mongoose ODM
- JWT for authentication
- bcryptjs for password hashing

