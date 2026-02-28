/**
 * PostgreSQL Seed Script for BarberQueue
 * Run: node scripts/seed.js
 */
const bcrypt = require('bcryptjs');
require('dotenv').config();
const db = require('../db');

// ── Sample data ──────────────────────────────────────────────────
const sampleBarbers = [
  { name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@example.com', password: 'password123', shopName: 'Royal Cuts Salon', shopAddress: 'Shop 15, Main Market, Connaught Place, New Delhi - 110001', whStart: '09:00', whEnd: '21:00', rating: 4.5, totalRatings: 150 },
  { name: 'Mohammed Ali', phone: '9876543211', email: 'ali@example.com', password: 'password123', shopName: 'Style Studio Premium', shopAddress: 'Block A-203, Commercial Complex, Bandra West, Mumbai - 400050', whStart: '10:00', whEnd: '22:00', rating: 4.7, totalRatings: 200 },
  { name: 'Suresh Patel', phone: '9876543212', email: 'suresh@example.com', password: 'password123', shopName: 'Modern Barber Hub', shopAddress: '23, Gandhi Road, Koramangala, Bangalore - 560034', whStart: '08:00', whEnd: '20:00', rating: 4.3, totalRatings: 120 },
  { name: 'Vikram Singh', phone: '9876543214', email: 'vikram@example.com', password: 'password123', shopName: 'Luxury Grooming Lounge', shopAddress: '45, Park Street, Sector 15, Gurgaon - 122001', whStart: '11:00', whEnd: '23:00', rating: 4.8, totalRatings: 180 },
  { name: 'Arjun Reddy', phone: '9876543215', email: 'arjun@example.com', password: 'password123', shopName: 'Classic Barber Shop', shopAddress: '78, MG Road, Jubilee Hills, Hyderabad - 500033', whStart: '09:30', whEnd: '21:30', rating: 4.4, totalRatings: 95 },
];

const sampleCustomers = [
  { name: 'Amit Sharma', phone: '9876543213', email: 'amit@example.com', password: 'password123' },
  { name: 'Priya Singh', phone: '9876543216', email: 'priya@example.com', password: 'password123' },
  { name: 'Ravi Gupta', phone: '9876543217', email: 'ravi@example.com', password: 'password123' },
  { name: 'Neha Patel', phone: '9876543218', email: 'neha@example.com', password: 'password123' },
  { name: 'Kiran Kumar', phone: '9876543219', email: 'kiran@example.com', password: 'password123' },
  { name: 'Deepak Verma', phone: '9876543220', email: 'deepak@example.com', password: 'password123' },
];

const serviceTemplates = [
  { name: 'Classic Haircut', duration: 40, price: 150, category: 'haircut', description: 'Traditional scissor cut with styling', popularity: 95 },
  { name: 'Premium Haircut', duration: 50, price: 300, category: 'haircut', description: 'Precision cut with wash and styling', popularity: 85 },
  { name: 'Quick Haircut', duration: 25, price: 100, category: 'haircut', description: 'Fast and efficient basic cut', popularity: 75 },
  { name: 'Hair Styling', duration: 30, price: 200, category: 'styling', description: 'Professional hair styling and finishing', popularity: 70 },
  { name: 'Beard Trim', duration: 20, price: 80, category: 'beard', description: 'Precision beard trimming and shaping', popularity: 90 },
  { name: 'Beard Wash', duration: 20, price: 60, category: 'beard', description: 'Deep cleansing beard wash with conditioning', popularity: 65 },
  { name: 'Mustache Trim', duration: 15, price: 50, category: 'beard', description: 'Detailed mustache trimming and styling', popularity: 60 },
  { name: 'Full Beard Shave', duration: 35, price: 120, category: 'beard', description: 'Complete beard removal with hot towel treatment', popularity: 45 },
  { name: 'Hair Wash', duration: 45, price: 100, category: 'wash', description: 'Thorough hair wash with premium shampoo and conditioner', popularity: 80 },
  { name: 'Head Massage', duration: 20, price: 150, category: 'massage', description: 'Relaxing head and scalp massage with oils', popularity: 85 },
  { name: 'Scalp Treatment', duration: 60, price: 400, category: 'massage', description: 'Deep scalp treatment for hair health', popularity: 40 },
  { name: 'Hair Color', duration: 90, price: 800, category: 'color', description: 'Professional hair coloring service', popularity: 30 },
  { name: 'Face Cleanup', duration: 45, price: 250, category: 'cleanup', description: 'Deep cleansing facial treatment', popularity: 55 },
  { name: 'Deluxe Package', duration: 120, price: 600, category: 'cleanup', description: 'Complete grooming package with multiple services', popularity: 25 },
  { name: 'Traditional Shave', duration: 30, price: 100, category: 'beard', description: 'Classic razor shave with hot towel', popularity: 50 },
  { name: 'Eyebrow Trimming', duration: 10, price: 40, category: 'cleanup', description: 'Precision eyebrow shaping and trimming', popularity: 35 },
];

const barberServiceSets = [
  ['Classic Haircut', 'Beard Trim', 'Hair Wash', 'Head Massage', 'Traditional Shave', 'Mustache Trim'],
  ['Premium Haircut', 'Hair Color', 'Face Cleanup', 'Scalp Treatment', 'Hair Styling', 'Deluxe Package'],
  ['Quick Haircut', 'Beard Trim', 'Hair Wash', 'Mustache Trim', 'Eyebrow Trimming'],
  ['Premium Haircut', 'Scalp Treatment', 'Hair Color', 'Deluxe Package', 'Face Cleanup', 'Hair Styling'],
  ['Classic Haircut', 'Traditional Shave', 'Beard Trim', 'Mustache Trim', 'Head Massage', 'Hair Wash'],
];
const commonServiceNames = ['Classic Haircut', 'Beard Trim', 'Hair Wash'];

// ── Helpers ──────────────────────────────────────────────────────
function generateTimeSlots(startTime, endTime, duration) {
  const slots = [];
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  let m = sH * 60 + sM;
  const end = eH * 60 + eM;
  while (m < end) {
    const h = Math.floor(m / 60);
    const mi = m % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${mi.toString().padStart(2, '0')}`);
    m += duration;
  }
  return slots;
}

async function seedDatabase() {
  try {
    // Run migrations first
    await db.migrate.latest();
    console.log('📦 Migrations complete');

    // Clear existing data (reverse FK order)
    await db('queue_entries').del();
    await db('queues').del();
    await db('booking_services').del();
    await db('bookings').del();
    await db('services').del();
    await db('users').del();
    console.log('🗑️  Cleared existing data');

    const salt = await bcrypt.genSalt(10);

    // ── Create barbers ──
    const barbers = [];
    for (const b of sampleBarbers) {
      const hash = await bcrypt.hash(b.password, salt);
      const [row] = await db('users').insert({
        name: b.name, phone: b.phone, email: b.email,
        password: hash, role: 'barber',
        shop_name: b.shopName, shop_address: b.shopAddress,
        working_hours_start: b.whStart, working_hours_end: b.whEnd,
        rating: b.rating, total_ratings: b.totalRatings,
      }).returning('*');
      barbers.push(row);
      console.log(`✅ Created barber: ${row.name} (${row.shop_name})`);
    }

    // ── Create customers ──
    const customers = [];
    for (const c of sampleCustomers) {
      const hash = await bcrypt.hash(c.password, salt);
      const [row] = await db('users').insert({
        name: c.name, phone: c.phone, email: c.email,
        password: hash, role: 'customer',
      }).returning('*');
      customers.push(row);
      console.log(`✅ Created customer: ${row.name}`);
    }

    // ── Create admin ──
    const adminHash = await bcrypt.hash('admin123', salt);
    await db('users').insert({
      name: 'System Admin', phone: '9999999999', email: 'admin@barberqueue.com',
      password: adminHash, role: 'admin',
    });
    console.log('✅ Created admin user');

    // ── Create services ──
    const allServices = [];
    for (let i = 0; i < barbers.length; i++) {
      const barber = barbers[i];
      const setNames = barberServiceSets[i] || barberServiceSets[0];
      const combined = [...new Set([...setNames, ...commonServiceNames])];

      for (const svcName of combined) {
        const tpl = serviceTemplates.find((t) => t.name === svcName);
        if (!tpl) continue;
        const [svc] = await db('services').insert({
          name: tpl.name, description: tpl.description,
          price: tpl.price, duration: tpl.duration,
          category: tpl.category, popularity: tpl.popularity,
          barber_id: barber.id, is_active: true,
        }).returning('*');
        allServices.push(svc);
      }
      console.log(`✅ Created services for ${barber.name}`);
    }

    // ── Create bookings for next 7 days ──
    const bookings = [];
    const today = new Date();

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const bookingDate = new Date(today);
      bookingDate.setDate(today.getDate() + dayOffset);
      const dateStr = bookingDate.toISOString().split('T')[0];

      const dailyCount = 3 + Math.floor(Math.random() * 6);
      for (let j = 0; j < dailyCount; j++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const barber = barbers[Math.floor(Math.random() * barbers.length)];
        const barberSvcs = allServices.filter((s) => s.barber_id === barber.id);
        const svc = barberSvcs[Math.floor(Math.random() * barberSvcs.length)];
        if (!svc) continue;

        const slots = generateTimeSlots(barber.working_hours_start, barber.working_hours_end, 30);
        const time = slots[Math.floor(Math.random() * slots.length)];
        const scheduledTime = new Date(`${dateStr}T${time}:00`);

        const status = Math.random() > 0.3 ? 'confirmed' : 'pending';
        const [booking] = await db('bookings').insert({
          customer_id: customer.id, barber_id: barber.id,
          scheduled_time: scheduledTime,
          total_amount: svc.price, total_duration: svc.duration,
          status, is_walk_in: Math.random() > 0.8,
          notes: `Booking for ${svc.name}`,
          payment_status: Math.random() > 0.2 ? 'paid' : 'pending',
        }).returning('*');

        await db('booking_services').insert({
          booking_id: booking.id, service_id: svc.id, price: svc.price,
        });
        bookings.push(booking);
      }
    }
    console.log(`✅ Created ${bookings.length} bookings`);

    // ── Create queue entries ──
    for (const barber of barbers) {
      const todayStr = today.toISOString().split('T')[0];
      const todayBookings = bookings
        .filter((b) => b.barber_id === barber.id && b.scheduled_time.toISOString().startsWith(todayStr))
        .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));

      const [queue] = await db('queues').insert({
        barber_id: barber.id,
        currently_serving: todayBookings.length > 0 ? todayBookings[0].id : null,
        average_service_time: 35,
        total_served_today: Math.floor(Math.random() * 8),
        is_active: true,
      }).returning('*');

      for (let idx = 0; idx < todayBookings.length; idx++) {
        await db('queue_entries').insert({
          queue_id: queue.id,
          booking_id: todayBookings[idx].id,
          position: idx + 1,
          status: idx < 1 ? 'in-progress' : 'waiting',
          estimated_time: new Date(todayBookings[idx].scheduled_time.getTime() + idx * 30 * 60000),
        });
      }
      console.log(`✅ Created queue for ${barber.name} (${todayBookings.length} entries)`);
    }

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
    await db.destroy();
  }
}

seedDatabase();
