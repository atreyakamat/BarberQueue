const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Testing BarberQueue API...\n');
  
  try {
    // Test 1: Get all services
    console.log('1. Testing GET /api/services');
    const servicesResponse = await axios.get(`${API_BASE}/services`);
    console.log(`✅ Services count: ${servicesResponse.data.services.length}`);
    
    // Test 2: Login as customer
    console.log('\n2. Testing POST /api/auth/login (customer)');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      phone: '9876543213',
      password: 'password123'
    });
    console.log('✅ Customer login successful');
    const customerToken = loginResponse.data.token;
    
    // Test 3: Get customer profile
    console.log('\n3. Testing GET /api/auth/profile (customer)');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log(`✅ Customer profile: ${profileResponse.data.user.name}`);
    
    // Test 4: Get all users (should fail for customer)
    console.log('\n4. Testing GET /api/users (should fail for customer)');
    try {
      await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      console.log('❌ Should have failed');
    } catch (error) {
      console.log('✅ Correctly denied access');
    }
    
    // Test 5: Login as barber
    console.log('\n5. Testing POST /api/auth/login (barber)');
    const barberLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      phone: '9876543210',
      password: 'password123'
    });
    console.log('✅ Barber login successful');
    const barberToken = barberLoginResponse.data.token;
    
    // Test 6: Get barber bookings
    console.log('\n6. Testing GET /api/bookings/barber-bookings (barber)');
    const bookingsResponse = await axios.get(`${API_BASE}/bookings/barber-bookings`, {
      headers: { Authorization: `Bearer ${barberToken}` }
    });
    console.log(`✅ Barber bookings count: ${bookingsResponse.data.bookings.length}`);
    
    // Test 7: Get queue status (get first barber's queue)
    console.log('\n7. Testing GET /api/queue/{barberId}');
    const firstService = servicesResponse.data.services[0];
    const queueResponse = await axios.get(`${API_BASE}/queue/${firstService.barberId._id}`);
    console.log(`✅ Queue position count: ${queueResponse.data.currentPosition}`);
    
    // Test 8: Login as admin
    console.log('\n8. Testing POST /api/auth/login (admin)');
    const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      phone: '9999999999',
      password: 'admin123'
    });
    console.log('✅ Admin login successful');
    const adminToken = adminLoginResponse.data.token;
    
    // Test 9: Get all barbers (should work for everyone)
    console.log('\n9. Testing GET /api/users/barbers');
    const barbersResponse = await axios.get(`${API_BASE}/users/barbers`);
    console.log(`✅ Total barbers count: ${barbersResponse.data.barbers.length}`);
    
    console.log('\n🎉 All API tests passed successfully!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
}

testAPI();
