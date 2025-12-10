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
 * Cron expression format: '0 10 star-slash-N star star' (every N days at 10 AM)
 */
function scheduleResearchGeneration(days = 7) {
  const cronExpression = `0 10 */${days} * *`;
  
  console.log(`📅 Research generation scheduled: Every ${days} day(s) at 10:00 AM`);
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
      // Generate 3-5 research reports (random between 3 and 5)
      const count = Math.floor(Math.random() * 3) + 3;
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
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 MANUAL RESEARCH GENERATION TRIGGERED`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Requested count: ${count}`);
  console.log(`Currently running: ${isRunning}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log(`${'='.repeat(80)}\n`);
  
  if (isRunning) {
    console.log('⚠️  Research generation already in progress');
    return { success: false, message: 'Generation already in progress' };
  }
  
  isRunning = true;
  
  try {
    console.log(`Starting research generation with count=${count}...\n`);
    const research = await generateResearch(count);
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ MANUAL GENERATION COMPLETE`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Generated: ${research.length} research reports`);
    console.log(`${'='.repeat(80)}\n`);
    
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
    console.error(`\n${'='.repeat(80)}`);
    console.error('❌ ERROR DURING MANUAL RESEARCH GENERATION');
    console.error(`${'='.repeat(80)}`);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error(`${'='.repeat(80)}\n`);
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  } finally {
    isRunning = false;
    console.log('Research generation lock released\n');
  }
}

// Get scheduler status
function getResearchSchedulerStatus() {
  return {
    isRunning,
    schedule: 'Every 7 days at 10:00 AM',
    timezone: 'America/New_York',
    note: 'Use manual generate button for testing'
  };
}

export {
  scheduleResearchGeneration,
  triggerResearchGeneration,
  getResearchSchedulerStatus
};

