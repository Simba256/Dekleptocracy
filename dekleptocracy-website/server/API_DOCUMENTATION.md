# Homepage API Documentation

Base URL: `http://localhost:5000` (development) or your production domain

All endpoints support optional JWT authentication via `Authorization: Bearer <token>` header.

---

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

---

## Endpoints

### 1. Get Wallet Shocks

**GET** `/api/homepage/wallet-shocks`

Returns price shock data for specific categories (groceries, fuel, utilities, tech).

**Query Parameters:**

- `state` (optional, string): State name (e.g., "California", "Texas"). Defaults to user preference or "nationwide"
- `limit` (optional, number): Number of results. Default: 4

**Response:**

```json
{
  "success": true,
  "state": "California",
  "shocks": [
    {
      "_id": "...",
      "category": "fuel",
      "icon": "⛽",
      "iconBg": "#fef3c7",
      "title": "Gas prices reach $5.48/gal in California...",
      "price": "$5.48",
      "unit": "per gallon",
      "change": "+1.1%",
      "changePercent": 1.1,
      "chartColor": "#ef4444",
      "chartPath": "M 0.0 32.0 L 40.0 24.9...",
      "chartData": [
        {"date": "2025-07-10T...", "value": 4.88},
        ...
      ],
      "reactions": {"shock": 16, "angry": 6, "sad": 6},
      "state": "California",
      "status": "published",
      "dataDate": "2025-12-10T..."
    }
  ]
}
```

---

### 2. Get Cost Drivers

**GET** `/api/homepage/cost-drivers`

Returns breakdown of factors contributing to price increases.

**Query Parameters:**

- `state` (optional, string): State name. Defaults to user preference or "nationwide"
- `period` (optional, string): Time period - "YoY", "3 months", "30 days". Default: "YoY"

**Response:**

```json
{
  "success": true,
  "state": "California",
  "period": "YoY",
  "drivers": [
    {
      "label": "Tariffs",
      "percentage": 37.2,
      "color": "#3E5132",
      "type": "direct",
      "displayOrder": 0
    },
    {
      "label": "Fuels",
      "percentage": 25.6,
      "color": "#7C2D12",
      "type": "direct",
      "displayOrder": 1
    }
    ...
  ]
}
```

---

### 3. Get Stats Summary

**GET** `/api/homepage/stats`

Returns summary statistics (lobbying cases, consumer costs, contributions, tariff revenue).

**Query Parameters:**

- `state` (optional, string): State name. Defaults to user preference or "nationwide"

**Response:**

```json
{
  "success": true,
  "state": "California",
  "stats": {
    "lobbying": {
      "statType": "lobbying",
      "value": 45000,
      "displayValue": "45K",
      "change": -10.18,
      "changeDisplay": "-10.18%",
      "changeDirection": "down",
      "subtitle": "tracked since 2020",
      "chartData": [
        {"label": "M", "value": 39629.52, "date": "2025-12-04T..."},
        ...
      ]
    },
    "consumerCost": {...},
    "contributions": {...},
    "tariffRevenue": {...}
  }
}
```

---

### 4. Get Available States

**GET** `/api/homepage/available-states`

Returns list of states with published data.

**Response:**

```json
{
  "success": true,
  "states": ["Arizona", "California", "Florida", "New York", "Texas", "nationwide"]
}
```

---

### 5. Add Reaction to Wallet Shock

**POST** `/api/homepage/wallet-shocks/:id/react`

Increment reaction count for a wallet shock.

**URL Parameters:**

- `id` (required, string): Wallet shock MongoDB ObjectId

**Request Body:**

```json
{
  "reactionType": "shock" | "angry" | "sad"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Reaction added successfully",
  "reactions": {
    "shock": 17,
    "angry": 6,
    "sad": 6
  }
}
```

---

### 6. Get Scheduler Status

**GET** `/api/homepage/scheduler/status`

Returns status of the data generation scheduler.

**Response:**

```json
{
  "isRunning": false,
  "schedule": "Every 6 hours",
  "timezone": "America/New_York",
  "note": "Scheduler not implemented yet. Using manual seeding."
}
```

---

### 7. Trigger Manual Seed (Development Only)

**POST** `/api/homepage/seed`

Manually triggers seed data generation. Useful for development/testing.

**Response:**

```json
{
  "success": true,
  "message": "Seeding initiated. Check server logs for progress."
}
```

**Note:** This endpoint runs seed script asynchronously. Check server logs for completion status.

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development only)"
}
```

**HTTP Status Codes:**

- `200` - Success
- `400` - Bad request (invalid parameters)
- `404` - Resource not found
- `429` - Rate limit exceeded
- `500` - Server error

---

## Authentication (Optional)

Endpoints support optional JWT authentication. When authenticated:

- User preferences (selected state, time period) are automatically applied
- Reactions are attributed to the user
- Future features may require authentication

**Header Format:**

```
Authorization: Bearer <your-jwt-token>
```

**Getting a token:**
Use the existing auth endpoints:

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login and receive token

---

## Examples

### cURL Examples

```bash
# Get wallet shocks for California
curl "http://localhost:5000/api/homepage/wallet-shocks?state=California&limit=4"

# Get cost drivers with authentication
curl "http://localhost:5000/api/homepage/cost-drivers?state=Texas&period=YoY" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Add a reaction
curl -X POST "http://localhost:5000/api/homepage/wallet-shocks/SHOCK_ID/react" \
  -H "Content-Type: application/json" \
  -d '{"reactionType": "shock"}'

# Get available states
curl "http://localhost:5000/api/homepage/available-states"
```

### JavaScript Fetch Examples

```javascript
// Get wallet shocks
const response = await fetch('http://localhost:5000/api/homepage/wallet-shocks?state=California');
const data = await response.json();

// With authentication
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:5000/api/homepage/cost-drivers', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Add reaction
await fetch(`http://localhost:5000/api/homepage/wallet-shocks/${shockId}/react`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ reactionType: 'shock' }),
});
```

---

## Database Models

### WalletShock

- Indexed on: `{state, category, status, dataDate}`
- Unique constraint: One entry per state + category combination

### CostDriver

- Indexed on: `{state, timePeriod, category, status}`
- Ordered by: `displayOrder` field

### StatsSummary

- Indexed on: `{statType, state, status, dataDate}`
- Types: lobbying, consumer-cost, contributions, tariff-revenue

---

## Performance Notes

- All queries use MongoDB indexes for fast lookups
- Average response time: < 100ms
- Data updates: Every 6 hours via scheduler (Phase 2)
- Cache headers: Not yet implemented (future enhancement)

---

## Future Enhancements (Phase 2-3)

- [ ] Real-time data generation from MCP server
- [ ] Redis caching layer
- [ ] WebSocket support for live updates
- [ ] GraphQL endpoint
- [ ] Pagination for large result sets
- [ ] Advanced filtering (date ranges, categories)
- [ ] Data export (CSV, PDF)
