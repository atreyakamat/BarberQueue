const mongoose = require('mongoose');
const User = require('./models/User');

async function getBarbers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/barberqueue');
    const barbers = await User.find({ role: 'barber' }).select('_id name shopName');
    console.log('Available Barbers:');
    barbers.forEach(b => console.log(`${b._id} - ${b.name} (${b.shopName})`));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getBarbers();
