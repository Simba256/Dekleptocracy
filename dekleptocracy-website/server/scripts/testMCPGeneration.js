/**
 * Test script for MCP-powered data generation
 * Usage: node scripts/testMCPGeneration.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateWalletShock, generateHomepageData } from '../services/homepageDataGenerator.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '../.env') });

async function test() {
  try {
    console.log('\n🧪 Testing MCP Data Generation\n');
    console.log(`🔗 MCP_SERVER_URL: ${process.env.MCP_SERVER_URL}\n`);

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Generate a single wallet shock
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 1: Generate Single Wallet Shock');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const singleShock = await generateWalletShock('groceries', 'California');
    console.log('\n📦 Generated Wallet Shock:');
    console.log(JSON.stringify(singleShock, null, 2));

    // Test 2: Generate data for multiple states
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 2: Generate Data for Multiple States');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const results = await generateHomepageData({
      states: ['California', 'Texas'],
      skipWalletShocks: false,
      skipCostDrivers: true,
      skipStats: true
    });

    console.log('\n📊 Generation Results:');
    console.log(`  Wallet Shocks: ${results.walletShocks.length}`);
    console.log(`  Cost Drivers: ${results.costDrivers.length}`);
    console.log(`  Stats: ${results.stats.length}`);
    console.log(`  Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      results.errors.forEach(err => {
        console.log(`  - ${err.type}: ${err.error}`);
      });
    }

    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

test();
