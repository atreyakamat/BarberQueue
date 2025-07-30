// Test frontend API connectivity
const axios = require('axios');

async function testFrontendAPI() {
  console.log('🌐 Testing Frontend API Connectivity...\n');
  
  const frontendAPIURL = 'http://localhost:3000/api'; // Through Vite proxy
  const directAPIURL = 'http://localhost:5000/api';   // Direct to backend
  
  // Test 1: Direct backend connection
  console.log('1️⃣ Testing direct backend connection...');
  try {
    const response = await axios.get(`${directAPIURL}/health`, { timeout: 5000 });
    console.log('✅ Direct backend connection working');
  } catch (error) {
    console.log('❌ Direct backend connection failed:', error.message);
  }
  
  // Test 2: Frontend proxy connection
  console.log('\n2️⃣ Testing frontend proxy connection...');
  try {
    const response = await axios.get(`${frontendAPIURL}/health`, { timeout: 5000 });
    console.log('✅ Frontend proxy connection working');
  } catch (error) {
    console.log('❌ Frontend proxy connection failed:', error.message);
    console.log('   This might explain login issues in the UI');
  }
  
  // Test 3: Barber login through both endpoints
  console.log('\n3️⃣ Testing barber login through direct backend...');
  try {
    const response = await axios.post(`${directAPIURL}/auth/login`, {
      phone: '9629152617',
      password: 'barber123'
    }, { timeout: 5000 });
    console.log('✅ Direct backend login working');
  } catch (error) {
    console.log('❌ Direct backend login failed:', error.response?.data?.message || error.message);
  }
  
  console.log('\n4️⃣ Testing barber login through frontend proxy...');
  try {
    const response = await axios.post(`${frontendAPIURL}/auth/login`, {
      phone: '9629152617',
      password: 'barber123'
    }, { timeout: 5000 });
    console.log('✅ Frontend proxy login working');
  } catch (error) {
    console.log('❌ Frontend proxy login failed:', error.response?.data?.message || error.message);
    console.log('   This explains why login fails in the UI!');
  }
  
  // Test 5: Check if frontend dev server is running
  console.log('\n5️⃣ Checking frontend dev server...');
  try {
    const response = await axios.get('http://localhost:3000', { timeout: 5000 });
    console.log('✅ Frontend dev server running');
  } catch (error) {
    console.log('❌ Frontend dev server not accessible:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 FRONTEND API CONNECTIVITY TEST COMPLETE');
  console.log('='.repeat(60));
  console.log('\n💡 DIAGNOSIS:');
  console.log('If direct backend works but proxy fails:');
  console.log('  - Vite proxy configuration issue');
  console.log('  - Frontend dev server not properly configured');
  console.log('\nIf both fail:');
  console.log('  - Backend server not running');
  console.log('  - Network connectivity issue');
}

testFrontendAPI().catch(console.error);
