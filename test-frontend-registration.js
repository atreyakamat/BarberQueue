// Frontend Registration Test Script
const testFrontendRegistration = async () => {
  console.log('🧪 Testing Frontend Registration...\n');
  
  // Test different scenarios
  const testCases = [
    {
      name: 'Valid Customer Registration',
      data: {
        name: 'John Doe',
        phone: '9876543292',
        password: 'password123',
        role: 'customer'
      }
    },
    {
      name: 'Valid Barber Registration',
      data: {
        name: 'Jane Smith',
        phone: '9876543293',
        password: 'password123',
        role: 'barber',
        shopName: 'Jane\'s Salon',
        address: '123 Main St, Mumbai'
      }
    },
    {
      name: 'Invalid Phone Number',
      data: {
        name: 'Test User',
        phone: '123456789',
        password: 'password123',
        role: 'customer'
      }
    },
    {
      name: 'Short Password',
      data: {
        name: 'Test User',
        phone: '9876543294',
        password: '123',
        role: 'customer'
      }
    },
    {
      name: 'Missing Name',
      data: {
        phone: '9876543295',
        password: 'password123',
        role: 'customer'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${testCase.name}:`);
    console.log('Data:', JSON.stringify(testCase.data, null, 2));
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.data)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Success:', result.message);
        if (result.user) {
          console.log('User created:', result.user.name, '(' + result.user.role + ')');
        }
      } else {
        console.log('❌ Error:', result.message || 'Unknown error');
        if (result.errors) {
          result.errors.forEach(err => {
            console.log('  - ' + err.msg + ' (field: ' + err.path + ')');
          });
        }
      }
    } catch (error) {
      console.log('❌ Network Error:', error.message);
    }
  }
};

// Run the test
testFrontendRegistration();
