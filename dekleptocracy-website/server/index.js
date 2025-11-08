import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dekleptocracy';

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
    if (mongoUri) {
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB');
    } else {
      console.warn('⚠️  MONGODB_URI not set, using default local database');
      await mongoose.connect('mongodb://localhost:27017/dekleptocracy');
      console.log('✅ Connected to MongoDB (local)');
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


