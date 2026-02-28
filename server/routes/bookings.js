const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Queue = require('../models/Queue');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get barber statistics - Must come before /:id route
router.get('/stats', auth, authorize('barber'), async (req, res) => {
  try {
    const barberId = req.user.userId;
    
    // Get all bookings for this barber
    const allBookings = await Booking.find({ barber: barberId });
    
    // Today's bookings
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    const todayBookings = await Booking.find({
      barber: barberId,
      scheduledTime: { $gte: startOfDay, $lte: endOfDay }
    });
    
    // Calculate statistics
    const stats = {
      totalBookings: allBookings.length,
      todayBookings: todayBookings.length,
      completedBookings: allBookings.filter(b => b.status === 'completed').length,
      pendingBookings: allBookings.filter(b => b.status === 'pending').length,
      confirmedBookings: allBookings.filter(b => b.status === 'confirmed').length,
      cancelledBookings: allBookings.filter(b => b.status === 'cancelled').length,
      totalRevenue: allBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.totalAmount, 0),
      todayRevenue: todayBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.totalAmount, 0)
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get barber stats error:', error);
    res.status(500).json({ message: 'Server error fetching barber statistics' });
  }
});

// Get today's bookings for barber - Must come before /:id route
router.get('/today', auth, authorize('barber'), async (req, res) => {
  try {
    const barberId = req.user.userId;
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    const todayBookings = await Booking.find({
      barber: barberId,
      scheduledTime: { $gte: startOfDay, $lte: endOfDay }
    })
    .populate('customer', 'name phone')
    .populate('services.service', 'name duration price')
    .sort({ scheduledTime: 1 });
    
    res.json({ bookings: todayBookings });
  } catch (error) {
    console.error('Get today bookings error:', error);
    res.status(500).json({ message: 'Server error fetching today\'s bookings' });
  }
});

// Create new booking
router.post('/', auth, authorize('customer'), [
  body('barberId').isMongoId().withMessage('Invalid barber ID'),
  body('services').isArray({ min: 1 }).withMessage('At least one service is required'),
  body('scheduledTime').isISO8601().withMessage('Invalid scheduled time'),
  body('isWalkIn').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { barberId, services, scheduledTime, notes, isWalkIn = false } = req.body;

    // Validate services and calculate totals
    const serviceDetails = await Service.find({
      _id: { $in: services },
      barberId,
      isActive: true
    });

    if (serviceDetails.length !== services.length) {
      return res.status(400).json({ message: 'Some services are not available' });
    }

    const bookingServices = serviceDetails.map(service => ({
      service: service._id,
      price: service.price
    }));

    const totalAmount = serviceDetails.reduce((sum, service) => sum + service.price, 0);
    const totalDuration = serviceDetails.reduce((sum, service) => sum + service.duration, 0);

    // Check if scheduled time is in the future
    const scheduledDate = new Date(scheduledTime);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ message: 'Scheduled time must be in the future' });
    }

    // Create booking
    const booking = new Booking({
      customer: req.user.userId,
      barber: barberId,
      services: bookingServices,
      scheduledTime: scheduledDate,
      totalAmount,
      totalDuration,
      notes,
      isWalkIn
    });

    await booking.save();

    // Add to queue if it's a walk-in or scheduled for today
    const today = new Date();
    const isToday = scheduledDate.toDateString() === today.toDateString();
    
    if (isWalkIn || isToday) {
      let queue = await Queue.findOne({ barber: barberId });
      if (!queue) {
        queue = new Queue({ barber: barberId });
      }
      
      const position = queue.addToQueue(booking._id);
      booking.queuePosition = position;
      await booking.save();
      await queue.save();

      // Emit real-time update
      req.io.to(`barber-${barberId}`).emit('queue-updated', {
        barberId,
        queueLength: queue.queue.length,
        newBooking: booking._id
      });
    }

    // Populate booking details
    const populatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name phone')
      .populate('barber', 'name shopName')
      .populate('services.service', 'name duration');

    res.status(201).json({
      message: 'Booking created successfully',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { customer: req.user.userId };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('barber', 'name shopName shopAddress phone')
      .populate('services.service', 'name duration')
      .sort({ scheduledTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
});

// Get barber's bookings
router.get('/barber-bookings', auth, authorize('barber'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date } = req.query;
    const query = { barber: req.user.userId };

    if (status) {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query.scheduledTime = { $gte: startDate, $lt: endDate };
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'name phone')
      .populate('services.service', 'name duration')
      .sort({ scheduledTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get barber bookings error:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
});

// Get booking details
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('customer', 'name phone')
      .populate('barber', 'name shopName shopAddress phone workingHours')
      .populate('services.service', 'name duration description');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user has access to this booking
    if (req.user.role === 'customer' && booking.customer._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'barber' && booking.barber._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error fetching booking' });
  }
});

// Update booking status (barber only)
router.put('/:id/status', auth, authorize('barber'), [
  body('status').isIn(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findOne({ _id: id, barber: req.user.userId });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const oldStatus = booking.status;
    booking.status = status;

    // Update timestamps based on status
    if (status === 'in-progress' && oldStatus !== 'in-progress') {
      booking.actualStartTime = new Date();
    } else if (status === 'completed' && oldStatus !== 'completed') {
      booking.actualEndTime = new Date();
    }

    await booking.save();

    // Update queue status
    const queue = await Queue.findOne({ barber: req.user.userId });
    if (queue) {
      const queueItem = queue.queue.find(item => 
        item.booking.toString() === id
      );
      
      if (queueItem) {
        queueItem.status = status;
        if (status === 'in-progress') {
          queueItem.startedAt = new Date();
          queue.currentlyServing = booking._id;
        } else if (status === 'completed') {
          queueItem.completedAt = new Date();
          queue.totalServedToday += 1;
          queue.currentlyServing = null;
        }
        await queue.save();

        // Emit real-time update
        req.io.to(`barber-${req.user.userId}`).emit('queue-updated', {
          barberId: req.user.userId,
          bookingId: id,
          status
        });
      }
    }

    // Notify customer
    req.io.to(`customer-${booking.customer}`).emit('booking-updated', {
      bookingId: id,
      status,
      message: `Your booking status has been updated to ${status}`
    });

    res.json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error updating booking status' });
  }
});

// Cancel booking (customer only)
router.put('/:id/cancel', auth, authorize('customer'), async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOne({ _id: id, customer: req.user.userId });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot cancel this booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Remove from queue
    const queue = await Queue.findOne({ barber: booking.barber });
    if (queue) {
      queue.removeFromQueue(booking._id);
      await queue.save();

      // Emit real-time update
      req.io.to(`barber-${booking.barber}`).emit('queue-updated', {
        barberId: booking.barber,
        queueLength: queue.queue.length,
        removedBooking: booking._id
      });
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error cancelling booking' });
  }
});

// Reschedule booking (customer only)
router.put('/:id/reschedule', auth, authorize('customer'), [
  body('date').isISO8601().withMessage('Invalid date format'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('barber', 'name shopName')
      .populate('services.service', 'name price duration');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.customer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking can be rescheduled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot reschedule this booking' });
    }

    const { date, time } = req.body;
    
    // Create new scheduled time
    const newScheduledTime = new Date(`${date}T${time}`);
    
    // Check if new time is in the future
    if (newScheduledTime <= new Date()) {
      return res.status(400).json({ message: 'Scheduled time must be in the future' });
    }

    // Check for conflicts with existing bookings
    const conflictingBooking = await Booking.findOne({
      barber: booking.barber,
      scheduledTime: {
        $gte: newScheduledTime,
        $lt: new Date(newScheduledTime.getTime() + booking.totalDuration * 60000)
      },
      status: { $in: ['confirmed', 'in-progress'] },
      _id: { $ne: booking._id }
    });

    if (conflictingBooking) {
      return res.status(400).json({ message: 'Time slot is already booked' });
    }

    // Update booking
    booking.scheduledTime = newScheduledTime;
    booking.status = 'confirmed';
    booking.updatedAt = new Date();
    
    await booking.save();

    // Populate the updated booking
    const updatedBooking = await Booking.findById(booking._id)
      .populate('barber', 'name shopName phone')
      .populate('services.service', 'name price duration category')
      .populate('customer', 'name phone');

    res.json({
      message: 'Booking rescheduled successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({ message: 'Server error rescheduling booking' });
  }
});

// Add rating and review (customer only)
router.put('/:id/review', auth, authorize('customer'), [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().trim().isLength({ max: 500 }).withMessage('Review must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { rating, review } = req.body;

    const booking = await Booking.findOne({ 
      _id: id, 
      customer: req.user.userId,
      status: 'completed'
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or not completed' });
    }

    if (booking.rating) {
      return res.status(400).json({ message: 'Review already submitted' });
    }

    booking.rating = rating;
    booking.review = review;
    await booking.save();

    // Update barber's rating
    const User = require('../models/User');
    const barber = await User.findById(booking.barber);
    
    if (barber) {
      const totalRating = (barber.rating * barber.totalRatings) + rating;
      barber.totalRatings += 1;
      barber.rating = totalRating / barber.totalRatings;
      await barber.save();
    }

    res.json({
      message: 'Review submitted successfully',
      booking
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error adding review' });
  }
});

// Get available time slots for a barber on a specific date
router.get('/available-slots', async (req, res) => {
  try {
    const { barberId, date, serviceId } = req.query;

    if (!barberId || !date) {
      return res.status(400).json({ message: 'Barber ID and date are required' });
    }

    // Get service details if provided
    let serviceDuration = 60; // Default 60 minutes
    if (serviceId) {
      const service = await Service.findById(serviceId);
      if (service) {
        serviceDuration = service.duration;
      }
    }

    // Get existing bookings for the date
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await Booking.find({
      barber: barberId,
      scheduledTime: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['confirmed', 'in-progress'] }
    }).sort({ scheduledTime: 1 });

    // Generate available slots (9 AM to 8 PM, every 30 minutes)
    const slots = [];
    const workingHours = { start: 9, end: 20 }; // 9 AM to 8 PM
    const slotInterval = 30; // 30 minutes

    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minutes = 0; minutes < 60; minutes += slotInterval) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minutes, 0, 0);
        
        // Skip past times
        if (slotTime <= new Date()) continue;

        // Check if slot conflicts with existing bookings
        const slotEndTime = new Date(slotTime.getTime() + serviceDuration * 60000);
        
        const hasConflict = existingBookings.some(booking => {
          const bookingStart = new Date(booking.scheduledTime);
          const bookingEnd = new Date(bookingStart.getTime() + booking.totalDuration * 60000);
          
          return (slotTime < bookingEnd && slotEndTime > bookingStart);
        });

        if (!hasConflict) {
          slots.push({
            time: slotTime.toISOString(),
            displayTime: slotTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            }),
            available: true
          });
        }
      }
    }

    res.json({ slots });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ message: 'Server error fetching available slots' });
  }
});

// Get barber availability status
router.get('/barber-status/:barberId', async (req, res) => {
  try {
    const { barberId } = req.params;
    
    // Get current queue status
    const currentQueue = await Queue.findOne({ barber: barberId })
      .populate('queue.booking');
    
    // Get current booking if any
    const now = new Date();
    const currentBooking = await Booking.findOne({
      barber: barberId,
      scheduledTime: { $lte: now },
      status: 'in-progress'
    }).populate('customer', 'name');

    const status = {
      isAvailable: !currentBooking,
      currentCustomer: currentBooking ? currentBooking.customer.name : null,
      queueLength: currentQueue ? currentQueue.queue.length : 0,
      estimatedWaitTime: currentQueue ? currentQueue.queue.length * 30 : 0, // 30 min average
      nextAvailableSlot: null
    };

    // Calculate next available slot
    if (!status.isAvailable) {
      const nextSlot = new Date(now.getTime() + status.estimatedWaitTime * 60000);
      status.nextAvailableSlot = nextSlot.toISOString();
    }

    res.json(status);
  } catch (error) {
    console.error('Get barber status error:', error);
    res.status(500).json({ message: 'Server error fetching barber status' });
  }
});

module.exports = router;
