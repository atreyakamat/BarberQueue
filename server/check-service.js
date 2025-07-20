const mongoose = require('mongoose');
const Service = require('./models/Service');

async function checkServiceStructure() {
  try {
    await mongoose.connect('mongodb://localhost:27017/barberqueue');
    const service = await Service.findOne();
    console.log('Sample service structure:');
    console.log(JSON.stringify(service, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkServiceStructure();
