# Dekleptocracy Server

Backend server for the Dekleptocracy website with MongoDB database integration.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the server directory (see `.env.example` for reference):

```env
MONGODB_URI=mongodb://localhost:27017/dekleptocracy
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
```

### 3. MongoDB Setup

#### Option A: Local MongoDB

1. Install MongoDB locally: https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/dekleptocracy`

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string from Atlas dashboard
4. Update `MONGODB_URI` in `.env` file

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
  password: String (required, min 6 chars, hashed),
  agreeToTerms: Boolean (required),
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- Password hashing using bcrypt
- JWT token authentication
- Input validation
- Error handling
- CORS enabled for frontend

## Development

- Uses Express.js for the server
- MongoDB with Mongoose ODM
- JWT for authentication
- bcryptjs for password hashing

