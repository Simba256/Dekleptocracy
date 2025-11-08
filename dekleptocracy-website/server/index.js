import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);

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
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();


