const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Queue = require('../models/Queue');

// Enhanced sample data with more realistic information
const sampleBarbers = [
  {
    name: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh@example.com',
    password: 'password123',
    role: 'barber',
    shopName: 'Royal Cuts Salon',
    shopAddress: 'Shop 15, Main Market, Connaught Place, New Delhi - 110001',
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
    shopName: 'Style Studio Premium',
    shopAddress: 'Block A-203, Commercial Complex, Bandra West, Mumbai - 400050',
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
    shopName: 'Modern Barber Hub',
    shopAddress: '23, Gandhi Road, Koramangala, Bangalore - 560034',
    workingHours: { start: '08:00', end: '20:00' },
    rating: 4.3,
    totalRatings: 120
  },
  {
    name: 'Vikram Singh',
    phone: '9876543214',
    email: 'vikram@example.com',
    password: 'password123',
    role: 'barber',
    shopName: 'Luxury Grooming Lounge',
    shopAddress: '45, Park Street, Sector 15, Gurgaon - 122001',
    workingHours: { start: '11:00', end: '23:00' },
    rating: 4.8,
    totalRatings: 180
  },
  {
    name: 'Arjun Reddy',
    phone: '9876543215',
    email: 'arjun@example.com',
    password: 'password123',
    role: 'barber',
    shopName: 'Classic Barber Shop',
    shopAddress: '78, MG Road, Jubilee Hills, Hyderabad - 500033',
    workingHours: { start: '09:30', end: '21:30' },
    rating: 4.4,
    totalRatings: 95
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
    phone: '9876543216',
    email: 'priya@example.com',
    password: 'password123',
    role: 'customer'
  },
  {
    name: 'Ravi Gupta',
    phone: '9876543217',
    email: 'ravi@example.com',
    password: 'password123',
    role: 'customer'
  },
  {
    name: 'Neha Patel',
    phone: '9876543218',
    email: 'neha@example.com',
    password: 'password123',
    role: 'customer'
  },
  {
    name: 'Kiran Kumar',
    phone: '9876543219',
    email: 'kiran@example.com',
    password: 'password123',
    role: 'customer'
  },
  {
    name: 'Deepak Verma',
    phone: '9876543220',
    email: 'deepak@example.com',
    password: 'password123',
    role: 'customer'
  }
];

// Comprehensive services with realistic durations and pricing
const serviceTemplates = [
  // Hair Services
  { 
    name: 'Classic Haircut', 
    duration: 40, 
    price: 150, 
    category: 'haircut',
    description: 'Traditional scissor cut with styling',
    popularity: 95
  },
  { 
    name: 'Premium Haircut', 
    duration: 50, 
    price: 300, 
    category: 'haircut',
    description: 'Precision cut with wash and styling',
    popularity: 85
  },
  { 
    name: 'Quick Haircut', 
    duration: 25, 
    price: 100, 
    category: 'haircut',
    description: 'Fast and efficient basic cut',
    popularity: 75
  },
  { 
    name: 'Hair Styling', 
    duration: 30, 
    price: 200, 
    category: 'styling',
    description: 'Professional hair styling and finishing',
    popularity: 70
  },
  
  // Beard Services
  { 
    name: 'Beard Trim', 
    duration: 20, 
    price: 80, 
    category: 'beard',
    description: 'Precision beard trimming and shaping',
    popularity: 90
  },
  { 
    name: 'Beard Wash', 
    duration: 20, 
    price: 60, 
    category: 'beard',
    description: 'Deep cleansing beard wash with conditioning',
    popularity: 65
  },
  { 
    name: 'Mustache Trim', 
    duration: 15, 
    price: 50, 
    category: 'beard',
    description: 'Detailed mustache trimming and styling',
    popularity: 60
  },
  { 
    name: 'Full Beard Shave', 
    duration: 35, 
    price: 120, 
    category: 'beard',
    description: 'Complete beard removal with hot towel treatment',
    popularity: 45
  },
  
  // Wash & Treatment Services
  { 
    name: 'Hair Wash', 
    duration: 45, 
    price: 100, 
    category: 'wash',
    description: 'Thorough hair wash with premium shampoo and conditioner',
    popularity: 80
  },
  { 
    name: 'Head Massage', 
    duration: 20, 
    price: 150, 
    category: 'massage',
    description: 'Relaxing head and scalp massage with oils',
    popularity: 85
  },
  { 
    name: 'Scalp Treatment', 
    duration: 60, 
    price: 400, 
    category: 'massage',
    description: 'Deep scalp treatment for hair health',
    popularity: 40
  },
  
  // Premium Services
  { 
    name: 'Hair Color', 
    duration: 90, 
    price: 800, 
    category: 'color',
    description: 'Professional hair coloring service',
    popularity: 30
  },
  { 
    name: 'Face Cleanup', 
    duration: 45, 
    price: 250, 
    category: 'cleanup',
    description: 'Deep cleansing facial treatment',
    popularity: 55
  },
  { 
    name: 'Deluxe Package', 
    duration: 120, 
    price: 600, 
    category: 'cleanup',
    description: 'Complete grooming package with multiple services',
    popularity: 25
  },
  
  // Traditional Services
  { 
    name: 'Traditional Shave', 
    duration: 30, 
    price: 100, 
    category: 'beard',
    description: 'Classic razor shave with hot towel',
    popularity: 50
  },
  { 
    name: 'Eyebrow Trimming', 
    duration: 10, 
    price: 40, 
    category: 'cleanup',
    description: 'Precision eyebrow shaping and trimming',
    popularity: 35
  }
];

// Admin user
const adminUser = {
  name: 'System Admin',
  phone: '9999999999',
  email: 'admin@barberqueue.com',
  password: 'admin123',
  role: 'admin'
};

// Helper function to generate random time slots
function generateTimeSlots(startTime, endTime, duration) {
  const slots = [];
  const start = new Date(`2024-01-01 ${startTime}`);
  const end = new Date(`2024-01-01 ${endTime}`);
  
  while (start < end) {
    slots.push(start.toTimeString().slice(0, 5));
    start.setMinutes(start.getMinutes() + duration);
  }
  
  return slots;
}

// Helper function to create realistic bookings
function createBookingData(customer, barber, service, date, time) {
  const scheduledTime = new Date(`${date} ${time}`);
  const endTime = new Date(scheduledTime.getTime() + service.duration * 60000);
  
  return {
    customer: customer._id,
    barber: barber._id,
    services: [{
      service: service._id,
      price: service.price
    }],
    scheduledTime,
    totalAmount: service.price,
    totalDuration: service.duration,
    status: Math.random() > 0.3 ? 'confirmed' : 'pending',
    isWalkIn: Math.random() > 0.8,
    notes: `Booking for ${service.name}`,
    paymentStatus: Math.random() > 0.2 ? 'paid' : 'pending'
  };
}

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

    // Create services for each barber
    const allServices = [];
    for (let i = 0; i < barbers.length; i++) {
      const barber = barbers[i];
      
      // Each barber gets 6-10 services based on their position (different service sets)
      let barberServices;
      
      if (i === 0) { // Rajesh Kumar - Traditional services
        barberServices = serviceTemplates.filter(s => 
          ['Classic Haircut', 'Beard Trim', 'Hair Wash', 'Head Massage', 'Traditional Shave', 'Mustache Trim'].includes(s.name)
        );
      } else if (i === 1) { // Mohammed Ali - Premium services
        barberServices = serviceTemplates.filter(s => 
          ['Premium Haircut', 'Hair Color', 'Face Cleanup', 'Scalp Treatment', 'Hair Styling', 'Deluxe Package'].includes(s.name)
        );
      } else if (i === 2) { // Suresh Patel - Quick services
        barberServices = serviceTemplates.filter(s => 
          ['Quick Haircut', 'Beard Trim', 'Hair Wash', 'Mustache Trim', 'Eyebrow Trimming'].includes(s.name)
        );
      } else if (i === 3) { // Vikram Singh - Luxury services
        barberServices = serviceTemplates.filter(s => 
          ['Premium Haircut', 'Scalp Treatment', 'Hair Color', 'Deluxe Package', 'Face Cleanup', 'Hair Styling'].includes(s.name)
        );
      } else { // Arjun Reddy - Classic services
        barberServices = serviceTemplates.filter(s => 
          ['Classic Haircut', 'Traditional Shave', 'Beard Trim', 'Mustache Trim', 'Head Massage', 'Hair Wash'].includes(s.name)
        );
      }
      
      // Add some common services to all barbers
      const commonServices = serviceTemplates.filter(s => 
        ['Classic Haircut', 'Beard Trim', 'Hair Wash'].includes(s.name)
      );
      
      // Combine and deduplicate
      const combinedServices = [...new Map([...barberServices, ...commonServices].map(s => [s.name, s])).values()];
      
      for (const serviceTemplate of combinedServices) {
        const service = new Service({
          ...serviceTemplate,
          barberId: barber._id,
          isActive: true
        });
        await service.save();
        allServices.push(service);
        console.log(`✅ Created service: ${service.name} for ${barber.name}`);
      }
    }

    // Create realistic bookings for the next 7 days
    const bookings = [];
    const today = new Date();
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const bookingDate = new Date(today);
      bookingDate.setDate(today.getDate() + dayOffset);
      const dateString = bookingDate.toISOString().split('T')[0];
      
      // Create 3-8 bookings per day
      const dailyBookings = 3 + Math.floor(Math.random() * 6);
      
      for (let i = 0; i < dailyBookings; i++) {
        const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
        const randomBarber = barbers[Math.floor(Math.random() * barbers.length)];
        const barberServices = allServices.filter(s => s.barberId.equals(randomBarber._id));
        const randomService = barberServices[Math.floor(Math.random() * barberServices.length)];
        
        // Generate time slots for this barber
        const timeSlots = generateTimeSlots(
          randomBarber.workingHours.start, 
          randomBarber.workingHours.end, 
          30
        );
        const randomTime = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        
        const bookingData = createBookingData(randomCustomer, randomBarber, randomService, dateString, randomTime);
        const booking = new Booking(bookingData);
        await booking.save();
        bookings.push(booking);
      }
    }
    console.log(`✅ Created ${bookings.length} bookings`);

    // Create queue entries for each barber
    for (const barber of barbers) {
      const barberBookings = bookings.filter(b => b.barber.equals(barber._id));
      const todayBookings = barberBookings.filter(b => {
        const bookingDate = new Date(b.scheduledTime);
        return bookingDate.toDateString() === today.toDateString();
      }).sort((a, b) => a.scheduledTime - b.scheduledTime);

      const queueEntries = todayBookings.map((booking, index) => ({
        booking: booking._id,
        position: index + 1,
        status: index < 2 ? 'in-progress' : 'waiting',
        estimatedTime: new Date(booking.scheduledTime.getTime() + index * 30 * 60000),
        joinedAt: new Date()
      }));

      const queueEntry = new Queue({
        barber: barber._id,
        queue: queueEntries,
        currentlyServing: todayBookings.length > 0 ? todayBookings[0]._id : null,
        averageServiceTime: 35,
        totalServedToday: Math.floor(Math.random() * 8),
        isActive: true
      });
      
      await queueEntry.save();
      console.log(`✅ Created queue for barber: ${barber.name} (${todayBookings.length} entries)`);
    }

    // Create admin user
    const admin = new User(adminUser);
    await admin.save();
    console.log('✅ Created admin user');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   Barbers: ${barbers.length}`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Services: ${allServices.length}`);
    console.log(`   Bookings: ${bookings.length}`);
    console.log('🔐 Login Credentials:');
    console.log('   Admin: 9999999999 / admin123');
    console.log('   Barber: 9876543210 / password123');
    console.log('   Customer: 9876543213 / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the seeding
seedDatabase();
