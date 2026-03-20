import mongoose from 'mongoose';
import app from './app.js';
import { scheduleArticleGeneration } from './services/articleScheduler.js';
import { scheduleResearchGeneration } from './services/researchScheduler.js';
import { initializeScheduler as initStateDataScheduler } from './services/stateDataScheduler.js';

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;

async function start() {
  try {
    if (!mongoUri) {
      console.error('❌ MONGODB_URI is required but not set in environment variables');
      console.error('Please set MONGODB_URI in your .env file');
      console.error('Example: mongodb+srv://user:password@cluster.mongodb.net/dekleptocracy');
      process.exit(1);
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    const dbName = mongoose.connection.db.databaseName;
    const host = mongoose.connection.host;
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📊 Database: ${dbName}`);
    console.log(`🌐 Host: ${host}`);

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

      console.log('\n📅 Starting article generation scheduler...');
      scheduleArticleGeneration(7);
      console.log('✅ Article scheduler started successfully');

      console.log('\n📅 Starting research generation scheduler...');
      scheduleResearchGeneration(7);
      console.log('✅ Research scheduler started successfully');

      console.log('\n📅 Starting state data scheduler...');
      initStateDataScheduler();
      console.log('✅ State data scheduler started successfully\n');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
