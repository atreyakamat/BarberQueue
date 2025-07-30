// Comprehensive test to verify all functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testEndpoint(url, method = 'GET', data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      status: error.response?.status || 'NO_RESPONSE',
      error: error.response?.data?.message || error.message 
    };
  }
}

async function comprehensiveTest() {
  console.log('🧪 Starting Comprehensive BarberQueue Test...\n');
  
  let token = null;
  
  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check...');
  const health = await testEndpoint('/health');
  if (health.success) {
    console.log('✅ Health check passed');
  } else {
    console.log('❌ Health check failed:', health.error);
    return;
  }
  
  // Test 2: Login
  console.log('\n2️⃣ Testing Login...');
  const login = await testEndpoint('/auth/login', 'POST', {
    phone: '9999999999',
    password: 'admin123'
  });
  
  if (login.success) {
    console.log('✅ Login successful');
    token = login.data.token;
  } else {
    console.log('❌ Login failed:', login.error);
    return;
  }
  
  const authHeaders = { Authorization: `Bearer ${token}` };
  
  // Test 3: Profile
  console.log('\n3️⃣ Testing Profile...');
  const profile = await testEndpoint('/auth/profile', 'GET', null, authHeaders);
  if (profile.success) {
    console.log('✅ Profile fetched:', profile.data.user?.name || 'Unknown');
  } else {
    console.log('❌ Profile failed:', profile.error);
  }
  
  // Test 4: All Endpoints
  console.log('\n4️⃣ Testing All Endpoints...');
  const endpoints = [
    { path: '/users/barbers', name: 'Barbers List' },
    { path: '/users/dashboard', name: 'Dashboard' },
    { path: '/services', name: 'Services' },
    { path: '/bookings/my-bookings', name: 'My Bookings' },
    { path: '/bookings/barber-bookings', name: 'Barber Bookings' },
    { path: '/queue/my-queue', name: 'My Queue' },
  ];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.path, 'GET', null, authHeaders);
    if (result.success) {
      console.log(`✅ ${endpoint.name} - Status: ${result.status}`);
      if (Array.isArray(result.data)) {
        console.log(`   📊 Count: ${result.data.length} items`);
      } else if (result.data && typeof result.data === 'object') {
        console.log(`   📊 Keys: ${Object.keys(result.data).join(', ')}`);
      }
    } else {
      console.log(`❌ ${endpoint.name} - Error: ${result.status} ${result.error}`);
    }
  }
  
  // Test 5: Create Booking (if barbers exist)
  console.log('\n5️⃣ Testing Booking Creation...');
  const barbersResult = await testEndpoint('/users/barbers', 'GET', null, authHeaders);
  const servicesResult = await testEndpoint('/services', 'GET', null, authHeaders);
  
  if (barbersResult.success && servicesResult.success && 
      barbersResult.data.length > 0 && servicesResult.data.length > 0) {
    
    const testBooking = {
      barberId: barbersResult.data[0]._id,
      services: [servicesResult.data[0]._id],
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      notes: 'Test booking'
    };
    
    const booking = await testEndpoint('/bookings', 'POST', testBooking, authHeaders);
    if (booking.success) {
      console.log('✅ Booking created successfully');
      
      // Clean up - cancel the test booking
      const bookingId = booking.data.booking?._id || booking.data._id;
      if (bookingId) {
        await testEndpoint(`/bookings/${bookingId}/cancel`, 'PUT', null, authHeaders);
        console.log('🧹 Test booking cleaned up');
      }
    } else {
      console.log('❌ Booking creation failed:', booking.error);
    }
  } else {
    console.log('⚠️ Skipping booking test - no barbers or services available');
  }
  
  console.log('\n🎯 Test Summary Complete!');
}

comprehensiveTest().catch(console.error);
