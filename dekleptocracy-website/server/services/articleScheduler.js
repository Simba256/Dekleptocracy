import cron from 'node-cron';
import { generateArticles } from './articleGenerator.js';

let isRunning = false;

/**
 * Schedule article generation at specified interval
 * 
 * @param {number} days - Interval in days (1 = daily, 7 = weekly, etc.)
 * 
 * Examples:
 * - scheduleArticleGeneration(1)  // Every day at 9:00 AM
 * - scheduleArticleGeneration(7)  // Every 7 days (weekly) at 9:00 AM
 * 
 * Cron expression format: '0 9 */[days] * *' (every N days at 9 AM)
 */
function scheduleArticleGeneration(days = 7) {
  const cronExpression = `0 9 */${days} * *`;
  
  console.log(`📅 Article generation scheduled: Every ${days} day(s) at 9:00 AM`);
  console.log(`📅 Cron expression: ${cronExpression}`);
  
  // Schedule the job
  const job = cron.schedule(cronExpression, async () => {
    if (isRunning) {
      console.log('⚠️  Article generation already in progress, skipping...');
      return;
    }
    
    isRunning = true;
    console.log('\n🤖 Starting scheduled article generation...');
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    
    try {
      // Generate 7-8 articles (random between 7 and 8)
      const count = Math.floor(Math.random() * 2) + 7;
      const articles = await generateArticles(count);
      
      console.log(`✅ Successfully generated ${articles.length} articles`);
      console.log('📄 Articles:', articles.map(a => a.title).join('\n   - '));
      
    } catch (error) {
      console.error('❌ Error during scheduled article generation:', error);
    } finally {
      isRunning = false;
      console.log('✓ Article generation complete\n');
    }
  }, {
    scheduled: true,
    timezone: "America/New_York" // Change to your timezone
  });
  
  return job;
}

// Manual trigger for testing
async function triggerArticleGeneration(count = 7) {
  if (isRunning) {
    console.log('⚠️  Article generation already in progress');
    return { success: false, message: 'Generation already in progress' };
  }
  
  isRunning = true;
  console.log(`\n🚀 Manual article generation triggered: ${count} articles`);
  
  try {
    const articles = await generateArticles(count);
    console.log(`✅ Successfully generated ${articles.length} articles`);
    
    return {
      success: true,
      count: articles.length,
      articles: articles.map(a => ({
        title: a.title,
        category: a.category,
        slug: a.slug
      }))
    };
  } catch (error) {
    console.error('❌ Error during manual article generation:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    isRunning = false;
  }
}

// Get scheduler status
function getSchedulerStatus() {
  return {
    isRunning,
    schedule: 'Every 7 days at 9:00 AM',
    timezone: 'America/New_York',
    note: 'To change schedule, modify scheduleArticleGeneration() parameter in index.js'
  };
}

export {
  scheduleArticleGeneration,
  triggerArticleGeneration,
  getSchedulerStatus
};
