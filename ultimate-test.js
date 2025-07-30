// Ultimate Integration Test - Full BarberQueue Functionality
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
      timeout: 15000
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

async function ultimateIntegrationTest() {
  console.log('🚀 ULTIMATE BARBERQUEUE INTEGRATION TEST 🚀\n');
  console.log('Testing complete end-to-end functionality...\n');
  
  let results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logResult(testName, success, message = '') {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}${message ? ': ' + message : ''}`);
    results.tests.push({ name: testName, success, message });
    if (success) results.passed++;
    else results.failed++;
  }

  // Phase 1: System Health
  console.log('🏥 PHASE 1: SYSTEM HEALTH\n');
  
  const health = await testEndpoint('/health');
  logResult('Health Check', health.success);

  // Phase 2: User Management
  console.log('\n👥 PHASE 2: USER MANAGEMENT\n');
  
  // Create test users
  const customerPhone = `9${Math.floor(Math.random() * 900000000) + 100000000}`;
  const barberPhone = `9${Math.floor(Math.random() * 900000000) + 100000000}`;
  
  const customerReg = await testEndpoint('/auth/register', 'POST', {
    name: 'Test Customer',
    phone: customerPhone,
    password: 'customer123',
    role: 'customer'
  });
  logResult('Customer Registration', customerReg.success);
  
  const barberReg = await testEndpoint('/auth/register', 'POST', {
    name: 'Test Barber Pro',
    phone: barberPhone,
    password: 'barber123',
    role: 'barber',
    shopName: 'Ultimate Test Barbershop',
    shopAddress: 'Test Street, Test City - 123456'
  });
  logResult('Barber Registration', barberReg.success);

  // Login all users
  const customerLogin = await testEndpoint('/auth/login', 'POST', {
    phone: customerPhone,
    password: 'customer123'
  });
  logResult('Customer Login', customerLogin.success);
  
  const barberLogin = await testEndpoint('/auth/login', 'POST', {
    phone: barberPhone,
    password: 'barber123'
  });
  logResult('Barber Login', barberLogin.success);
  
  const adminLogin = await testEndpoint('/auth/login', 'POST', {
    phone: '9999999999',
    password: 'admin123'
  });
  logResult('Admin Login', adminLogin.success);

  const customerToken = customerLogin.data?.token;
  const barberToken = barberLogin.data?.token;
  const adminToken = adminLogin.data?.token;

  const customerHeaders = { Authorization: `Bearer ${customerToken}` };
  const barberHeaders = { Authorization: `Bearer ${barberToken}` };
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // Phase 3: Data Retrieval
  console.log('\n📊 PHASE 3: DATA RETRIEVAL\n');
  
  const barbers = await testEndpoint('/users/barbers', 'GET', null, adminHeaders);
  logResult('Fetch Barbers List', barbers.success, `${barbers.data?.barbers?.length || 0} barbers`);
  
  const services = await testEndpoint('/services', 'GET', null, adminHeaders);
  logResult('Fetch Services List', services.success, `${services.data?.services?.length || 0} services`);

  // Phase 4: Dashboard Testing
  console.log('\n📈 PHASE 4: DASHBOARD TESTING\n');
  
  const adminDashboard = await testEndpoint('/users/dashboard', 'GET', null, adminHeaders);
  logResult('Admin Dashboard', adminDashboard.success);
  
  const customerDashboard = await testEndpoint('/users/dashboard', 'GET', null, customerHeaders);
  logResult('Customer Dashboard', customerDashboard.success);
  
  const barberDashboard = await testEndpoint('/users/dashboard', 'GET', null, barberHeaders);
  logResult('Barber Dashboard', barberDashboard.success);

  // Phase 5: Barber-Specific Features
  console.log('\n💼 PHASE 5: BARBER-SPECIFIC FEATURES\n');
  
  const barberBookings = await testEndpoint('/bookings/barber-bookings', 'GET', null, barberHeaders);
  logResult('Barber Bookings', barberBookings.success, `${barberBookings.data?.bookings?.length || 0} bookings`);
  
  const myQueue = await testEndpoint('/queue/my-queue', 'GET', null, barberHeaders);
  logResult('My Queue', myQueue.success, `Queue length: ${myQueue.data?.queueLength || 0}`);
  
  const barberStats = await testEndpoint('/bookings/stats', 'GET', null, barberHeaders);
  logResult('Barber Statistics', barberStats.success);
  
  const todayBookings = await testEndpoint('/bookings/today', 'GET', null, barberHeaders);
  logResult('Today\'s Bookings', todayBookings.success, `${todayBookings.data?.bookings?.length || 0} today`);
  
  const toggleAvailability = await testEndpoint('/auth/toggle-availability', 'POST', null, barberHeaders);
  logResult('Toggle Availability', toggleAvailability.success, `Now ${toggleAvailability.data?.isAvailable ? 'available' : 'unavailable'}`);

  // Phase 6: Booking Workflow
  console.log('\n📅 PHASE 6: BOOKING WORKFLOW\n');
  
  if (barbers.success && services.success && customerToken) {
    const barbersList = barbers.data.barbers || barbers.data;
    const servicesList = services.data.services || services.data;
    
    if (barbersList.length > 0 && servicesList.length > 0) {
      // Find a service that belongs to any barber
      const selectedBarber = barbersList[0];
      const barberService = servicesList.find(service => {
        const serviceBarberId = service.barberId?._id || service.barberId || service.barber;
        return serviceBarberId === selectedBarber._id;
      });
      
      if (barberService) {
        const booking = await testEndpoint('/bookings', 'POST', {
          barberId: selectedBarber._id,
          services: [barberService._id],
          scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Ultimate integration test booking'
        }, customerHeaders);
        
        logResult('Create Booking', booking.success);
        
        if (booking.success) {
          const bookingId = booking.data.booking?._id || booking.data._id;
          
          // Test booking retrieval
          const getBooking = await testEndpoint(`/bookings/${bookingId}`, 'GET', null, customerHeaders);
          logResult('Retrieve Booking', getBooking.success);
          
          // Test my bookings
          const myBookings = await testEndpoint('/bookings/my-bookings', 'GET', null, customerHeaders);
          logResult('My Bookings', myBookings.success, `${myBookings.data?.bookings?.length || 0} bookings`);
          
          // Test cancellation
          const cancelBooking = await testEndpoint(`/bookings/${bookingId}/cancel`, 'PUT', null, customerHeaders);
          logResult('Cancel Booking', cancelBooking.success);
        }
      } else {
        logResult('Create Booking', false, 'No matching service found for barber');
      }
    } else {
      logResult('Create Booking', false, 'No barbers or services available');
    }
  } else {
    logResult('Create Booking', false, 'Prerequisites not met');
  }

  // Phase 7: Queue Management
  console.log('\n🚶‍♂️ PHASE 7: QUEUE MANAGEMENT\n');
  
  if (barbers.success) {
    const barbersList = barbers.data.barbers || barbers.data;
    if (barbersList.length > 0) {
      const queueStatus = await testEndpoint(`/queue/${barbersList[0]._id}`, 'GET');
      logResult('Queue Status', queueStatus.success);
    }
  }

  // Phase 8: Access Control Testing
  console.log('\n🔐 PHASE 8: ACCESS CONTROL TESTING\n');
  
  // Test unauthorized access
  const unauthorized = await testEndpoint('/bookings/barber-bookings', 'GET', null, customerHeaders);
  logResult('Customer Access to Barber Endpoints (Should Fail)', !unauthorized.success, 'Correctly blocked');
  
  const unauthorized2 = await testEndpoint('/queue/my-queue', 'GET', null, customerHeaders);
  logResult('Customer Access to Queue Endpoints (Should Fail)', !unauthorized2.success, 'Correctly blocked');

  // Final Results
  console.log('\n' + '='.repeat(60));
  console.log('🎯 ULTIMATE INTEGRATION TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ PASSED: ${results.passed}`);
  console.log(`❌ FAILED: ${results.failed}`);
  console.log(`📊 TOTAL: ${results.passed + results.failed}`);
  console.log(`🎉 SUCCESS RATE: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎊 CONGRATULATIONS! ALL TESTS PASSED! 🎊');
    console.log('BarberQueue application is fully operational and production-ready!');
  } else {
    console.log('\n⚠️ Some tests failed. Review the results above.');
    console.log('\nFailed tests:');
    results.tests.filter(t => !t.success).forEach(t => {
      console.log(`   ❌ ${t.name}: ${t.message}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

ultimateIntegrationTest().catch(console.error);
