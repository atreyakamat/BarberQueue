// Test script to simulate frontend registration exactly as the form would do it
const axios = require('axios');

const testFormRegistration = async () => {
  console.log('🧪 Testing Form Registration Flow...\n');
  
  // Simulate the exact data structure that the form would send
  const formData = {
    name: 'Test Customer',
    phone: '9876543296',
    password: 'password123',
    role: 'customer'
  };
  
  console.log('Form Data:', JSON.stringify(formData, null, 2));
  
  try {
    // This mimics exactly what the frontend AuthContext register function does
    const response = await axios.post('http://localhost:5000/api/auth/register', formData);
    
    console.log('✅ Registration successful!');
    console.log('Response:', response.data);
    
    // Test if we can immediately use the token
    const token = response.data.token;
    console.log('\n🧪 Testing immediate token usage...');
    
    const profileResponse = await axios.get('http://localhost:5000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Profile fetch successful!');
    console.log('User:', profileResponse.data.user);
    
  } catch (error) {
    console.log('❌ Registration failed!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    
    if (error.response?.data?.errors) {
      console.log('Validation errors:');
      error.response.data.errors.forEach(err => {
        console.log(`  - ${err.msg} (field: ${err.path})`);
      });
    }
  }
};

// Test with barber registration too
const testBarberRegistration = async () => {
  console.log('\n🧪 Testing Barber Registration Flow...\n');
  
  const formData = {
    name: 'Test Barber',
    phone: '9876543297',
    password: 'password123',
    role: 'barber',
    shopName: 'Test Salon',
    address: 'Test Address, Mumbai'
  };
  
  console.log('Form Data:', JSON.stringify(formData, null, 2));
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', formData);
    
    console.log('✅ Barber registration successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Barber registration failed!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    
    if (error.response?.data?.errors) {
      console.log('Validation errors:');
      error.response.data.errors.forEach(err => {
        console.log(`  - ${err.msg} (field: ${err.path})`);
      });
    }
  }
};

// Run both tests
const runTests = async () => {
  await testFormRegistration();
  await testBarberRegistration();
};

runTests();
