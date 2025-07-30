// Test post-login flow for barber
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testPostLoginFlow() {
  console.log('🔄 Testing Post-Login Flow for Barber...\n');
  
  // Step 1: Login as barber
  console.log('1️⃣ Logging in as barber...');
  
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      phone: '9629152617',
      password: 'barber123'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('   User:', user.name, '- Role:', user.role);
    console.log('   Shop:', user.shopName);
    
    // Step 2: Test barber dashboard data fetch
    console.log('\n2️⃣ Testing barber dashboard endpoints...');
    
    // Test stats
    const statsResponse = await axios.get(`${BASE_URL}/bookings/stats`, { headers });
    console.log('✅ Stats endpoint working');
    console.log('   Stats:', JSON.stringify(statsResponse.data, null, 2));
    
    // Test today's bookings
    const todayResponse = await axios.get(`${BASE_URL}/bookings/today`, { headers });
    console.log('✅ Today\'s bookings endpoint working');
    console.log('   Today\'s bookings:', todayResponse.data.bookings?.length || 0);
    
    // Test queue
    const queueResponse = await axios.get(`${BASE_URL}/queue/my-queue`, { headers });
    console.log('✅ Queue endpoint working');
    console.log('   Queue length:', queueResponse.data.queueLength);
    
    // Test all barber bookings
    const allBookingsResponse = await axios.get(`${BASE_URL}/bookings/barber-bookings`, { headers });
    console.log('✅ All bookings endpoint working');
    console.log('   Total bookings:', allBookingsResponse.data.bookings?.length || 0);
    
    // Step 3: Test profile access
    console.log('\n3️⃣ Testing profile access...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, { headers });
    console.log('✅ Profile endpoint working');
    console.log('   Available:', profileResponse.data.user.isAvailable);
    
    // Step 4: Test availability toggle
    console.log('\n4️⃣ Testing availability toggle...');
    const toggleResponse = await axios.post(`${BASE_URL}/auth/toggle-availability`, {}, { headers });
    console.log('✅ Availability toggle working');
    console.log('   New availability:', toggleResponse.data.isAvailable);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 POST-LOGIN FLOW TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\n✅ All endpoints working correctly after login!');
    console.log('\nIf the UI still has issues, check:');
    console.log('1. Browser console for JavaScript errors');
    console.log('2. Network tab for failed requests');
    console.log('3. React component state management');
    console.log('4. Browser cache - try hard refresh (Ctrl+Shift+R)');
    
  } catch (error) {
    console.log('❌ Error in post-login flow:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message || error.message);
    console.log('Full error:', JSON.stringify(error.response?.data, null, 2));
  }
}

testPostLoginFlow().catch(console.error);
