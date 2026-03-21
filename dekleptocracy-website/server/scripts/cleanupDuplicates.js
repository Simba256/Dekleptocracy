import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Article from '../models/Article.js';

dotenv.config();

async function cleanupDuplicates() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Finding duplicate articles...');
    const articles = await Article.find({}).sort({ createdAt: -1 });

    const slugMap = new Map();
    const duplicateIds = [];
    const duplicateDetails = [];

    for (const article of articles) {
      if (slugMap.has(article.slug)) {
        duplicateIds.push(article._id);
        duplicateDetails.push({
          title: article.title,
          slug: article.slug,
          createdAt: article.createdAt,
        });
      } else {
        slugMap.set(article.slug, article._id);
      }
    }

    if (duplicateIds.length === 0) {
      console.log('✅ No duplicate articles found!\n');
    } else {
      console.log(`\n📋 Found ${duplicateIds.length} duplicate articles:\n`);
      duplicateDetails.forEach((dup, i) => {
        console.log(`${i + 1}. "${dup.title}"`);
        console.log(`   Slug: ${dup.slug}`);
        console.log(`   Created: ${dup.createdAt}\n`);
      });

      console.log('🗑️  Deleting duplicates...');
      const result = await Article.deleteMany({ _id: { $in: duplicateIds } });
      console.log(`✅ Deleted ${result.deletedCount} duplicate articles\n`);
    }

    console.log('📊 Current article count:', await Article.countDocuments());

    await mongoose.connection.close();
    console.log('\n✅ Cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupDuplicates();
