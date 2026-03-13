# API Documentation

This document describes the backend API endpoints used by the Dekleptocracy client application.

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:5000` |
| Production | `https://node-server-production-7f39.up.railway.app` |

The base URL is configured via environment variables:
- `VITE_API_URL` for development
- `VITE_API_URL_PRODUCTION` for production

## Authentication

Most endpoints support optional authentication via Bearer token.

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Token Storage

Tokens are stored in `localStorage`:
- `token` - JWT access token
- `user` - Serialized user object

---

## Auth Endpoints

### POST `/api/auth/login`

Authenticate user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "fullName": "John Doe",
    "profilePhoto": "/uploads/avatar.jpg"
  }
}
```

### POST `/api/auth/register`

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

### POST `/api/auth/google`

Authenticate using Google OAuth credential.

**Request:**
```json
{
  "credential": "google_id_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "user@gmail.com",
    "fullName": "John Doe",
    "profilePhoto": "https://lh3.googleusercontent.com/..."
  }
}
```

### GET `/api/auth/verify`

Verify if current token is valid.

**Headers:** Requires `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com"
  }
}
```

---

## User Endpoints

### GET `/api/user/profile`

Get current user's profile.

**Headers:** Requires `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "fullName": "John Doe",
    "profilePhoto": "/uploads/avatar.jpg",
    "preferences": {
      "state": "California",
      "notifications": true
    }
  }
}
```

### PUT `/api/user/preferences`

Update user preferences.

**Headers:** Requires `Authorization: Bearer <token>`

**Request:**
```json
{
  "state": "Texas",
  "notifications": false,
  "theme": "dark"
}
```

**Response:**
```json
{
  "success": true,
  "preferences": {
    "state": "Texas",
    "notifications": false,
    "theme": "dark"
  }
}
```

---

## Homepage Endpoints

### GET `/api/homepage/all`

Fetch all homepage data in a single request (recommended for initial load).

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `state` | string | `nationwide` | State name or "nationwide" |
| `period` | string | `YoY` | Time period: "YoY", "3 months", "30 days" |

**Response:**
```json
{
  "success": true,
  "data": {
    "walletShocks": [...],
    "costDrivers": [...],
    "stats": {...},
    "stateComparisons": [...],
    "socialPosts": [...],
    "quickQuestions": [...],
    "timelineConfig": {...}
  }
}
```

### GET `/api/homepage/wallet-shocks`

Get price shock notifications.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `state` | string | `nationwide` | State filter |
| `limit` | number | `4` | Number of results |
| `sortBy` | string | `date` | Sort: "date", "change", "abs-change" |

**Response:**
```json
{
  "success": true,
  "shocks": [
    {
      "id": "shock_1",
      "item": "Eggs",
      "category": "groceries",
      "change": 42.5,
      "icon": "🥚",
      "timestamp": "2024-01-15T10:00:00Z",
      "reactions": {
        "shock": 124,
        "angry": 89,
        "sad": 45
      }
    }
  ]
}
```

### GET `/api/homepage/cost-drivers`

Get cost driver breakdown by category.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `state` | string | `nationwide` | State filter |
| `period` | string | `YoY` | Time period |

**Response:**
```json
{
  "success": true,
  "drivers": [
    {
      "category": "Housing",
      "change": 15.2,
      "contribution": 35,
      "icon": "🏠"
    },
    {
      "category": "Food",
      "change": 8.7,
      "contribution": 25,
      "icon": "🍎"
    }
  ]
}
```

### GET `/api/homepage/stats`

Get summary statistics.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `state` | string | `nationwide` | State filter |

**Response:**
```json
{
  "success": true,
  "stats": {
    "avgPriceChange": 12.5,
    "topCategory": "Housing",
    "affectedProducts": 1250,
    "dataLastUpdated": "2024-01-15T10:00:00Z"
  }
}
```

### GET `/api/homepage/map-data`

Get choropleth map data for all states.

**Response:**
```json
{
  "success": true,
  "states": [
    {
      "name": "California",
      "code": "CA",
      "priceImpact": 18.5,
      "costOfLiving": 142,
      "intensity": 75,
      "topShocks": [
        {
          "item": "Gas",
          "change": 25.3,
          "icon": "⛽"
        }
      ]
    }
  ]
}
```

---

## Chatbot Endpoint

### POST `/api/chatbot`

Send a message to the AI chatbot.

**Headers:** Optionally accepts `Authorization: Bearer <token>` for personalized responses.

**Request:**
```json
{
  "message": "Why are eggs so expensive?",
  "context": {
    "state": "California",
    "previousMessages": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Egg prices have increased significantly due to...",
  "sources": [
    {
      "title": "USDA Price Report",
      "url": "https://..."
    }
  ],
  "relatedQuestions": [
    "What other grocery items have increased?",
    "How does California compare to other states?"
  ]
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Caching Strategy

The client implements a caching strategy for API responses:

1. **In-Memory Cache**: Short-lived cache for repeated requests within a session
2. **LocalStorage**: Persisted cache for offline fallback
3. **Cache Keys**: Based on endpoint + query parameters

### Cache Durations

| Endpoint | Duration |
|----------|----------|
| `/api/homepage/all` | 5 minutes |
| `/api/homepage/map-data` | 15 minutes |
| `/api/user/profile` | Session |
| `/api/auth/*` | No cache |

---

## Rate Limiting

API requests are rate-limited:
- **Anonymous**: 100 requests/minute
- **Authenticated**: 300 requests/minute

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705320000
```
