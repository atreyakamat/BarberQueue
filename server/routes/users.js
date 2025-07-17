const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all barbers
router.get('/barbers', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'rating' } = req.query;
    const query = { 
      role: 'barber', 
      isActive: true,
      isAvailable: true
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shopName: { $regex: search, $options: 'i' } },
        { shopAddress: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    if (sortBy === 'rating') {
      sortOptions.rating = -1;
    } else if (sortBy === 'name') {
      sortOptions.name = 1;
    } else if (sortBy === 'newest') {
      sortOptions.createdAt = -1;
    }

    const barbers = await User.find(query)
      .select('name shopName shopAddress rating totalRatings workingHours avatar')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      barbers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get barbers error:', error);
    res.status(500).json({ message: 'Server error fetching barbers' });
  }
});

// Get barber details
router.get('/barber/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const barber = await User.findOne({ 
      _id: id, 
      role: 'barber', 
      isActive: true 
    }).select('name shopName shopAddress rating totalRatings workingHours avatar isAvailable');

    if (!barber) {
      return res.status(404).json({ message: 'Barber not found' });
    }

    // Get barber's services
    const Service = require('../models/Service');
    const services = await Service.find({ 
      barberId: id, 
      isActive: true 
    }).sort({ category: 1, name: 1 });

    // Get recent reviews
    const reviews = await Booking.find({
      barber: id,
      status: 'completed',
      rating: { $exists: true }
    })
    .populate('customer', 'name')
    .select('rating review createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      barber,
      services,
      reviews
    });
  } catch (error) {
    console.error('Get barber details error:', error);
    res.status(500).json({ message: 'Server error fetching barber details' });
  }
});

// Get barber's availability slots
router.get('/barber/:id/slots', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const barber = await User.findOne({ 
      _id: id, 
      role: 'barber', 
      isActive: true,
      isAvailable: true
    });

    if (!barber) {
      return res.status(404).json({ message: 'Barber not found or unavailable' });
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({ message: 'Cannot book for past dates' });
    }

    // Get existing bookings for the date
    const startOfDay = new Date(selectedDate);
    const endOfDay = new Date(selectedDate);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const existingBookings = await Booking.find({
      barber: id,
      scheduledTime: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: ['pending', 'confirmed', 'in-progress'] }
    }).select('scheduledTime totalDuration');

    // Generate time slots
    const workingHours = barber.workingHours || { start: '09:00', end: '21:00' };
    const slots = generateTimeSlots(workingHours.start, workingHours.end, 30); // 30-minute slots

    // Filter available slots
    const availableSlots = slots.filter(slot => {
      const slotTime = new Date(selectedDate);
      const [hours, minutes] = slot.split(':');
      slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Check if slot is in the past
      if (slotTime <= new Date()) {
        return false;
      }

      // Check if slot conflicts with existing bookings
      const hasConflict = existingBookings.some(booking => {
        const bookingStart = new Date(booking.scheduledTime);
        const bookingEnd = new Date(bookingStart.getTime() + booking.totalDuration * 60000);
        
        return slotTime >= bookingStart && slotTime < bookingEnd;
      });

      return !hasConflict;
    });

    res.json({
      date: selectedDate.toISOString().split('T')[0],
      workingHours,
      availableSlots,
      totalSlots: slots.length,
      bookedSlots: slots.length - availableSlots.length
    });
  } catch (error) {
    console.error('Get barber slots error:', error);
    res.status(500).json({ message: 'Server error fetching availability slots' });
  }
});

// Helper function to generate time slots
function generateTimeSlots(startTime, endTime, intervalMinutes) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += intervalMinutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    slots.push(timeString);
  }
  
  return slots;
}

// Search barbers and services
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const results = {
      barbers: [],
      services: []
    };

    if (type === 'all' || type === 'barbers') {
      const barbers = await User.find({
        role: 'barber',
        isActive: true,
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { shopName: { $regex: q, $options: 'i' } },
          { shopAddress: { $regex: q, $options: 'i' } }
        ]
      })
      .select('name shopName shopAddress rating totalRatings avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit);

      results.barbers = barbers;
    }

    if (type === 'all' || type === 'services') {
      const Service = require('../models/Service');
      const services = await Service.find({
        isActive: true,
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } }
        ]
      })
      .populate('barberId', 'name shopName rating')
      .limit(limit * 1)
      .skip((page - 1) * limit);

      results.services = services;
    }

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

// Get user dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === 'customer') {
      // Customer dashboard
      const upcomingBookings = await Booking.find({
        customer: userId,
        status: { $in: ['pending', 'confirmed', 'in-progress'] },
        scheduledTime: { $gte: new Date() }
      })
      .populate('barber', 'name shopName')
      .populate('services.service', 'name')
      .sort({ scheduledTime: 1 })
      .limit(5);

      const recentBookings = await Booking.find({
        customer: userId,
        status: { $in: ['completed', 'cancelled'] }
      })
      .populate('barber', 'name shopName')
      .populate('services.service', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

      const totalBookings = await Booking.countDocuments({ customer: userId });
      const completedBookings = await Booking.countDocuments({ 
        customer: userId, 
        status: 'completed' 
      });

      res.json({
        upcomingBookings,
        recentBookings,
        stats: {
          totalBookings,
          completedBookings,
          cancelledBookings: await Booking.countDocuments({ 
            customer: userId, 
            status: 'cancelled' 
          })
        }
      });
    } else if (userRole === 'barber') {
      // Barber dashboard
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const todayBookings = await Booking.find({
        barber: userId,
        scheduledTime: { $gte: startOfDay, $lt: endOfDay }
      })
      .populate('customer', 'name phone')
      .populate('services.service', 'name duration')
      .sort({ scheduledTime: 1 });

      const upcomingBookings = await Booking.find({
        barber: userId,
        scheduledTime: { $gte: endOfDay },
        status: { $in: ['pending', 'confirmed'] }
      })
      .populate('customer', 'name phone')
      .populate('services.service', 'name duration')
      .sort({ scheduledTime: 1 })
      .limit(10);

      // Get queue info
      const Queue = require('../models/Queue');
      const queue = await Queue.findOne({ barber: userId });
      const currentQueue = queue ? queue.queue.filter(item => 
        ['waiting', 'notified', 'in-progress'].includes(item.status)
      ).length : 0;

      res.json({
        todayBookings,
        upcomingBookings,
        queue: {
          currentLength: currentQueue,
          totalServedToday: queue ? queue.totalServedToday : 0,
          averageServiceTime: queue ? queue.averageServiceTime : 30
        },
        stats: {
          todayBookings: todayBookings.length,
          completedToday: todayBookings.filter(b => b.status === 'completed').length,
          totalRevenue: todayBookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + b.totalAmount, 0)
        }
      });
    }
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

module.exports = router;
