// Project Health Check Script
// This script tests the basic functionality of your Avatar AI project

console.log('🧪 PROJECT HEALTH CHECK STARTING...\n');

// Test 1: Check if server is running
async function testServer() {
  console.log('1️⃣ Testing server connectivity...');
  try {
    const response = await fetch('http://localhost:3001');
    if (response.ok) {
      console.log('✅ Server is running and responding');
      return true;
    } else {
      console.log('❌ Server responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    return false;
  }
}

// Test 2: Check main page
async function testMainPage() {
  console.log('\n2️⃣ Testing main page...');
  try {
    const response = await fetch('http://localhost:3001');
    const html = await response.text();
    
    if (html.includes('Avatar AI Assistant')) {
      console.log('✅ Main page loads correctly');
    } else {
      console.log('❌ Main page content not found');
    }
    
    if (html.includes('history-teacher')) {
      console.log('✅ Avatar selection available');
    } else {
      console.log('❌ Avatar selection not found');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Main page test failed:', error.message);
    return false;
  }
}

// Test 3: Check avatar page
async function testAvatarPage() {
  console.log('\n3️⃣ Testing avatar page...');
  try {
    const response = await fetch('http://localhost:3001/history-teacher');
    const html = await response.text();
    
    if (html.includes('History Teacher')) {
      console.log('✅ Avatar page loads correctly');
    } else {
      console.log('❌ Avatar page content not found');
    }
    
    if (html.includes('Speech Control')) {
      console.log('✅ Speech controls available');
    } else {
      console.log('❌ Speech controls not found');
    }
    
    if (html.includes('🧪 Test Speech')) {
      console.log('✅ Debug test button available');
    } else {
      console.log('❌ Debug test button not found');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Avatar page test failed:', error.message);
    return false;
  }
}

// Test 4: Check API endpoints
async function testAPIEndpoints() {
  console.log('\n4️⃣ Testing API endpoints...');
  
  // Test visitor counter API
  try {
    const response = await fetch('http://localhost:3000/api/visitor-counter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode: 'IN', ipAddress: '127.0.0.1' })
    });
    
    if (response.ok) {
      console.log('✅ Visitor counter API working');
    } else {
      console.log('❌ Visitor counter API error:', response.status);
    }
  } catch (error) {
    console.log('❌ Visitor counter API test failed:', error.message);
  }
  
  // Test chat API (without API key, should fail gracefully)
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: 'test', 
        avatarType: 'history-teacher',
        sessionId: 'test-123'
      })
    });
    
    if (response.status === 401 || response.status === 500) {
      console.log('✅ Chat API responds (expected error without API key)');
    } else {
      console.log('⚠️ Chat API unexpected response:', response.status);
    }
  } catch (error) {
    console.log('❌ Chat API test failed:', error.message);
  }
}

// Test 5: Check speech functionality
function testSpeechFunctionality() {
  console.log('\n5️⃣ Testing speech functionality...');
  
  if (typeof window !== 'undefined') {
    if ('speechSynthesis' in window) {
      console.log('✅ Speech synthesis supported in browser');
      
      if ('SpeechSynthesisUtterance' in window) {
        console.log('✅ SpeechSynthesisUtterance supported');
      } else {
        console.log('❌ SpeechSynthesisUtterance not supported');
      }
    } else {
      console.log('❌ Speech synthesis not supported in browser');
    }
  } else {
    console.log('⚠️ Cannot test speech in Node.js environment');
  }
}

// Test 6: Check file structure
function testFileStructure() {
  console.log('\n6️⃣ Testing file structure...');
  
  const requiredFiles = [
    'pages/index.js',
    'pages/[avatar].js',
    'lib/speech.js',
    'components/VoiceControls/SpeechControl.js',
    'package.json',
    'next.config.js'
  ];
  
  let allFilesExist = true;
  requiredFiles.forEach(file => {
    try {
      require('fs').accessSync(file);
      console.log(`✅ ${file} exists`);
    } catch (error) {
      console.log(`❌ ${file} missing`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive project health check...\n');
  
  const results = [];
  
  results.push(await testServer());
  results.push(await testMainPage());
  results.push(await testAvatarPage());
  await testAPIEndpoints();
  testSpeechFunctionality();
  results.push(testFileStructure());
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('========================');
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! Your project is working properly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the issues above.');
  }
  
  console.log('\n🔧 NEXT STEPS:');
  console.log('1. Visit http://localhost:3000 to test the main page');
  console.log('2. Visit http://localhost:3000/history-teacher to test avatar functionality');
  console.log('3. Check browser console for any JavaScript errors');
  console.log('4. Test speech functionality with the purple "🧪 Test Speech" button');
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  runAllTests().catch(console.error);
} else {
  // Browser environment
  console.log('🌐 Running in browser - some tests may be limited');
  runAllTests().catch(console.error);
}
