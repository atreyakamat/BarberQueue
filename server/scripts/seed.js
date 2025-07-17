const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Queue = require('../models/Queue');

// Sample data
const sampleBarbers = [
  {
    name: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh@example.com',
    password: 'password123',
    role: 'barber',
    shopName: 'Royal Cuts',
    shopAddress: 'Shop 15, Main Market, Delhi',
    workingHours: { start: '09:00', end: '21:00' },
    rating: 4.5,
    totalRatings: 150
  },
  {
    name: 'Mohammed Ali',
    phone: '9876543211',
    email: 'ali@example.com',
    password: 'password123',
    role: 'barber',
    shopName: 'Style Studio',
    shopAddress: 'Block A, Commercial Complex, Mumbai',
    workingHours: { start: '10:00', end: '22:00' },
    rating: 4.7,
    totalRatings: 200
  },
  {
    name: 'Suresh Patel',
    phone: '9876543212',
    email: 'suresh@example.com',
    password: 'password123',
    role: 'barber',
    shopName: 'Modern Barber',
    shopAddress: '23, Gandhi Road, Bangalore',
    workingHours: { start: '08:00', end: '20:00' },
    rating: 4.3,
    totalRatings: 120
  }
];

const sampleCustomers = [
  {
    name: 'Amit Sharma',
    phone: '9876543213',
    email: 'amit@example.com',
    password: 'password123',
    role: 'customer'
  },
  {
    name: 'Priya Singh',
    phone: '9876543214',
    email: 'priya@example.com',
    password: 'password123',
    role: 'customer'
  },
  {
    name: 'Ravi Gupta',
    phone: '9876543215',
    email: 'ravi@example.com',
    password: 'password123',
    role: 'customer'
  }
];

const sampleServices = [
  // Services for Barber 1
  { name: 'Classic Haircut', description: 'Traditional haircut with modern styling', price: 150, duration: 30, category: 'haircut' },
  { name: 'Beard Trim', description: 'Professional beard trimming and shaping', price: 100, duration: 20, category: 'beard' },
  { name: 'Head Massage', description: 'Relaxing head and scalp massage', price: 200, duration: 25, category: 'massage' },
  { name: 'Face Cleanup', description: 'Deep cleansing facial treatment', price: 300, duration: 45, category: 'cleanup' },
  { name: 'Hair Wash', description: 'Shampoo and conditioning treatment', price: 50, duration: 15, category: 'wash' },
  
  // Services for Barber 2
  { name: 'Premium Haircut', description: 'Luxury haircut with styling', price: 250, duration: 40, category: 'haircut' },
  { name: 'Beard Shave', description: 'Clean shave with hot towel treatment', price: 120, duration: 25, category: 'beard' },
  { name: 'Hair Color', description: 'Professional hair coloring service', price: 800, duration: 90, category: 'color' },
  { name: 'Hair Styling', description: 'Special occasion hair styling', price: 400, duration: 35, category: 'styling' },
  
  // Services for Barber 3
  { name: 'Quick Haircut', description: 'Fast and efficient haircut', price: 100, duration: 20, category: 'haircut' },
  { name: 'Mustache Trim', description: 'Precise mustache trimming', price: 50, duration: 10, category: 'beard' },
  { name: 'Deluxe Cleanup', description: 'Complete facial cleanup package', price: 500, duration: 60, category: 'cleanup' },
  { name: 'Scalp Treatment', description: 'Therapeutic scalp treatment', price: 350, duration: 40, category: 'massage' }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barberqueue');
    console.log('🍃 Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Service.deleteMany({});
    await Booking.deleteMany({});
    await Queue.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create barbers
    const barbers = [];
    for (const barberData of sampleBarbers) {
      const barber = new User(barberData);
      await barber.save();
      barbers.push(barber);
      console.log(`✅ Created barber: ${barber.name} (${barber.shopName})`);
    }

    // Create customers
    const customers = [];
    for (const customerData of sampleCustomers) {
      const customer = new User(customerData);
      await customer.save();
      customers.push(customer);
      console.log(`✅ Created customer: ${customer.name}`);
    }

    // Create services
    let serviceIndex = 0;
    for (let i = 0; i < barbers.length; i++) {
      const barber = barbers[i];
      const servicesPerBarber = i === 0 ? 5 : i === 1 ? 4 : 4;
      
      for (let j = 0; j < servicesPerBarber; j++) {
        const serviceData = {
          ...sampleServices[serviceIndex],
          barberId: barber._id,
          popularity: Math.floor(Math.random() * 100)
        };
        
        const service = new Service(serviceData);
        await service.save();
        serviceIndex++;
        console.log(`✅ Created service: ${service.name} for ${barber.name}`);
      }
    }

    // Create sample bookings
    const bookings = [];
    for (let i = 0; i < 10; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const barber = barbers[Math.floor(Math.random() * barbers.length)];
      
      // Get services for this barber
      const barberServices = await Service.find({ barberId: barber._id }).limit(2);
      
      if (barberServices.length > 0) {
        const bookingServices = barberServices.map(service => ({
          service: service._id,
          price: service.price
        }));
        
        const totalAmount = barberServices.reduce((sum, service) => sum + service.price, 0);
        const totalDuration = barberServices.reduce((sum, service) => sum + service.duration, 0);
        
        // Create booking for future date
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 7) + 1);
        futureDate.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0);
        
        const booking = new Booking({
          customer: customer._id,
          barber: barber._id,
          services: bookingServices,
          scheduledTime: futureDate,
          totalAmount,
          totalDuration,
          status: ['pending', 'confirmed'][Math.floor(Math.random() * 2)]
        });
        
        await booking.save();
        bookings.push(booking);
        console.log(`✅ Created booking: ${customer.name} -> ${barber.name}`);
      }
    }

    // Create queues for barbers
    for (const barber of barbers) {
      const queue = new Queue({
        barber: barber._id,
        queue: [],
        averageServiceTime: 30,
        totalServedToday: Math.floor(Math.random() * 10)
      });
      await queue.save();
      console.log(`✅ Created queue for barber: ${barber.name}`);
    }

    // Create admin user
    const admin = new User({
      name: 'Admin',
      phone: '9999999999',
      email: 'admin@barberqueue.com',
      password: 'admin123',
      role: 'admin'
    });
    await admin.save();
    console.log('✅ Created admin user');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Barbers: ${barbers.length}`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Services: ${serviceIndex}`);
    console.log(`   Bookings: ${bookings.length}`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin: 9999999999 / admin123');
    console.log('   Barber: 9876543210 / password123');
    console.log('   Customer: 9876543213 / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
