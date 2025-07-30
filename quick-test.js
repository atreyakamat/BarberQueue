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
      },
      timeout: 10000  // 10 second timeout
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
  
  // Test 2: Registration
  console.log('\n2️⃣ Testing Registration...');
  const randomPhone = `9${Math.floor(Math.random() * 900000000) + 100000000}`;
  const registrationData = {
    name: 'Test User',
    phone: randomPhone,
    password: 'testpass123',
    role: 'customer'
  };
  
  const registration = await testEndpoint('/auth/register', 'POST', registrationData);
  if (registration.success) {
    console.log('✅ Registration successful for phone:', randomPhone);
    console.log('   User:', registration.data.user?.name);
  } else {
    console.log('❌ Registration failed:', registration.error);
  }

  // Test 3: Login as Customer for booking tests
  console.log('\n3️⃣ Testing Customer Login...');
  const customerLogin = await testEndpoint('/auth/login', 'POST', {
    phone: randomPhone,
    password: 'testpass123'
  });
  
  let customerToken = null;
  if (customerLogin.success) {
    console.log('✅ Customer login successful');
    customerToken = customerLogin.data.token;
  } else {
    console.log('❌ Customer login failed:', customerLogin.error);
  }

  // Test 4: Login as Admin for system tests
  console.log('\n4️⃣ Testing Admin Login...');
  const login = await testEndpoint('/auth/login', 'POST', {
    phone: '9999999999',
    password: 'admin123'
  });
  
  if (login.success) {
    console.log('✅ Admin login successful');
    token = login.data.token;
  } else {
    console.log('❌ Admin login failed:', login.error);
    return;
  }
  
  const authHeaders = { Authorization: `Bearer ${token}` };
  const customerAuthHeaders = { Authorization: `Bearer ${customerToken}` };
  
  // Test 5: Profile
  console.log('\n4️⃣ Testing Profile...');
  const profile = await testEndpoint('/auth/profile', 'GET', null, authHeaders);
  if (profile.success) {
    console.log('✅ Profile fetched:', profile.data.user?.name || 'Unknown');
  } else {
    console.log('❌ Profile failed:', profile.error);
  }
  
  // Test 6: All Endpoints
  console.log('\n6️⃣ Testing All Endpoints...');
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
        // If data contains arrays, show their lengths
        Object.keys(result.data).forEach(key => {
          if (Array.isArray(result.data[key])) {
            console.log(`   📊 ${key}: ${result.data[key].length} items`);
          }
        });
      }
    } else {
      console.log(`❌ ${endpoint.name} - Error: ${result.status} ${result.error}`);
    }
  }
  
  // Test 7: Create Booking (if barbers exist)
  console.log('\n7️⃣ Testing Booking Creation...');
  if (!customerToken) {
    console.log('⚠️ Skipping booking test - no customer token available');
  } else {
    const barbersResult = await testEndpoint('/users/barbers', 'GET', null, authHeaders);
    const servicesResult = await testEndpoint('/services', 'GET', null, authHeaders);
    
    console.log('Barbers result:', barbersResult.success, barbersResult.data?.barbers?.length || barbersResult.data?.length);
    console.log('Services result:', servicesResult.success, servicesResult.data?.services?.length || servicesResult.data?.length);
    
    if (barbersResult.success && servicesResult.success) {
      // Fix data access - check if data is wrapped in an object or is direct array
      const barbers = barbersResult.data.barbers || barbersResult.data;
      const services = servicesResult.data.services || servicesResult.data;
      
      if (barbers && barbers.length > 0 && services && services.length > 0) {
        // Find a service that belongs to the selected barber
        const selectedBarber = barbers[0];
        const barberService = services.find(service => {
          const serviceBarberId = service.barberId?._id || service.barberId || service.barber;
          return serviceBarberId === selectedBarber._id;
        });
        
        if (!barberService) {
          console.log('⚠️ No services found for selected barber');
          console.log('Barber:', selectedBarber._id);
          console.log('Available services:', services.map(s => ({id: s._id, barberId: s.barberId || s.barber})));
          return;
        }
        
        const testBooking = {
          barberId: selectedBarber._id,
          services: [barberService._id],
          scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          notes: 'Test booking'
        };
        
        console.log('Creating booking with:', JSON.stringify(testBooking, null, 2));
        
        const booking = await testEndpoint('/bookings', 'POST', testBooking, customerAuthHeaders);
        if (booking.success) {
          console.log('✅ Booking created successfully');
          
          // Clean up - cancel the test booking
          const bookingId = booking.data.booking?._id || booking.data._id;
          if (bookingId) {
            await testEndpoint(`/bookings/${bookingId}/cancel`, 'PUT', null, customerAuthHeaders);
            console.log('🧹 Test booking cleaned up');
          }
        } else {
          console.log('❌ Booking creation failed:', booking.error);
          console.log('Full error response:', JSON.stringify(booking, null, 2));
        }
      } else {
        console.log('⚠️ Skipping booking test - no barbers or services available');
        console.log('Barbers:', barbers?.length || 0, 'Services:', services?.length || 0);
      }
    } else {
      console.log('⚠️ Failed to fetch barbers or services');
      if (!barbersResult.success) console.log('Barbers error:', barbersResult.error);
      if (!servicesResult.success) console.log('Services error:', servicesResult.error);
    }
  }
  
  console.log('\n🎯 Test Summary Complete!');
}

comprehensiveTest().catch(console.error);
