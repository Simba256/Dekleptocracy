/**
 * Test script for research generation
 * 
 * Usage:
 *   node scripts/generateResearch.js [count]
 * 
 * Examples:
 *   node scripts/generateResearch.js     // Generate 5 reports (default)
 *   node scripts/generateResearch.js 3   // Generate 3 reports
 * 
 * Or use the API endpoint:
 *   POST http://localhost:5000/api/research/generate
 *   Body: { "count": 5 }
 * 
 * Or use curl:
 *   curl -X POST http://localhost:5000/api/research/generate -H "Content-Type: application/json" -d "{\"count\": 3}"
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { generateResearch } from '../services/researchGenerator.js';

dotenv.config();

async function main() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get count from command line args or default to 5
    const count = parseInt(process.argv[2]) || 5;
    
    console.log(`🔬 Generating ${count} research reports...\n`);
    
    const research = await generateResearch(count);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESEARCH GENERATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Successfully generated: ${research.length} reports`);
    console.log('\n📋 Generated Research Reports:');
    research.forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.title}`);
      console.log(`   Category: ${r.category}`);
      console.log(`   Slug: ${r.slug}`);
      console.log(`   Type: ${r.contentType}`);
      console.log(`   Impact: ${r.impactLevel} (${r.impactScore}/100)`);
      console.log(`   Sources: ${r.sources.length}`);
      console.log(`   Data Points: ${r.chartData.length}`);
    });
    console.log('\n' + '='.repeat(80));
    
    await mongoose.connection.close();
    console.log('\n✅ Script complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

