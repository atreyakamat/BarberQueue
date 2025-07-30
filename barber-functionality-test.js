// Test specifically for barber functionality issues
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
  console.log('🔧 Testing Barber-Specific Functionality...\n');
  
  // Step 1: Create a new barber account
  console.log('1️⃣ Creating Barber Account...');
  const barberPhone = `9${Math.floor(Math.random() * 900000000) + 100000000}`;
  
  const barberRegistration = await testEndpoint('/auth/register', 'POST', {
    name: 'Test Barber Pro',
    phone: barberPhone,
    password: 'barber123',
    role: 'barber',
    shopName: 'Test Barbershop',
    shopAddress: 'Test Street, Test City - 123456'
  });
  
  if (!barberRegistration.success) {
    console.log('❌ Failed to create barber account:', barberRegistration.error);
    return;
  }
  
  console.log('✅ Barber account created successfully');
  const barberToken = barberRegistration.data.token;
  const barberHeaders = { Authorization: `Bearer ${barberToken}` };
  
  // Step 2: Test barber-specific endpoints
  console.log('\n2️⃣ Testing Barber Dashboard...');
  const dashboard = await testEndpoint('/users/dashboard', 'GET', null, barberHeaders);
  if (dashboard.success) {
    console.log('✅ Barber dashboard working');
    console.log('   Keys:', Object.keys(dashboard.data).join(', '));
  } else {
    console.log('❌ Barber dashboard failed:', dashboard.error);
  }
  
  console.log('\n3️⃣ Testing Barber Bookings...');
  const barberBookings = await testEndpoint('/bookings/barber-bookings', 'GET', null, barberHeaders);
  if (barberBookings.success) {
    console.log('✅ Barber bookings working');
    console.log('   Bookings count:', barberBookings.data?.bookings?.length || 0);
  } else {
    console.log('❌ Barber bookings failed:', barberBookings.error);
    console.log('   Full error:', JSON.stringify(barberBookings.fullError, null, 2));
  }
  
  console.log('\n4️⃣ Testing My Queue...');
  const myQueue = await testEndpoint('/queue/my-queue', 'GET', null, barberHeaders);
  if (myQueue.success) {
    console.log('✅ My queue working');
    console.log('   Queue data:', JSON.stringify(myQueue.data, null, 2));
  } else {
    console.log('❌ My queue failed:', myQueue.error);
    console.log('   Full error:', JSON.stringify(myQueue.fullError, null, 2));
  }
  
  console.log('\n5️⃣ Testing Barber Statistics...');
  const stats = await testEndpoint('/bookings/stats', 'GET', null, barberHeaders);
  if (stats.success) {
    console.log('✅ Barber statistics working');
    console.log('   Stats:', JSON.stringify(stats.data, null, 2));
  } else {
    console.log('❌ Barber statistics failed:', stats.error);
    console.log('   Full error:', JSON.stringify(stats.fullError, null, 2));
  }
  
  console.log('\n6️⃣ Testing Today\'s Bookings...');
  const today = await testEndpoint('/bookings/today', 'GET', null, barberHeaders);
  if (today.success) {
    console.log('✅ Today\'s bookings working');
    console.log('   Today\'s count:', today.data?.bookings?.length || 0);
  } else {
    console.log('❌ Today\'s bookings failed:', today.error);
    console.log('   Full error:', JSON.stringify(today.fullError, null, 2));
  }
  
  console.log('\n7️⃣ Testing Availability Toggle...');
  const toggle = await testEndpoint('/auth/toggle-availability', 'POST', null, barberHeaders);
  if (toggle.success) {
    console.log('✅ Availability toggle working');
    console.log('   New availability:', toggle.data?.isAvailable);
  } else {
    console.log('❌ Availability toggle failed:', toggle.error);
    console.log('   Full error:', JSON.stringify(toggle.fullError, null, 2));
  }
  
  console.log('\n8️⃣ Testing Profile Access...');
  const profile = await testEndpoint('/auth/profile', 'GET', null, barberHeaders);
  if (profile.success) {
    console.log('✅ Profile access working');
    console.log('   Barber:', profile.data.user?.name, '- Role:', profile.data.user?.role);
    console.log('   Shop:', profile.data.user?.shopName);
  } else {
    console.log('❌ Profile access failed:', profile.error);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 BARBER FUNCTIONALITY TEST COMPLETE');
  console.log('='.repeat(50));
}

testBarberFunctionality().catch(console.error);
