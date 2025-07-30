// Test barber registration and login specifically
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testBarberAuth() {
  console.log('🔍 Testing Barber Registration and Login Issues...\n');
  
  // Generate unique phone for testing
  const testPhone = `9${Math.floor(Math.random() * 900000000) + 100000000}`;
  console.log('Test phone:', testPhone);
  
  // Test 1: Barber Registration
  console.log('\n1️⃣ Testing Barber Registration...');
  
  const barberData = {
    name: 'Test Barber',
    phone: testPhone,
    password: 'barber123',
    role: 'barber',
    shopName: 'Test Barbershop',
    shopAddress: 'Test Address, Test City - 123456'
  };
  
  console.log('Registration data:', JSON.stringify(barberData, null, 2));
  
  try {
    const regResponse = await axios.post(`${BASE_URL}/auth/register`, barberData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ Registration successful!');
    console.log('Response:', JSON.stringify(regResponse.data, null, 2));
    
    // Test 2: Barber Login
    console.log('\n2️⃣ Testing Barber Login...');
    
    const loginData = {
      phone: testPhone,
      password: 'barber123'
    };
    
    console.log('Login data:', JSON.stringify(loginData, null, 2));
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
    
    // Test 3: Profile verification
    console.log('\n3️⃣ Testing Profile Access...');
    
    const token = loginResponse.data.token;
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      timeout: 10000
    });
    
    console.log('✅ Profile access successful!');
    console.log('Profile:', JSON.stringify(profileResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('Status:', error.response?.status || 'NO_STATUS');
    console.log('Error message:', error.response?.data?.message || error.message);
    console.log('Full error response:', JSON.stringify(error.response?.data || error.message, null, 2));
    
    if (error.response?.data?.errors) {
      console.log('Validation errors:');
      error.response.data.errors.forEach(err => {
        console.log(`  - ${err.msg}: ${err.param}`);
      });
    }
  }
}

testBarberAuth().catch(console.error);
