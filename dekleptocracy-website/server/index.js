import mongoose from 'mongoose';
import app from './app.js';
import { scheduleArticleGeneration } from './services/articleScheduler.js';
import { scheduleResearchGeneration } from './services/researchScheduler.js';
import { initializeScheduler as initStateDataScheduler } from './services/stateDataScheduler.js';

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;

let schedulersStarted = false;

// DB-dependent background jobs - start only once the connection is live so a
// DB outage at boot doesn't crash them on startup.
function startSchedulers() {
  if (schedulersStarted) return;
  schedulersStarted = true;

  console.log('\n📅 Starting article generation scheduler...');
  scheduleArticleGeneration(7);
  console.log('✅ Article scheduler started successfully');

  console.log('📅 Starting research generation scheduler...');
  scheduleResearchGeneration(7);
  console.log('✅ Research scheduler started successfully');

  console.log('📅 Starting state data scheduler...');
  initStateDataScheduler();
  console.log('✅ State data scheduler started successfully\n');
}

// Connect to MongoDB with retry. Never exits the process on failure - the HTTP
// server stays up and serves fallback data (see homepageRoutes /all) until the
// database becomes reachable again.
async function connectWithRetry(attempt = 1) {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

    const dbName = mongoose.connection.db.databaseName;
    const host = mongoose.connection.host;
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📊 Database: ${dbName}`);
    console.log(`🌐 Host: ${host}`);

    if (host && !host.includes('mongodb.net') && !mongoUri.includes('mongodb+srv')) {
      console.warn('⚠️  Warning: Connection does not appear to be MongoDB Atlas');
    } else {
      console.log('✅ Verified: Using MongoDB Atlas (cloud database)');
    }

    startSchedulers();
  } catch (err) {
    const delaySec = Math.min(60, 5 * attempt); // backoff capped at 60s
    console.error(
      `❌ MongoDB connection failed (attempt ${attempt}): ${err.message}. ` +
        `Server stays up serving fallback data. Retrying in ${delaySec}s...`,
    );
    setTimeout(() => connectWithRetry(attempt + 1), delaySec * 1000);
  }
}

function start() {
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is required but not set in environment variables');
    console.error('Please set MONGODB_URI in your .env file');
    console.error('Example: mongodb+srv://user:password@cluster.mongodb.net/dekleptocracy');
    process.exit(1);
  }

  // Start the HTTP server first so the site is reachable even while the DB is
  // unavailable. The homepage degrades to fallback data until the DB recovers.
  app.listen(port, () => {
    console.log(`🚀 API listening on http://localhost:${port}`);
    console.log(`📝 Health check: http://localhost:${port}/api/health`);
    console.log(`🔐 Auth routes: http://localhost:${port}/api/auth`);
    console.log(`👤 User routes: http://localhost:${port}/api/user`);
    console.log(`📰 Article routes: http://localhost:${port}/api/articles`);
    console.log(`🏠 Homepage routes: http://localhost:${port}/api/homepage`);
  });

  // Reconnect handling: restart schedulers if the connection is re-established.
  mongoose.connection.on('connected', startSchedulers);
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected - homepage will serve fallback data until reconnect');
  });

  connectWithRetry();
}

start();
