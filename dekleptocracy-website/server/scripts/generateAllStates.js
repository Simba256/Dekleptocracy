/**
 * Generate wallet shocks for all US states
 * This populates the database with LLM-powered data for all states
 * Usage: node scripts/generateAllStates.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateHomepageData } from '../services/homepageDataGenerator.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// All 50 US states + nationwide
const ALL_STATES = [
  'nationwide',
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];

// Priority states (generate these first for testing)
const PRIORITY_STATES = [
  'nationwide',
  'California',
  'Texas',
  'Florida',
  'New York',
  'Pennsylvania',
  'Illinois',
  'Ohio',
  'Georgia',
  'North Carolina',
  'Michigan',
];

async function generateAll() {
  try {
    console.log('\n🚀 Comprehensive Homepage Data Generation\n');
    console.log(`🔗 MCP Server: ${process.env.MCP_SERVER_URL}`);
    console.log(`📊 MongoDB: ${process.env.MONGODB_URI.split('@')[1]}\n`);

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Ask user which set to generate
    const args = process.argv.slice(2);
    const mode = args[0] || 'priority'; // 'priority', 'all', or specific state

    let statesToGenerate = [];
    if (mode === 'all') {
      statesToGenerate = ALL_STATES;
      console.log(`🌎 Generating for ALL ${ALL_STATES.length} states`);
    } else if (mode === 'priority') {
      statesToGenerate = PRIORITY_STATES;
      console.log(`⭐ Generating for ${PRIORITY_STATES.length} priority states`);
    } else {
      statesToGenerate = [mode];
      console.log(`📍 Generating for specific state: ${mode}`);
    }

    console.log(`📝 States: ${statesToGenerate.join(', ')}\n`);
    console.log(
      `⏱️  Estimated time: ~${statesToGenerate.length * 4 * 2} minutes (2 min per category)\n`,
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Generate data
    const startTime = Date.now();
    const results = await generateHomepageData({
      states: statesToGenerate,
      skipWalletShocks: false,
      skipCostDrivers: true, // TODO: Implement later
      skipStats: true, // TODO: Implement later
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000 / 60).toFixed(1);

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Generation Complete!\n');
    console.log(`📊 Results:`);
    console.log(`   - Wallet Shocks: ${results.walletShocks.length} generated`);
    console.log(`   - Errors: ${results.errors.length}`);
    console.log(`   - Duration: ${duration} minutes`);
    console.log(`   - Average: ${(duration / statesToGenerate.length).toFixed(1)} min/state\n`);

    if (results.errors.length > 0) {
      console.log('⚠️  Errors encountered:');
      results.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.category} in ${err.state}: ${err.error}`);
      });
      console.log();
    }

    // Show sample data
    if (results.walletShocks.length > 0) {
      const sample = results.walletShocks.filter((s) => !s.error)[0];
      if (sample) {
        console.log('📦 Sample Generated Data:');
        console.log(`   State: ${sample.state}`);
        console.log(`   Category: ${sample.category}`);
        console.log(`   Title: ${sample.title}`);
        console.log(`   Price: ${sample.price} (${sample.change})`);
        console.log();
      }
    }

    console.log('💡 Next Steps:');
    console.log('   1. Check database: WalletShock collection should have new documents');
    console.log('   2. Test API: curl http://localhost:5000/api/homepage/wallet-shocks');
    console.log('   3. View in browser: http://localhost:5173');
    console.log();
  } catch (error) {
    console.error('\n❌ Generation failed:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📚 Usage:
  node scripts/generateAllStates.js [mode]

Modes:
  priority    Generate for 11 priority states (default)
  all         Generate for all 51 states (50 + nationwide)
  <state>     Generate for specific state (e.g., "California")

Examples:
  node scripts/generateAllStates.js                    # Priority states
  node scripts/generateAllStates.js all                # All states
  node scripts/generateAllStates.js California         # Single state
  node scripts/generateAllStates.js "New York"         # State with space

Notes:
  - Each category takes ~2 minutes (LLM processing)
  - Priority mode: ~88 minutes (11 states × 4 categories × 2 min)
  - All mode: ~7 hours (51 states × 4 categories × 2 min)
  - Data is automatically saved to MongoDB
  `);
  process.exit(0);
}

generateAll();
