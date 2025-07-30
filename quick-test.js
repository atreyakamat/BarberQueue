// Quick test to verify basic functionality
const axios = require('axios');

async function quickTest() {
  try {
    console.log('Testing basic auth flow...');
    
    // Step 1: Test login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      phone: '9999999999',
      password: 'admin123'
    });
    
    console.log('✅ Login successful');
    
    // Step 2: Test profile with token
    const token = loginResponse.data.token;
    const profileResponse = await axios.get('http://localhost:5000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Profile fetched:', profileResponse.data.user.name);
    
    // Step 3: Test basic endpoints
    const endpoints = [
      '/users/barbers',
      '/services',
      '/bookings/my-bookings',
      '/users/dashboard'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:5000/api${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        if (endpoint === '/users/dashboard') {
          console.log('Dashboard data keys:', Object.keys(response.data));
        }
      } catch (err) {
        console.log(`❌ ${endpoint} - Error: ${err.response?.status} ${err.response?.data?.message || err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

quickTest();
