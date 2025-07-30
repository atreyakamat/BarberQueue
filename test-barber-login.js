// Test barber login specifically
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testBarberLogin() {
  console.log('🔐 Testing Barber Login Issues...\n');
  
  // Test with existing barber account first
  console.log('1️⃣ Testing with existing barber account...');
  
  // Try logging in with a known barber account
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      phone: '9629152617', // From our previous test
      password: 'barber123'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ Existing barber login successful!');
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Existing barber login failed:', error.response?.data?.message || error.message);
    
    // If that fails, let's create a new barber and test
    console.log('\n2️⃣ Creating new barber account for testing...');
    
    const newBarberPhone = `9${Math.floor(Math.random() * 900000000) + 100000000}`;
    
    try {
      // Register new barber
      const regResponse = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'New Test Barber',
        phone: newBarberPhone,
        password: 'newbarber123',
        role: 'barber',
        shopName: 'New Test Shop',
        shopAddress: 'New Test Address'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      console.log('✅ New barber registration successful!');
      console.log('Phone:', newBarberPhone);
      
      // Now test login with new barber
      console.log('\n3️⃣ Testing login with new barber...');
      
      const newLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        phone: newBarberPhone,
        password: 'newbarber123'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      console.log('✅ New barber login successful!');
      console.log('Login response:', JSON.stringify(newLoginResponse.data, null, 2));
      
      // Test profile access
      console.log('\n4️⃣ Testing profile access...');
      const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: { 
          'Authorization': `Bearer ${newLoginResponse.data.token}`,
          'Content-Type': 'application/json' 
        },
        timeout: 10000
      });
      
      console.log('✅ Profile access successful!');
      console.log('Profile role:', profileResponse.data.user?.role);
      console.log('Shop name:', profileResponse.data.user?.shopName);
      
    } catch (innerError) {
      console.log('❌ New barber creation/login failed:');
      console.log('Status:', innerError.response?.status);
      console.log('Error:', innerError.response?.data?.message || innerError.message);
      console.log('Full response:', JSON.stringify(innerError.response?.data, null, 2));
      
      if (innerError.response?.data?.errors) {
        console.log('Validation errors:');
        innerError.response.data.errors.forEach(err => {
          console.log(`  - ${err.msg}: ${err.param}`);
        });
      }
    }
  }
  
  // Test common login issues
  console.log('\n5️⃣ Testing common login issues...');
  
  // Test with wrong password
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      phone: '9629152617',
      password: 'wrongpassword'
    });
  } catch (error) {
    console.log('✅ Wrong password correctly rejected:', error.response?.data?.message);
  }
  
  // Test with non-existent phone
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      phone: '9999999998',
      password: 'anypassword'
    });
  } catch (error) {
    console.log('✅ Non-existent phone correctly rejected:', error.response?.data?.message);
  }
  
  // Test with invalid phone format
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      phone: '123',
      password: 'anypassword'
    });
  } catch (error) {
    console.log('✅ Invalid phone format correctly rejected:', error.response?.data?.message || 'Validation error');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 BARBER LOGIN TEST COMPLETE');
  console.log('='.repeat(50));
}

testBarberLogin().catch(console.error);
