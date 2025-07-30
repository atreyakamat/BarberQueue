// Comprehensive test for all user registration and login flows
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
    return { 
      success: false, 
      status: error.response?.status || 'NO_RESPONSE',
      error: error.response?.data?.message || error.message,
      fullError: error.response?.data || error.message
    };
  }
}

async function testAllUserFlows() {
  console.log('🚀 COMPREHENSIVE USER FLOW TEST\n');
  console.log('Testing registration and login for Customer, Barber, and Admin\n');
  
  const results = {
    customer: { registration: false, login: false, dashboard: false },
    barber: { registration: false, login: false, dashboard: false },
    admin: { login: false, dashboard: false }
  };
  
  // Generate unique phone numbers
  const customerPhone = `9${Math.floor(Math.random() * 900000000) + 100000000}`;
  const barberPhone = `9${Math.floor(Math.random() * 900000000) + 100000000}`;
  
  console.log('📱 Test Phone Numbers:');
  console.log(`   Customer: ${customerPhone}`);
  console.log(`   Barber: ${barberPhone}`);
  console.log(`   Admin: 9999999999\n`);
  
  // ======================
  // CUSTOMER FLOW
  // ======================
  console.log('👤 CUSTOMER FLOW\n');
  
  console.log('1️⃣ Customer Registration...');
  const customerReg = await testEndpoint('/auth/register', 'POST', {
    name: 'Test Customer User',
    phone: customerPhone,
    password: 'customer123',
    role: 'customer',
    email: 'customer@test.com'
  });
  
  if (customerReg.success) {
    console.log('✅ Customer registration successful');
    results.customer.registration = true;
  } else {
    console.log('❌ Customer registration failed:', customerReg.error);
    console.log('   Full error:', JSON.stringify(customerReg.fullError, null, 2));
  }
  
  console.log('\n2️⃣ Customer Login...');
  const customerLogin = await testEndpoint('/auth/login', 'POST', {
    phone: customerPhone,
    password: 'customer123'
  });
  
  let customerToken = null;
  if (customerLogin.success) {
    console.log('✅ Customer login successful');
    customerToken = customerLogin.data.token;
    results.customer.login = true;
    console.log('   User:', customerLogin.data.user.name, '- Role:', customerLogin.data.user.role);
  } else {
    console.log('❌ Customer login failed:', customerLogin.error);
  }
  
  if (customerToken) {
    console.log('\n3️⃣ Customer Dashboard Access...');
    const customerDashboard = await testEndpoint('/users/dashboard', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    
    if (customerDashboard.success) {
      console.log('✅ Customer dashboard accessible');
      results.customer.dashboard = true;
      console.log('   Dashboard keys:', Object.keys(customerDashboard.data).join(', '));
    } else {
      console.log('❌ Customer dashboard failed:', customerDashboard.error);
    }
  }
  
  // ======================
  // BARBER FLOW
  // ======================
  console.log('\n💼 BARBER FLOW\n');
  
  console.log('1️⃣ Barber Registration...');
  const barberReg = await testEndpoint('/auth/register', 'POST', {
    name: 'Test Barber Professional',
    phone: barberPhone,
    password: 'barber123',
    role: 'barber',
    email: 'barber@test.com',
    shopName: 'Professional Test Barbershop',
    shopAddress: 'Test Street, Test City, Test State - 123456'
  });
  
  if (barberReg.success) {
    console.log('✅ Barber registration successful');
    results.barber.registration = true;
    console.log('   Shop:', barberReg.data.user.shopName);
  } else {
    console.log('❌ Barber registration failed:', barberReg.error);
    console.log('   Full error:', JSON.stringify(barberReg.fullError, null, 2));
  }
  
  console.log('\n2️⃣ Barber Login...');
  const barberLogin = await testEndpoint('/auth/login', 'POST', {
    phone: barberPhone,
    password: 'barber123'
  });
  
  let barberToken = null;
  if (barberLogin.success) {
    console.log('✅ Barber login successful');
    barberToken = barberLogin.data.token;
    results.barber.login = true;
    console.log('   User:', barberLogin.data.user.name, '- Role:', barberLogin.data.user.role);
    console.log('   Shop:', barberLogin.data.user.shopName);
  } else {
    console.log('❌ Barber login failed:', barberLogin.error);
  }
  
  if (barberToken) {
    console.log('\n3️⃣ Barber Dashboard Access...');
    const barberDashboard = await testEndpoint('/users/dashboard', 'GET', null, {
      Authorization: `Bearer ${barberToken}`
    });
    
    if (barberDashboard.success) {
      console.log('✅ Barber dashboard accessible');
      results.barber.dashboard = true;
      console.log('   Dashboard keys:', Object.keys(barberDashboard.data).join(', '));
    } else {
      console.log('❌ Barber dashboard failed:', barberDashboard.error);
    }
    
    // Test barber-specific endpoints
    console.log('\n4️⃣ Barber-Specific Endpoints...');
    const barberEndpoints = [
      '/bookings/barber-bookings',
      '/queue/my-queue',
      '/bookings/stats',
      '/bookings/today'
    ];
    
    for (const endpoint of barberEndpoints) {
      const result = await testEndpoint(endpoint, 'GET', null, {
        Authorization: `Bearer ${barberToken}`
      });
      
      if (result.success) {
        console.log(`   ✅ ${endpoint} working`);
      } else {
        console.log(`   ❌ ${endpoint} failed: ${result.error}`);
      }
    }
  }
  
  // ======================
  // ADMIN FLOW
  // ======================
  console.log('\n🔐 ADMIN FLOW\n');
  
  console.log('1️⃣ Admin Login...');
  const adminLogin = await testEndpoint('/auth/login', 'POST', {
    phone: '9999999999',
    password: 'admin123'
  });
  
  let adminToken = null;
  if (adminLogin.success) {
    console.log('✅ Admin login successful');
    adminToken = adminLogin.data.token;
    results.admin.login = true;
    console.log('   User:', adminLogin.data.user.name, '- Role:', adminLogin.data.user.role);
  } else {
    console.log('❌ Admin login failed:', adminLogin.error);
  }
  
  if (adminToken) {
    console.log('\n2️⃣ Admin Dashboard Access...');
    const adminDashboard = await testEndpoint('/users/dashboard', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    
    if (adminDashboard.success) {
      console.log('✅ Admin dashboard accessible');
      results.admin.dashboard = true;
      console.log('   Dashboard keys:', Object.keys(adminDashboard.data).join(', '));
    } else {
      console.log('❌ Admin dashboard failed:', adminDashboard.error);
    }
    
    // Test admin-specific endpoints
    console.log('\n3️⃣ Admin-Specific Endpoints...');
    const adminEndpoints = [
      '/users/barbers',
      '/services',
      '/bookings/my-bookings'
    ];
    
    for (const endpoint of adminEndpoints) {
      const result = await testEndpoint(endpoint, 'GET', null, {
        Authorization: `Bearer ${adminToken}`
      });
      
      if (result.success) {
        console.log(`   ✅ ${endpoint} working`);
      } else {
        console.log(`   ❌ ${endpoint} failed: ${result.error}`);
      }
    }
  }
  
  // ======================
  // RESULTS SUMMARY
  // ======================
  console.log('\n' + '='.repeat(80));
  console.log('🎯 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(80));
  
  console.log('\n👤 CUSTOMER:');
  console.log(`   Registration: ${results.customer.registration ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Login: ${results.customer.login ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Dashboard: ${results.customer.dashboard ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n💼 BARBER:');
  console.log(`   Registration: ${results.barber.registration ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Login: ${results.barber.login ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Dashboard: ${results.barber.dashboard ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n🔐 ADMIN:');
  console.log(`   Login: ${results.admin.login ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Dashboard: ${results.admin.dashboard ? '✅ PASS' : '❌ FAIL'}`);
  
  const totalTests = 8;
  const passedTests = Object.values(results).reduce((sum, user) => 
    sum + Object.values(user).filter(Boolean).length, 0);
  
  console.log(`\n📊 OVERALL SUCCESS RATE: ${passedTests}/${totalTests} (${Math.round((passedTests/totalTests)*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Backend is fully functional!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above for details.');
  }
  
  console.log('\n📋 TEST CREDENTIALS FOR MANUAL TESTING:');
  console.log(`   Customer: ${customerPhone} / customer123`);
  console.log(`   Barber: ${barberPhone} / barber123`);
  console.log(`   Admin: 9999999999 / admin123`);
}

testAllUserFlows().catch(console.error);
