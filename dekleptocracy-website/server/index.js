import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import homepageRoutes from './routes/homepageRoutes.js';
import { scheduleArticleGeneration, triggerArticleGeneration, getSchedulerStatus } from './services/articleScheduler.js';
import { scheduleResearchGeneration, triggerResearchGeneration, getResearchSchedulerStatus } from './services/researchScheduler.js';
import { removeDuplicateArticles } from './services/articleGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL, // Add this env var on Render
    ].filter(Boolean); // Remove undefined values

    // Log the origin for debugging
    console.log(`📍 Request from origin: ${origin}`);

    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      console.log(`✅ CORS: Allowing origin ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS: Blocking origin ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight requests for 10 minutes
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} from ${req.get('origin') || 'unknown'}`);
  next();
});

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/homepage', homepageRoutes);

// Article generation endpoints
app.post('/api/articles/generate', async (req, res) => {
  try {
    const { count = 7 } = req.body;
    const result = await triggerArticleGeneration(count);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Research generation endpoint
app.post('/api/research/generate', async (req, res) => {
  try {
    const { count = 5 } = req.body;
    const result = await triggerResearchGeneration(count);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/research/scheduler/status', (req, res) => {
  const status = getResearchSchedulerStatus();
  res.json(status);
});

app.get('/api/articles/scheduler/status', (req, res) => {
  const status = getSchedulerStatus();
  res.json(status);
});

// Clean up duplicate articles
app.post('/api/articles/cleanup-duplicates', async (req, res) => {
  try {
    const count = await removeDuplicateArticles();
    res.json({
      success: true,
      message: `Removed ${count} duplicate articles`,
      count: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clean up duplicates',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

async function start() {
  try {
    if (!mongoUri) {
      console.error('❌ MONGODB_URI is required but not set in environment variables');
      console.error('Please set MONGODB_URI in your .env file');
      console.error('Example: mongodb+srv://user:password@cluster.mongodb.net/dekleptocracy');
      process.exit(1);
    }

    await mongoose.connect(mongoUri, {
      // MongoDB Atlas connection options
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
    });
    
    // Verify connection to Atlas
    const dbName = mongoose.connection.db.databaseName;
    const host = mongoose.connection.host;
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📊 Database: ${dbName}`);
    console.log(`🌐 Host: ${host}`);
    
    // Verify it's Atlas (not local)
    if (host && !host.includes('mongodb.net') && !mongoUri.includes('mongodb+srv')) {
      console.warn('⚠️  Warning: Connection does not appear to be MongoDB Atlas');
      console.warn('⚠️  Please ensure you are using MongoDB Atlas connection string');
    } else {
      console.log('✅ Verified: Using MongoDB Atlas (cloud database)');
    }
    
    app.listen(port, () => {
      console.log(`🚀 API listening on http://localhost:${port}`);
      console.log(`📝 Health check: http://localhost:${port}/api/health`);
      console.log(`🔐 Auth routes: http://localhost:${port}/api/auth`);
      console.log(`👤 User routes: http://localhost:${port}/api/user`);
      console.log(`📰 Article routes: http://localhost:${port}/api/articles`);
      console.log(`🏠 Homepage routes: http://localhost:${port}/api/homepage`);
      
      // Start the article generation scheduler (every 7 days)
      console.log('\n📅 Starting article generation scheduler...');
      scheduleArticleGeneration(7); // Generate articles every 7 days at 9:00 AM
      console.log('✅ Article scheduler started successfully');
      
      // Start the research generation scheduler (every 7 days)
      console.log('\n📅 Starting research generation scheduler...');
      scheduleResearchGeneration(7); // Generate research every 7 days at 10:00 AM
      console.log('✅ Research scheduler started successfully\n');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();


