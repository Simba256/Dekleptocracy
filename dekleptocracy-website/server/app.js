import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import homepageRoutes from './routes/homepageRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import seoRoutes from './routes/seoRoutes.js';
import { triggerArticleGeneration, getSchedulerStatus } from './services/articleScheduler.js';
import {
  triggerResearchGeneration,
  getResearchSchedulerStatus,
} from './services/researchScheduler.js';
import { removeDuplicateArticles } from './services/articleGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
};

app.use(cors(corsOptions));

// Security and performance headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://fonts.gstatic.com',
        ],
        fontSrc: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'", 'https://accounts.google.com'],
        imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://i.pravatar.cc'],
        connectSrc: ["'self'", 'https://accounts.google.com', process.env.FRONTEND_URL],
      },
    },
  }),
);

app.use(compression());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1d' }));

// Request logging middleware (skip in test)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path} from ${req.get('origin') || 'unknown'}`);
    next();
  });
}

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/reports', reportRoutes);
app.use(seoRoutes);

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
      count: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clean up duplicates',
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', err);
  }
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

export default app;
