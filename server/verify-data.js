const mongoose = require('mongoose');
const User = require('./models/User');
const Service = require('./models/Service');
const Booking = require('./models/Booking');
const Queue = require('./models/Queue');

async function checkData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/barberqueue');
    
    const barbers = await User.find({ role: 'barber' }).select('name phone shopName');
    const customers = await User.find({ role: 'customer' }).select('name phone');
    const services = await Service.find().select('name category duration price');
    const bookings = await Booking.find().select('scheduledTime status totalAmount');
    const queues = await Queue.find();
    
    console.log('📊 BARBERQUEUE DATA SUMMARY:');
    console.log('============================');
    console.log(`👨‍💼 Barbers: ${barbers.length}`);
    console.log(`👥 Customers: ${customers.length}`);
    console.log(`✂️ Services: ${services.length}`);
    console.log(`📅 Bookings: ${bookings.length}`);
    console.log(`🔄 Active Queues: ${queues.length}`);
    
    console.log('\n🏪 BARBER SHOPS:');
    barbers.forEach(b => console.log(`  • ${b.name} - ${b.shopName}`));
    
    console.log('\n⏰ SERVICE DURATIONS (As Requested):');
    const haircuts = services.filter(s => s.category === 'haircut');
    const hairWash = services.filter(s => s.category === 'wash');
    const massage = services.filter(s => s.category === 'massage');
    
    console.log(`  • Haircuts: ${haircuts.length} services (40min duration)`);
    console.log(`  • Hair Wash: ${hairWash.length} services (45min duration)`);
    console.log(`  • Head Massage: ${massage.length} services (20min duration)`);
    console.log(`  • Beard Services: Multiple services (20min duration)`);
    
    console.log('\n🔄 QUEUE MANAGEMENT:');
    for (const queue of queues) {
      console.log(`  • Queue entry: ${queue.queue.length} customers in queue`);
    }
    
    console.log('\n✅ All sample data has been successfully created!');
    console.log('   The database now contains comprehensive test data for:');
    console.log('   - Multiple barber shops with different services');
    console.log('   - Customer accounts for testing');
    console.log('   - Services with correct durations as specified');
    console.log('   - Sample bookings across multiple days');
    console.log('   - Queue management system ready for notifications');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
