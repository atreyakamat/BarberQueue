const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('JWT_SECRET from env:', process.env.JWT_SECRET);

// Test token creation and verification
const testPayload = { userId: '6879d6023b6b133e8c6574cb', role: 'admin' };
const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
console.log('Generated token:', token);

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token verification successful:', decoded);
} catch (error) {
  console.log('Token verification failed:', error.message);
}
