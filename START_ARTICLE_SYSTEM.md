# Starting the Article Generation System

## ✅ What You Need to Do

### Step 1: Start Your MCP Server (Python)

Open a terminal and run:

```bash
cd d:\Dekleptocracy\mcp_server
python http_server.py
```

**Expected Output:**
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Your MCP server is now running with:
- OpenAI GPT-4 for article generation
- GNews API for latest news
- Federal Register for tariff data
- BEA, Census, and other data sources

**Keep this terminal open!**

---

### Step 2: Install Dependencies (First Time Only)

Open a NEW terminal:

```bash
cd d:\Dekleptocracy\dekleptocracy-website\server
npm install node-cron
```

---

### Step 3: Start Node.js Server

In the same terminal:

```bash
cd d:\Dekleptocracy\dekleptocracy-website\server
npm run dev
```

**Expected Output:**
```
🚀 API listening on http://localhost:5000
📰 Article routes: http://localhost:5000/api/articles
📅 Article generation scheduled: Every 2 hours
✅ Scheduler started successfully
```

**Keep this terminal open too!**

---

### Step 4: Generate Test Articles

Open a THIRD terminal and test:

```bash
curl -X POST http://localhost:5000/api/articles/generate -H "Content-Type: application/json" -d "{\"count\": 2}"
```

**Expected Output:**
```json
{
  "success": true,
  "count": 2,
  "articles": [
    {
      "title": "Egg Prices Surge 28% in California",
      "category": "groceries",
      "slug": "egg-prices-surge-28-in-california"
    },
    ...
  ]
}
```

---

### Step 5: View Articles in Browser

1. Open your browser to: http://localhost:5173
2. Navigate to: **Insights** page
3. You should see the newly generated articles!

Or check via API:
```bash
curl http://localhost:5000/api/articles/latest
```

---

## 🔍 Troubleshooting

### MCP Server Not Starting?

**Problem:** "ModuleNotFoundError" or "Package not installed"

**Solution:**
```bash
cd mcp_server
pip install -r requirements.txt
```

---

### Node Server Can't Connect to MCP?

**Check if MCP server is running:**
```bash
curl http://localhost:8000/health
```

**Should return:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-08T...",
  "services": {...}
}
```

If this fails, your MCP server isn't running. Go back to Step 1.

---

### No Articles Generated?

**Check MongoDB connection:**
```bash
# In Node.js server terminal, you should see:
✅ Connected to MongoDB Atlas
```

If you see connection errors, check your `MONGODB_URI` in `.env`

---

### Articles Using Mock Data?

**Check MCP Server logs:**

In your MCP server terminal, you should see:
```
POST /chat/intelligent/v2
POST /execute (tool: get_trade_news)
POST /execute (tool: get_recent_tariff_announcements)
```

If you don't see these requests, the Node.js server isn't connecting to MCP.

**Solution:**
1. Make sure MCP server is running
2. Check `MCP_SERVER_URL` in Node.js server `.env`:
   ```
   MCP_SERVER_URL=http://localhost:8000
   ```
3. Restart Node.js server

---

## 📊 What Happens Automatically

### Every 2 Hours:

1. Node.js scheduler wakes up
2. Calls your MCP server to generate 7-8 articles
3. MCP server:
   - Fetches latest news from GNews
   - Gets tariff announcements from Federal Register
   - Uses GPT-4 to write data-driven articles
4. Articles saved to MongoDB
5. Automatically appear on your Insights page

---

## 🎯 Manual Commands

### Generate Articles Now
```bash
curl -X POST http://localhost:5000/api/articles/generate -H "Content-Type: application/json" -d '{"count": 5}'
```

### Check Scheduler Status
```bash
curl http://localhost:5000/api/articles/scheduler/status
```

### View All Articles
```bash
curl http://localhost:5000/api/articles/latest?limit=20
```

### Check MCP Server Health
```bash
curl http://localhost:8000/health
```

### List MCP Server Tools
```bash
curl http://localhost:8000/tools
```

---

## 💡 Tips

1. **Keep both servers running** for automatic article generation
2. **Check logs** in both terminals to see what's happening
3. **First generation takes longer** as APIs are called
4. **Subsequent generations are faster** with cached data
5. **MCP server does the heavy lifting** - all your data sources and LLM are there

---

## 🆘 Need Help?

### MCP Server Logs
Check the Python terminal for errors or API issues

### Node.js Logs
Check the Node.js terminal for MongoDB or scheduling issues

### Test Individual Components
```bash
# Test MCP server
curl http://localhost:8000/health

# Test Node.js API
curl http://localhost:5000/api/health

# Test MongoDB
curl http://localhost:5000/api/articles/latest
```

---

## Next Steps

Once articles are generating:
1. ✅ View articles on Insights page
2. ✅ Articles update every 2 hours automatically
3. ✅ Each article shows source references
4. ✅ Articles use real data from your MCP server
5. 🔄 Consider adding more data sources to MCP server
6. 🔄 Customize article templates in `articleGenerator.js`
7. 🔄 Adjust generation frequency in `index.js`
