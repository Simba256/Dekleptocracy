# Automated Article Generation System

## Overview

This system automatically generates policy impact articles using LLM (Large Language Model) every 2-3 hours. Articles are stored in MongoDB and displayed dynamically on the Insights page with proper source references.

## Features

- ✅ **Automated Generation**: Articles generated every 2-3 hours via cron job
- ✅ **LLM-Powered**: Uses your LLM to create data-driven content
- ✅ **Source References**: Each article includes verified source links
- ✅ **MongoDB Storage**: All articles stored with full metadata
- ✅ **RESTful API**: Complete CRUD operations for articles
- ✅ **Category Support**: 8 categories (groceries, fuel, utilities, tech, housing, healthcare, education, transportation)
- ✅ **Dynamic Display**: Latest articles shown on Insights page
- ✅ **View Tracking**: Article views automatically tracked
- ✅ **Manual Trigger**: Generate articles on-demand via API

## System Architecture

```
┌─────────────────┐
│   Cron Job      │  Every 2-3 hours
│  (Scheduler)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LLM Service    │  Generates 7-8 articles
│  (articleGen)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    MongoDB      │  Stores articles
│   (Article DB)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   REST API      │  Serves articles
│ (Express Routes)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  React Client   │  Displays articles
│ (Insights Page) │
└─────────────────┘
```

## Installation

### 1. Install Dependencies

```bash
cd server
npm install node-cron
```

The package has already been added to `package.json`.

### 2. Setup MongoDB

Ensure your MongoDB connection is configured in `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dekleptocracy
```

### 3. Configure Your LLM

**✅ Already Configured!** The system is set up to use your existing MCP server's OpenAI API.

Add your OpenAI API key to `server/.env`:

```env
OPENAI_API_KEY=sk-your-openai-key-here
```

The article generator will automatically use OpenAI GPT-4. If the key is not configured, it will fall back to mock data.

**For advanced integration with your MCP server data sources, see [MCP_INTEGRATION.md](./MCP_INTEGRATION.md)**

### 4. Start the Server

```bash
cd server
npm run dev
```

The scheduler will automatically start and log:

```
📅 Article generation scheduled: Every 2 hours
📅 Cron expression: 0 */2 * * *
✅ Scheduler started successfully
```

## API Endpoints

### Get All Articles

```http
GET /api/articles?category=groceries&page=1&limit=10
```

### Get Latest Articles

```http
GET /api/articles/latest?limit=8
```

### Get Single Article

```http
GET /api/articles/:slug
```

### Get Articles by Category

```http
GET /api/articles/category/groceries
```

### Generate Articles Manually

```http
POST /api/articles/generate
Content-Type: application/json

{
  "count": 7
}
```

### Check Scheduler Status

```http
GET /api/articles/scheduler/status
```

### Create Article

```http
POST /api/articles
Content-Type: application/json

{
  "title": "Article Title",
  "category": "groceries",
  "description": "Short description",
  "mainText": "Full article text...",
  "price": "$5.90",
  "priceUnit": "per dozen",
  "priceChange": "+28%",
  "impactScore": 83,
  "impactLevel": "high",
  ...
}
```

## Database Schema

```javascript
{
  title: String,              // Article title
  slug: String,               // URL-friendly slug
  category: String,           // Category (groceries, fuel, etc.)
  icon: String,               // Emoji icon
  iconBg: String,             // Icon background color
  heroImage: String,          // Hero image URL
  description: String,        // Short description
  mainText: String,           // Full article text
  price: String,              // Current price
  priceUnit: String,          // Price unit
  priceChange: String,        // Price change percentage
  impactScore: Number,        // 0-100
  impactLevel: String,        // low, medium, high, critical
  location: String,           // Geographic location
  whyItHappened: [{           // Reasons for price change
    title: String,
    description: String
  }],
  chartData: [{               // Price trend data
    month: String,
    value: Number
  }],
  sources: [{                 // Source references
    title: String,
    url: String,
    publishedDate: Date
  }],
  tags: [String],             // Article tags
  views: Number,              // View count
  featured: Boolean,          // Featured flag
  status: String,             // draft, published, archived
  generatedBy: String,        // llm or manual
  llmModel: String,           // LLM model used
  publishedAt: Date,          // Publication date
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

## Frontend Integration

### Replace the Old Insights Page

Rename `InsightsNew.jsx` to `Insights.jsx`:

```bash
cd client/src/pages
mv Insights.jsx InsightsOld.jsx
mv InsightsNew.jsx Insights.jsx
```

### Or Gradually Migrate

Test the new version first, then switch:

```javascript
// In App.jsx
import Insights from './pages/InsightsNew'; // Use new version
// import Insights from './pages/Insights';   // Old version
```

## Configuration

### Change Generation Frequency

Edit `server/index.js`:

```javascript
// Generate every 2 hours
scheduleArticleGeneration(2);

// Generate every 3 hours
scheduleArticleGeneration(3);

// Generate every hour
scheduleArticleGeneration(1);
```

### Change Article Count

Edit `server/services/articleScheduler.js`:

```javascript
// Generate 7-8 articles (default)
const count = Math.floor(Math.random() * 2) + 7;

// Generate exactly 10 articles
const count = 10;

// Generate 5-12 articles
const count = Math.floor(Math.random() * 8) + 5;
```

### Customize Categories

Edit `server/services/articleGenerator.js`:

```javascript
const articleTemplates = [
  {
    category: 'your-category',
    icon: '🎯',
    iconBg: '#color',
    topics: ['topic1', 'topic2', ...]
  },
  // ... more templates
];
```

### Add More Sources

Edit the `generateSources()` function in `articleGenerator.js`:

```javascript
function generateSources(category, topic) {
  const sourcesMap = {
    groceries: [
      { title: 'Your Source', url: 'https://...', publishedDate: new Date() },
      // ... more sources
    ],
    // ... more categories
  };
  return sourcesMap[category] || [];
}
```

## Testing

### Manual Article Generation

```bash
# Using curl
curl -X POST http://localhost:5000/api/articles/generate \
  -H "Content-Type: application/json" \
  -d '{"count": 3}'

# Using Postman
POST http://localhost:5000/api/articles/generate
Body: { "count": 3 }
```

### Check Scheduler Status

```bash
curl http://localhost:5000/api/articles/scheduler/status
```

### View Generated Articles

```bash
curl http://localhost:5000/api/articles/latest?limit=10
```

## Monitoring

### Server Logs

The system logs all generation activity:

```
🤖 Starting scheduled article generation...
⏰ Time: 12/8/2025, 2:00:00 PM
✓ Generated article: Egg Prices Surge 28% in California
✓ Generated article: Gas Prices Hit $4.20 in Texas
...
✅ Successfully generated 7 articles
✓ Article generation complete
```

### Database Monitoring

Check article count:

```javascript
// In MongoDB
db.articles.countDocuments({ status: 'published' });

// Via API
GET / api / articles / stats / overview;
```

## Troubleshooting

### Scheduler Not Running

Check server logs for:

```
📅 Article generation scheduled: Every 2 hours
✅ Scheduler started successfully
```

If missing, ensure `scheduleArticleGeneration()` is called in `index.js`.

### LLM Errors

1. Check API key in `.env`
2. Verify LLM service is responding
3. Check rate limits
4. Review error logs

### No Articles Generated

1. Check MongoDB connection
2. Verify LLM function returns correct JSON format
3. Check article validation rules
4. Review error logs

### Articles Not Showing on Frontend

1. Check API endpoint: `http://localhost:5000/api/articles`
2. Verify CORS settings
3. Check browser console for errors
4. Confirm MongoDB has articles

## Production Deployment

### Environment Variables

```env
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-...
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com
```

### Adjust for Timezone

Edit `articleScheduler.js`:

```javascript
const job = cron.schedule(
  cronExpression,
  async () => {
    // ...
  },
  {
    scheduled: true,
    timezone: 'America/Los_Angeles', // Your timezone
  },
);
```

### Scaling Considerations

- **Rate Limiting**: Add rate limiting to LLM calls
- **Queue System**: Use Bull/BullMQ for better job management
- **Caching**: Cache articles to reduce database queries
- **CDN**: Use CDN for article images

## Future Enhancements

- [ ] Add article editing interface
- [ ] Implement article review/approval workflow
- [ ] Add image generation for articles
- [ ] Create email notifications for new articles
- [ ] Add article search and filtering
- [ ] Implement article recommendations
- [ ] Add social media auto-posting
- [ ] Create analytics dashboard

## Support

For issues or questions:

1. Check server logs
2. Review MongoDB Atlas logs
3. Test LLM connection
4. Verify all dependencies are installed

## License

Part of the Dekleptocracy project.
