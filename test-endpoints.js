#!/usr/bin/env node

// Simple endpoint test script
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testEndpoints() {
  console.log('🧪 Testing BarberQueue API Endpoints...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check:', health.data.status);
    
    // Test 2: Login
    console.log('\n2. Testing login...');
    const login = await axios.post(`${API_BASE}/auth/login`, {
      phone: '9999999999',
      password: 'admin123'
    });
    console.log('✅ Login successful');
    const token = login.data.token;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test 3: Profile
    console.log('\n3. Testing profile endpoint...');
    const profile = await axios.get(`${API_BASE}/auth/profile`, { headers });
    console.log('✅ Profile fetched:', profile.data.user.name);
    
    // Test 4: Dashboard (if user is admin, should work)
    console.log('\n4. Testing dashboard endpoint...');
    try {
      const dashboard = await axios.get(`${API_BASE}/users/dashboard`, { headers });
      console.log('✅ Dashboard data fetched successfully');
    } catch (err) {
      console.log('⚠️  Dashboard endpoint error:', err.response?.data?.message || err.message);
    }
    
    // Test 5: Barbers list
    console.log('\n5. Testing barbers list...');
    const barbers = await axios.get(`${API_BASE}/users/barbers`, { headers });
    console.log('✅ Barbers list fetched:', barbers.data.length, 'barbers');
    
    // Test 6: Services
    console.log('\n6. Testing services...');
    const services = await axios.get(`${API_BASE}/services`, { headers });
    console.log('✅ Services fetched:', services.data.length, 'services');
    
    // Test 7: My bookings
    console.log('\n7. Testing my bookings...');
    const bookings = await axios.get(`${API_BASE}/bookings/my-bookings`, { headers });
    console.log('✅ Bookings fetched:', bookings.data.length, 'bookings');
    
    console.log('\n🎉 All core endpoints are working!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
}

testEndpoints();
