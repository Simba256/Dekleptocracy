# Government Data API Keys Setup Guide

This guide explains how to obtain API keys for all the government data sources used in the state reports feature.

---

## Overview

| API | Provider | Cost | Rate Limits | Registration Time |
|-----|----------|------|-------------|-------------------|
| BLS | Bureau of Labor Statistics | Free | 500 req/day (v2) | Instant |
| FRED | Federal Reserve Bank of St. Louis | Free | 120 req/min | Instant |
| EIA | Energy Information Administration | Free | 1000 req/hour | Instant |
| HUD | Dept. of Housing & Urban Development | Free | 1000 req/day | 1-2 business days |
| USDA | Dept. of Agriculture | Free | Varies | Instant |

---

## 1. BLS (Bureau of Labor Statistics) API Key

**Data Provided:** Unemployment rates, CPI, wages by state

### Steps:
1. Go to: https://www.bls.gov/developers/home.htm
2. Click **"Registration"** in the left sidebar
3. Fill out the form:
   - Email address
   - Organization (can use "Personal Project")
   - Check the terms of service box
4. Click **"Submit"**
5. Check your email for the API key (arrives within minutes)

### Notes:
- **Without registration:** 25 requests/day, 10 years of data
- **With registration (v2):** 500 requests/day, 20 years of data
- Registration is highly recommended

### Add to `.env`:
```
BLS_API_KEY=your_key_here
```

---

## 2. FRED (Federal Reserve Economic Data) API Key

**Data Provided:** State GDP, personal income, economic indicators

### Steps:
1. Go to: https://fred.stlouisfed.org/
2. Click **"My Account"** (top right) → **"Create Account"**
3. Fill out registration form:
   - Email
   - Password
   - Name
4. Verify your email
5. Log in and go to: https://fredaccount.stlouisfed.org/apikeys
6. Click **"Request API Key"**
7. Fill out:
   - Application name: "Dekleptocracy State Reports"
   - Application description: "Economic data for state impact reports"
8. Your API key appears immediately

### Notes:
- 120 requests per minute limit
- No daily limit
- Comprehensive economic data access

### Add to `.env`:
```
FRED_API_KEY=your_key_here
```

---

## 3. EIA (Energy Information Administration) API Key

**Data Provided:** Electricity prices, gasoline prices, natural gas prices

### Steps:
1. Go to: https://www.eia.gov/opendata/register.php
2. Fill out the form:
   - Email address
   - Name
   - Organization (optional)
   - Reason for registration: "Building an application to display energy price data"
3. Click **"Register"**
4. Check your email - API key arrives within minutes

### Notes:
- 1000 requests per hour
- Access to all EIA data series
- Comprehensive energy data

### Add to `.env`:
```
EIA_API_KEY=your_key_here
```

---

## 4. HUD (Housing and Urban Development) API Token

**Data Provided:** Fair Market Rents (FMR) by state and county

### Steps:
1. Go to: https://www.huduser.gov/hudapi/public/register
2. Click **"Request API Access"**
3. Fill out the registration form:
   - Name
   - Email
   - Organization
   - Phone (optional)
   - Intended use: "Displaying Fair Market Rent data for state economic reports"
4. Submit the form
5. **Wait for approval email** (usually 1-2 business days)
6. Once approved, log in at: https://www.huduser.gov/hudapi/public/login
7. Your token will be visible in your account dashboard

### Notes:
- Requires manual approval (not instant)
- 1000 requests per day
- FMR data is updated annually

### Add to `.env`:
```
HUD_API_TOKEN=your_token_here
```

### Alternative (if HUD approval is slow):
The system uses regional cost-of-living adjustments as a fallback until HUD data is available.

---

## 5. USDA (Food Price Data)

**Data Provided:** Food prices, grocery basket costs

### Option A: USDA ERS API (Recommended)

1. Go to: https://www.ers.usda.gov/developer/
2. Review available datasets
3. Most ERS data is publicly accessible without a key
4. For authenticated access, email: ERS-Data-Services@usda.gov

### Option B: Use Public Data (No Key Required)

The USDA client is designed to work with publicly available USDA Food Price Outlook data. If no key is provided, it uses:
- Regional cost-of-living adjustments
- Published USDA food plan costs
- BLS food CPI data

### Add to `.env` (if you obtain a key):
```
USDA_API_KEY=your_key_here
```

---

## Complete `.env` Configuration

Add these to your MCP server `.env` file (`mcp_server/.env`):

```bash
# Government Data API Keys for State Reports

# Bureau of Labor Statistics (unemployment, CPI, wages)
# Get at: https://www.bls.gov/developers/home.htm
BLS_API_KEY=your_bls_key

# Federal Reserve Economic Data (GDP, income, economic indicators)
# Get at: https://fred.stlouisfed.org/ → My Account → API Keys
FRED_API_KEY=your_fred_key

# Energy Information Administration (electricity, gas prices)
# Get at: https://www.eia.gov/opendata/register.php
EIA_API_KEY=your_eia_key

# HUD Fair Market Rents (housing costs)
# Get at: https://www.huduser.gov/hudapi/public/register
# Note: Requires 1-2 day approval
HUD_API_TOKEN=your_hud_token

# USDA Economic Research Service (food prices)
# Optional - system works without it using public data
USDA_API_KEY=your_usda_key
```

---

## Testing Your API Keys

After adding your keys, you can test them:

### 1. Test MCP Server Tools

```bash
cd mcp_server
python -c "
from apis import BLSAPIClient, FREDAPIClient, EIAAPIClient
from config import config

# Test BLS
bls = BLSAPIClient(config.get_api_config('bls'))
print('BLS:', bls.test_connection())

# Test FRED
fred = FREDAPIClient(config.get_api_config('fred'))
print('FRED:', fred.test_connection())

# Test EIA
eia = EIAAPIClient(config.get_api_config('eia'))
print('EIA:', eia.test_connection())
"
```

### 2. Test via API Endpoint

Once the server is running:

```bash
# Check cache health
curl http://localhost:5000/api/reports/cache/health

# Trigger data refresh for California
curl -X POST http://localhost:5000/api/reports/state/refresh \
  -H "Content-Type: application/json" \
  -d '{"state": "California"}'

# Get state report (after data is cached)
curl "http://localhost:5000/api/reports/state?state=California"
```

---

## Troubleshooting

### "API key not found" errors
- Ensure the key is in the correct `.env` file
- Restart the MCP server after adding keys
- Check for extra spaces or quotes around the key

### "Rate limit exceeded" errors
- BLS: Wait until the next day (500/day limit)
- FRED: Wait 1 minute (120/min limit)
- EIA: Wait 1 hour (1000/hour limit)

### "No data available" for a state
- Run the scheduler manually: `POST /api/reports/state/refresh`
- Check if MCP server is running and healthy
- Verify API keys are valid

### HUD approval pending
- The system will work without HUD data
- Other metrics (unemployment, energy, food) will still show
- Rent data will be missing until HUD approves your access

---

## Data Refresh Schedule

Once configured, the system automatically refreshes data:

| Data Type | Refresh Frequency | TTL |
|-----------|-------------------|-----|
| Unemployment | Daily (2 AM EST) | 24 hours |
| Electricity prices | Daily (2 AM EST) | 24 hours |
| Gas prices | Every 6 hours | 6 hours |
| Rent (HUD) | Weekly | 7 days |
| Food prices | Daily (2 AM EST) | 24 hours |
| GDP | Weekly | 7 days |

---

## Support Links

- **BLS:** https://www.bls.gov/developers/home.htm
- **FRED:** https://fred.stlouisfed.org/docs/api/fred/
- **EIA:** https://www.eia.gov/opendata/documentation.php
- **HUD:** https://www.huduser.gov/portal/dataset/fmr-api.html
- **USDA:** https://www.ers.usda.gov/developer/
