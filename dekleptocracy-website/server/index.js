import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

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
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();


