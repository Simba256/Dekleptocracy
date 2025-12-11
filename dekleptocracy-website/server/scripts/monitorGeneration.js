/**
 * Monitor generation progress in real-time
 * Usage: node scripts/monitorGeneration.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import WalletShock from '../models/WalletShock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

async function monitor() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.clear();
    console.log('📊 Real-Time Generation Monitor\n');
    console.log('═══════════════════════════════════════════════════\n');

    // Get statistics
    const totalShocks = await WalletShock.countDocuments({ status: 'published' });
    const byState = await WalletShock.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const byCategory = await WalletShock.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentShocks = await WalletShock.find({ status: 'published' })
      .sort('-dataDate')
      .limit(5)
      .select('state category title changePercent dataDate')
      .exec();

    console.log(`📈 Total Wallet Shocks: ${totalShocks}`);
    console.log(`🎯 Target: 204 (51 states × 4 categories)`);
    console.log(`📊 Progress: ${((totalShocks / 204) * 100).toFixed(1)}%\n`);

    console.log('📍 By State:');
    byState.forEach(s => {
      const progress = (s.count / 4) * 100;
      const bar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
      console.log(`   ${s._id.padEnd(20)} [${bar}] ${s.count}/4`);
    });

    console.log('\n📦 By Category:');
    byCategory.forEach(c => {
      console.log(`   ${c._id.padEnd(15)} ${c.count}`);
    });

    console.log('\n🆕 Recent Shocks:');
    recentShocks.forEach((shock, i) => {
      const time = new Date(shock.dataDate).toLocaleTimeString();
      console.log(`   ${i + 1}. [${time}] ${shock.state} - ${shock.category}: ${shock.changePercent > 0 ? '+' : ''}${shock.changePercent}%`);
    });

    console.log('\n═══════════════════════════════════════════════════');
    console.log('Press Ctrl+C to exit | Refresh every 10 seconds\n');

    await mongoose.disconnect();

    // Auto-refresh every 10 seconds
    setTimeout(() => {
      monitor();
    }, 10000);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

monitor();
