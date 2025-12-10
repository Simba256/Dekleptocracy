import cron from 'node-cron';
import { generateResearch } from './researchGenerator.js';

let isRunning = false;

/**
 * Schedule research generation at specified interval
 * 
 * @param {number} days - Interval in days (1 = daily, 7 = weekly, 14 = bi-weekly, etc.)
 * 
 * Examples:
 * - scheduleResearchGeneration(7)  // Every 7 days (weekly) at 10:00 AM
 * - scheduleResearchGeneration(14) // Every 14 days (bi-weekly) at 10:00 AM
 * 
 * For testing: Use '*/1 * * * *' for every 1 minute
 */
function scheduleResearchGeneration(days = 14) {
  // For testing: run every 1 minute
  const cronExpression = '*/1 * * * *';
  
  console.log(`📅 Research generation scheduled: Every 1 minute (TESTING MODE)`);
  console.log(`📅 Cron expression: ${cronExpression}`);
  
  // Schedule the job
  const job = cron.schedule(cronExpression, async () => {
    if (isRunning) {
      console.log('⚠️  Research generation already in progress, skipping...');
      return;
    }
    
    isRunning = true;
    console.log('\n🔬 Starting scheduled research generation...');
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    
    try {
      // For testing: Generate 1-2 research reports (to speed up testing)
      const count = Math.floor(Math.random() * 2) + 1;
      const research = await generateResearch(count);
      
      console.log(`✅ Successfully generated ${research.length} research reports`);
      console.log('📊 Research Reports:', research.map(r => r.title).join('\n   - '));
      
    } catch (error) {
      console.error('❌ Error during scheduled research generation:', error);
    } finally {
      isRunning = false;
      console.log('✓ Research generation complete\n');
    }
  }, {
    scheduled: true,
    timezone: "America/New_York" // Change to your timezone
  });
  
  return job;
}

// Manual trigger for testing
async function triggerResearchGeneration(count = 5) {
  if (isRunning) {
    console.log('⚠️  Research generation already in progress');
    return { success: false, message: 'Generation already in progress' };
  }
  
  isRunning = true;
  console.log(`\n🚀 Manual research generation triggered: ${count} reports`);
  
  try {
    const research = await generateResearch(count);
    console.log(`✅ Successfully generated ${research.length} research reports`);
    
    return {
      success: true,
      count: research.length,
      research: research.map(r => ({
        title: r.title,
        category: r.category,
        slug: r.slug
      }))
    };
  } catch (error) {
    console.error('❌ Error during manual research generation:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    isRunning = false;
  }
}

// Get scheduler status
function getResearchSchedulerStatus() {
  return {
    isRunning,
    schedule: 'Every 1 minute (TESTING MODE)',
    timezone: 'America/New_York',
    note: 'Running in test mode. Change cron expression in researchScheduler.js for production'
  };
}

export {
  scheduleResearchGeneration,
  triggerResearchGeneration,
  getResearchSchedulerStatus
};

