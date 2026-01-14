# State Reports Quick Start Guide

This guide will help you get the real-data state reports feature up and running.

---

## Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB (already configured)
- MCP Server running

---

## Step 1: Get API Keys (15-30 minutes)

You need at minimum **3 API keys** for basic functionality:

### Required (Free, Instant Registration):

1. **BLS API Key** (unemployment data)
   - Go to: https://www.bls.gov/developers/home.htm
   - Click "Registration" → Fill form → Check email

2. **FRED API Key** (economic data)
   - Go to: https://fred.stlouisfed.org/
   - Create account → My Account → API Keys → Request Key

3. **EIA API Key** (energy prices)
   - Go to: https://www.eia.gov/opendata/register.php
   - Fill form → Check email

### Optional (Takes 1-2 days):

4. **HUD API Token** (rent data)
   - Go to: https://www.huduser.gov/hudapi/public/register
   - Requires manual approval

---

## Step 2: Configure Environment

### MCP Server (`mcp_server/.env`):

```bash
# Copy the example file
cp mcp_server/.env.example mcp_server/.env

# Edit and add your keys
nano mcp_server/.env
```

Add your keys:
```
BLS_API_KEY=your_bls_key_here
FRED_API_KEY=your_fred_key_here
EIA_API_KEY=your_eia_key_here
HUD_API_TOKEN=your_hud_token_here  # Optional
```

---

## Step 3: Start the Servers

### Terminal 1 - MCP Server:
```bash
cd mcp_server
pip install -r requirements.txt  # If not already done
python http_server.py
```

### Terminal 2 - Backend Server:
```bash
cd dekleptocracy-website/server
npm install  # If not already done
npm run dev
```

### Terminal 3 - Frontend:
```bash
cd dekleptocracy-website/client
npm install  # If not already done
npm run dev
```

---

## Step 4: Populate Initial Data

The scheduler runs automatically, but you can manually trigger a refresh:

### Option A: Via API
```bash
# Refresh data for California
curl -X POST http://localhost:5000/api/reports/state/refresh \
  -H "Content-Type: application/json" \
  -d '{"state": "California"}'
```

### Option B: Refresh Priority States
```bash
# Refresh top 10 states
for state in "California" "Texas" "Florida" "New York" "Pennsylvania"; do
  curl -X POST http://localhost:5000/api/reports/state/refresh \
    -H "Content-Type: application/json" \
    -d "{\"state\": \"$state\"}"
  sleep 5  # Rate limiting
done
```

---

## Step 5: Test the Report

### Check Data Status:
```bash
curl "http://localhost:5000/api/reports/state/data-status?state=California"
```

Expected response:
```json
{
  "success": true,
  "state": "California",
  "availableDataCount": 6,
  "hasStaleData": false,
  "dataTypes": [
    { "type": "unemployment", "available": true, "isStale": false },
    { "type": "electricity_prices", "available": true, "isStale": false },
    ...
  ]
}
```

### Get Full Report:
```bash
curl "http://localhost:5000/api/reports/state?state=California"
```

### View in Browser:
Open: http://localhost:5173/report?state=California

---

## Troubleshooting

### "No real data available" Error

**Cause:** Cache is empty, data hasn't been fetched yet.

**Fix:**
```bash
# Trigger manual refresh
curl -X POST http://localhost:5000/api/reports/state/refresh \
  -H "Content-Type: application/json" \
  -d '{"state": "California"}'
```

### "MCP server not healthy" Error

**Cause:** MCP server is not running or not accessible.

**Fix:**
1. Check MCP server is running: `curl http://localhost:8000/health`
2. Check environment variable: `echo $MCP_SERVER_URL`
3. Restart MCP server if needed

### API Key Errors

**Cause:** Missing or invalid API key.

**Fix:**
1. Verify key in `.env` file
2. Test key directly:
```bash
# Test BLS
curl "https://api.bls.gov/publicAPI/v2/timeseries/data/" \
  -H "Content-Type: application/json" \
  -d '{"seriesid":["LASST060000000003"],"registrationkey":"YOUR_KEY"}'
```

### Stale Data Showing

**Cause:** Data has expired but new data couldn't be fetched.

**Fix:**
1. Check cache health: `curl http://localhost:5000/api/reports/cache/health`
2. Check MCP server logs for API errors
3. Verify API rate limits haven't been exceeded

---

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports/state` | GET | Generate state report |
| `/api/reports/state/data-status` | GET | Check data availability |
| `/api/reports/state/refresh` | POST | Trigger data refresh |
| `/api/reports/scheduler/status` | GET | Get scheduler status |
| `/api/reports/cache/health` | GET | Get cache health stats |
| `/api/reports/available-states` | GET | List states with data |

### Query Parameters for `/api/reports/state`:
- `state` - State name (default: "California")
- `role` - User role label (default: "VOTER")
- `name` - Display name (default: "{State} Resident")

---

## Data Sources

| Metric | Source | Update Frequency |
|--------|--------|------------------|
| Unemployment Rate | BLS LAUS | Daily |
| CPI / Inflation | BLS CPI | Daily |
| Electricity Prices | EIA | Daily |
| Gas Prices | EIA | Every 6 hours |
| Natural Gas Prices | EIA | Daily |
| Fair Market Rent | HUD | Weekly |
| Food Prices | USDA | Daily |
| State GDP | FRED | Weekly |
| Personal Income | FRED | Weekly |

---

## Automatic Scheduling

Once the server starts, data refreshes automatically:

- **Daily at 2 AM EST:** Full refresh for all states
- **Every 6 hours:** Gas prices refresh (more volatile)

You can check scheduler status:
```bash
curl http://localhost:5000/api/reports/scheduler/status
```

---

## Next Steps

1. **Get HUD API access** - Submit application, wait for approval
2. **Monitor cache health** - Check `/api/reports/cache/health` periodically
3. **Set up alerts** - Monitor for API failures in production
4. **Consider caching strategy** - Adjust TTLs based on your needs
