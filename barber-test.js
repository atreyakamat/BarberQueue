// Test barber-specific functionality
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
      },
      timeout: 10000
    };
    
    if (data) {
      config.data = data;
    }
    
    console.log(`🔄 ${method} ${url}...`);
    const response = await axios(config);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    console.log(`❌ ${method} ${url} failed:`, error.code || error.message);
    return { 
      success: false, 
      status: error.response?.status || 'NO_RESPONSE',
      error: error.response?.data?.message || error.message,
      fullError: error.response?.data || error.message
    };
  }
}

async function testBarberFunctionality() {
  console.log('🧑‍💼 Testing Barber-Specific Functionality...\n');
  
  // Step 1: Create a new barber account
  console.log('1️⃣ Creating Barber Account...');
  const randomPhone = `9${Math.floor(Math.random() * 900000000) + 100000000}`;
  const barberData = {
    name: 'Test Barber',
    phone: randomPhone,
    password: 'barber123',
    role: 'barber',
    shopName: 'Test Barber Shop',
    shopAddress: 'Test Address, Test City - 123456'
  };
  
  const barberRegistration = await testEndpoint('/auth/register', 'POST', barberData);
  if (!barberRegistration.success) {
    console.log('❌ Failed to create barber account:', barberRegistration.error);
    return;
  }
  console.log('✅ Barber account created:', barberData.name);
  
  // Step 2: Login as barber
  console.log('\n2️⃣ Barber Login...');
  const barberLogin = await testEndpoint('/auth/login', 'POST', {
    phone: randomPhone,
    password: 'barber123'
  });
  
  if (!barberLogin.success) {
    console.log('❌ Barber login failed:', barberLogin.error);
    return;
  }
  
  const barberToken = barberLogin.data.token;
  const barberHeaders = { Authorization: `Bearer ${barberToken}` };
  console.log('✅ Barber login successful');
  
  // Step 3: Test barber dashboard
  console.log('\n3️⃣ Testing Barber Dashboard...');
  const dashboard = await testEndpoint('/users/dashboard', 'GET', null, barberHeaders);
  if (dashboard.success) {
    console.log('✅ Barber dashboard loaded');
    console.log('   Dashboard keys:', Object.keys(dashboard.data).join(', '));
  } else {
    console.log('❌ Barber dashboard failed:', dashboard.error);
  }
  
  // Step 4: Test barber bookings
  console.log('\n4️⃣ Testing Barber Bookings...');
  const barberBookings = await testEndpoint('/bookings/barber-bookings', 'GET', null, barberHeaders);
  if (barberBookings.success) {
    console.log('✅ Barber bookings retrieved');
    console.log('   Bookings count:', barberBookings.data.bookings?.length || 0);
  } else {
    console.log('❌ Barber bookings failed:', barberBookings.error);
  }
  
  // Step 5: Test my queue
  console.log('\n5️⃣ Testing My Queue...');
  const myQueue = await testEndpoint('/queue/my-queue', 'GET', null, barberHeaders);
  if (myQueue.success) {
    console.log('✅ My queue retrieved');
    console.log('   Queue length:', myQueue.data.queueLength || 0);
    console.log('   Currently serving:', myQueue.data.currentlyServing ? 'Yes' : 'No');
  } else {
    console.log('❌ My queue failed:', myQueue.error);
  }
  
  // Step 6: Test stats endpoint
  console.log('\n6️⃣ Testing Barber Stats...');
  const stats = await testEndpoint('/bookings/stats', 'GET', null, barberHeaders);
  if (stats.success) {
    console.log('✅ Barber stats retrieved');
    console.log('   Stats keys:', Object.keys(stats.data).join(', '));
  } else {
    console.log('❌ Barber stats failed:', stats.error);
  }
  
  // Step 7: Test today's bookings
  console.log('\n7️⃣ Testing Today\'s Bookings...');
  const todayBookings = await testEndpoint('/bookings/today', 'GET', null, barberHeaders);
  if (todayBookings.success) {
    console.log('✅ Today\'s bookings retrieved');
    console.log('   Today\'s bookings count:', todayBookings.data.bookings?.length || 0);
  } else {
    console.log('❌ Today\'s bookings failed:', todayBookings.error);
  }
  
  // Step 8: Test availability toggle
  console.log('\n8️⃣ Testing Availability Toggle...');
  const toggleAvailability = await testEndpoint('/auth/toggle-availability', 'POST', null, barberHeaders);
  if (toggleAvailability.success) {
    console.log('✅ Availability toggled');
    console.log('   New availability:', toggleAvailability.data.isAvailable ? 'Available' : 'Unavailable');
  } else {
    console.log('❌ Availability toggle failed:', toggleAvailability.error);
  }
  
  console.log('\n🎯 Barber Functionality Test Complete!');
}

testBarberFunctionality().catch(console.error);
