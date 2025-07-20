const mongoose = require('mongoose');
const Service = require('./models/Service');

async function getServices() {
  try {
    await mongoose.connect('mongodb://localhost:27017/barberqueue');
    const services = await Service.find().select('_id name barber category price duration').limit(5);
    console.log('Sample Services:');
    services.forEach(s => console.log(`${s._id} - ${s.name} - Barber: ${s.barber} - ₹${s.price}`));
    
    const count = await Service.countDocuments();
    console.log(`\nTotal services: ${count}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getServices();
