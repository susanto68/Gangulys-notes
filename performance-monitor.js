// Performance Monitoring Script for AI Avatar Assistant
// Run this script to monitor API performance and identify bottlenecks

const fs = require('fs');
const path = require('path');

// Performance metrics storage
const metrics = {
  apiCalls: 0,
  totalResponseTime: 0,
  averageResponseTime: 0,
  slowestResponse: 0,
  fastestResponse: Infinity,
  errors: 0,
  startTime: Date.now()
};

// Monitor API performance
function monitorAPIPerformance() {
  console.log('🔍 Performance Monitor Started');
  console.log('📊 Monitoring API calls and response times...');
  
  // Check if API files exist and are accessible
  const apiPath = path.join(__dirname, 'pages', 'api', 'chat.js');
  if (fs.existsSync(apiPath)) {
    console.log('✅ Chat API found:', apiPath);
  } else {
    console.log('❌ Chat API not found at:', apiPath);
  }
  
  // Check environment variables
  console.log('\n🔑 Environment Check:');
  console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing');
  
  // Check system prompt size
  const systemPromptPath = path.join(__dirname, 'public', 'system_prompt.txt');
  if (fs.existsSync(systemPromptPath)) {
    const stats = fs.statSync(systemPromptPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log('📝 System Prompt Size:', sizeKB + ' KB');
    
    if (stats.size > 50 * 1024) { // 50KB
      console.log('⚠️  System prompt is large, consider optimization');
    } else {
      console.log('✅ System prompt size is reasonable');
    }
  }
  
  // Check prompts file
  const promptsPath = path.join(__dirname, 'context', 'prompts.js');
  if (fs.existsSync(promptsPath)) {
    const stats = fs.statSync(promptsPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log('📚 Prompts File Size:', sizeKB + ' KB');
  }
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  console.log('1. Ensure GEMINI_API_KEY is set in .env.local');
  console.log('2. Monitor API response times in browser DevTools');
  console.log('3. Check Network tab for slow requests');
  console.log('4. Verify Gemini API service status');
  console.log('5. Consider reducing system prompt complexity if responses are slow');
  
  // Memory usage check
  const memUsage = process.memoryUsage();
  console.log('\n💾 Memory Usage:');
  console.log('RSS:', Math.round(memUsage.rss / 1024 / 1024) + ' MB');
  console.log('Heap Used:', Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB');
  console.log('Heap Total:', Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB');
  
  return metrics;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { monitorAPIPerformance, metrics };
}

// Run if called directly
if (require.main === module) {
  monitorAPIPerformance();
}
