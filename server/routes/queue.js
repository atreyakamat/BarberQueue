const express = require('express');
const { body, validationResult } = require('express-validator');
const Queue = require('../models/Queue');
const Booking = require('../models/Booking');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper: Notify customers when their queue position is <= 2
async function notifyNearFrontCustomers(queue, io) {
  const activeItems = queue.queue.filter(item =>
    ['waiting', 'notified'].includes(item.status)
  );

  for (let i = 0; i < activeItems.length; i++) {
    const position = i + 1; // 1-based position
    if (position <= 2) {
      try {
        const booking = await Booking.findById(activeItems[i].booking);
        if (booking) {
          io.to(`customer-${booking.customer}`).emit('notification', {
            type: 'info',
            message: position === 1
              ? '🎉 You are next! Please be ready.'
              : '⏳ Almost your turn! You are #2 in the queue.',
            position,
            bookingId: booking._id.toString()
          });
        }
      } catch (err) {
        console.error('Error notifying near-front customer:', err);
      }
    }
  }
}

// Get my queue (for barbers) - Must come before /:barberId route
router.get('/my-queue', auth, authorize('barber'), async (req, res) => {
  try {
    const barberId = req.user.userId;
    
    let queue = await Queue.findOne({ barber: barberId })
      .populate({
        path: 'queue.booking',
        populate: [
          { path: 'customer', select: 'name phone' },
          { path: 'services.service', select: 'name duration price' }
        ]
      })
      .populate({
        path: 'currentlyServing',
        populate: [
          { path: 'customer', select: 'name phone' },
          { path: 'services.service', select: 'name duration price' }
        ]
      });

    if (!queue) {
      queue = new Queue({ barber: barberId });
      await queue.save();
    }

    // Reset daily stats if needed
    queue.resetDailyStats();

    // Filter active queue items
    const activeQueue = queue.queue.filter(item => 
      ['waiting', 'notified', 'in-progress'].includes(item.status)
    );

    res.json({
      _id: queue._id,
      queue: activeQueue,
      currentlyServing: queue.currentlyServing,
      totalServedToday: queue.totalServedToday,
      averageServiceTime: queue.averageServiceTime,
      estimatedWaitTime: activeQueue.length * queue.averageServiceTime,
      queueLength: activeQueue.length
    });
  } catch (error) {
    console.error('Get my queue error:', error);
    res.status(500).json({ message: 'Server error fetching my queue' });
  }
});

// Get queue for a barber
router.get('/:barberId', async (req, res) => {
  try {
    const { barberId } = req.params;
    
    let queue = await Queue.findOne({ barber: barberId })
      .populate({
        path: 'queue.booking',
        populate: [
          { path: 'customer', select: 'name phone' },
          { path: 'services.service', select: 'name duration' }
        ]
      })
      .populate('currentlyServing', 'customer services');

    if (!queue) {
      queue = new Queue({ barber: barberId });
      await queue.save();
    }

    // Reset daily stats if needed
    queue.resetDailyStats();

    // Filter active queue items
    const activeQueue = queue.queue.filter(item => 
      ['waiting', 'notified', 'in-progress'].includes(item.status)
    );

    res.json({
      queue: activeQueue,
      currentlyServing: queue.currentlyServing,
      totalServedToday: queue.totalServedToday,
      averageServiceTime: queue.averageServiceTime,
      estimatedWaitTime: activeQueue.length * queue.averageServiceTime
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ message: 'Server error fetching queue' });
  }
});

// Join queue (customer)
router.post('/join', auth, authorize('customer'), [
  body('barberId').isMongoId().withMessage('Invalid barber ID'),
  body('services').isArray({ min: 1 }).withMessage('At least one service is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { barberId, services, notes } = req.body;

    // Check if user already has an active booking in queue
    const existingBooking = await Booking.findOne({
      customer: req.user.userId,
      barber: barberId,
      status: { $in: ['pending', 'confirmed', 'in-progress'] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'You already have an active booking with this barber' });
    }

    // Create walk-in booking
    const Service = require('../models/Service');
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

    const booking = new Booking({
      customer: req.user.userId,
      barber: barberId,
      services: bookingServices,
      scheduledTime: new Date(),
      totalAmount,
      totalDuration,
      notes,
      isWalkIn: true,
      status: 'confirmed'
    });

    await booking.save();

    // Add to queue
    let queue = await Queue.findOne({ barber: barberId });
    if (!queue) {
      queue = new Queue({ barber: barberId });
    }

    const position = queue.addToQueue(booking._id);
    booking.queuePosition = position;
    
    // Calculate estimated wait time
    const estimatedWaitTime = (position - 1) * queue.averageServiceTime;
    booking.estimatedWaitTime = estimatedWaitTime;

    await booking.save();
    await queue.save();

    // Emit real-time update
    req.io.to(`barber-${barberId}`).emit('queue-updated', {
      barberId,
      queueLength: queue.queue.length,
      newCustomer: {
        bookingId: booking._id,
        customerName: req.userProfile.name,
        position
      }
    });

    // Notify customers near the front of the queue (position <= 2)
    await notifyNearFrontCustomers(queue, req.io);

    res.status(201).json({
      message: 'Successfully joined queue',
      booking: {
        id: booking._id,
        position,
        estimatedWaitTime,
        totalAmount,
        services: serviceDetails.map(s => ({ name: s.name, duration: s.duration }))
      }
    });
  } catch (error) {
    console.error('Join queue error:', error);
    res.status(500).json({ message: 'Server error joining queue' });
  }
});

// Get customer's position in queue
router.get('/position/:bookingId', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId)
      .populate('barber', 'name shopName')
      .populate('services.service', 'name duration');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user has access to this booking
    if (req.user.role === 'customer' && booking.customer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const queue = await Queue.findOne({ barber: booking.barber });
    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    const queueItem = queue.queue.find(item => 
      item.booking.toString() === bookingId
    );

    if (!queueItem) {
      return res.status(404).json({ message: 'Not in queue' });
    }

    // Calculate current position and wait time
    const waitingItems = queue.queue.filter(item => 
      item.status === 'waiting' && item.position < queueItem.position
    );
    
    const currentPosition = waitingItems.length + 1;
    const estimatedWaitTime = (currentPosition - 1) * queue.averageServiceTime;

    res.json({
      booking: {
        id: booking._id,
        status: booking.status,
        barber: booking.barber,
        services: booking.services,
        totalAmount: booking.totalAmount
      },
      queue: {
        position: currentPosition,
        originalPosition: queueItem.position,
        status: queueItem.status,
        estimatedWaitTime,
        joinedAt: queueItem.joinedAt,
        totalInQueue: queue.queue.filter(item => 
          ['waiting', 'notified', 'in-progress'].includes(item.status)
        ).length
      }
    });
  } catch (error) {
    console.error('Get queue position error:', error);
    res.status(500).json({ message: 'Server error fetching queue position' });
  }
});

// Update queue item status (barber only)
router.put('/update/:bookingId', auth, authorize('barber'), [
  body('status').isIn(['waiting', 'notified', 'in-progress', 'completed', 'no-show']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId } = req.params;
    const { status } = req.body;

    const queue = await Queue.findOne({ barber: req.user.userId });
    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    const queueItem = queue.queue.find(item => 
      item.booking.toString() === bookingId
    );

    if (!queueItem) {
      return res.status(404).json({ message: 'Booking not found in queue' });
    }

    // Update queue item status
    queueItem.status = status;
    
    if (status === 'notified') {
      queueItem.notifiedAt = new Date();
    } else if (status === 'in-progress') {
      queueItem.startedAt = new Date();
      queue.currentlyServing = bookingId;
    } else if (status === 'completed') {
      queueItem.completedAt = new Date();
      queue.totalServedToday += 1;
      queue.currentlyServing = null;
      
      // Update average service time
      if (queueItem.startedAt) {
        const serviceTime = (new Date() - queueItem.startedAt) / (1000 * 60); // in minutes
        queue.averageServiceTime = (queue.averageServiceTime + serviceTime) / 2;
      }
    }

    await queue.save();

    // Update booking status
    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.status = status === 'completed' ? 'completed' : 
                      status === 'no-show' ? 'no-show' : 
                      status === 'in-progress' ? 'in-progress' : booking.status;
      await booking.save();

      // Notify customer
      req.io.to(`customer-${booking.customer}`).emit('booking-updated', {
        bookingId,
        status,
        message: status === 'notified' ? 'Your turn is approaching! Please be ready.' :
                status === 'in-progress' ? 'Your service has started.' :
                status === 'completed' ? 'Your service is complete. Thank you!' :
                `Status updated to ${status}`
      });
    }

    // Emit real-time update to barber dashboard
    req.io.to(`barber-${req.user.userId}`).emit('queue-updated', {
      barberId: req.user.userId,
      bookingId,
      status,
      queueLength: queue.queue.filter(item => 
        ['waiting', 'notified', 'in-progress'].includes(item.status)
      ).length
    });

    // Notify customers near the front of the queue (position <= 2)
    await notifyNearFrontCustomers(queue, req.io);

    res.json({
      message: 'Queue status updated successfully',
      queueItem
    });
  } catch (error) {
    console.error('Update queue error:', error);
    res.status(500).json({ message: 'Server error updating queue' });
  }
});

// Remove from queue (barber only)
router.delete('/remove/:bookingId', auth, authorize('barber'), async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const queue = await Queue.findOne({ barber: req.user.userId });
    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    const queueItem = queue.queue.find(item => 
      item.booking.toString() === bookingId
    );

    if (!queueItem) {
      return res.status(404).json({ message: 'Booking not found in queue' });
    }

    // Remove from queue
    queue.removeFromQueue(bookingId);
    await queue.save();

    // Update booking status
    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.status = 'cancelled';
      await booking.save();

      // Notify customer
      req.io.to(`customer-${booking.customer}`).emit('booking-updated', {
        bookingId,
        status: 'cancelled',
        message: 'Your booking has been removed from the queue.'
      });
    }

    // Emit real-time update
    req.io.to(`barber-${req.user.userId}`).emit('queue-updated', {
      barberId: req.user.userId,
      removedBooking: bookingId,
      queueLength: queue.queue.length
    });

    // Notify customers near the front of the queue (position <= 2)
    await notifyNearFrontCustomers(queue, req.io);

    res.json({ message: 'Booking removed from queue successfully' });
  } catch (error) {
    console.error('Remove from queue error:', error);
    res.status(500).json({ message: 'Server error removing from queue' });
  }
});

// Get queue statistics (barber only)
router.get('/stats/:barberId', auth, authorize('barber'), async (req, res) => {
  try {
    const { barberId } = req.params;
    
    if (barberId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const queue = await Queue.findOne({ barber: barberId });
    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Get today's bookings
    const todayBookings = await Booking.countDocuments({
      barber: barberId,
      scheduledTime: { $gte: startOfDay, $lt: endOfDay }
    });

    const completedToday = await Booking.countDocuments({
      barber: barberId,
      status: 'completed',
      actualEndTime: { $gte: startOfDay, $lt: endOfDay }
    });

    const activeQueue = queue.queue.filter(item => 
      ['waiting', 'notified', 'in-progress'].includes(item.status)
    );

    res.json({
      queueLength: activeQueue.length,
      totalServedToday: queue.totalServedToday,
      averageServiceTime: queue.averageServiceTime,
      todayBookings,
      completedToday,
      currentlyServing: queue.currentlyServing,
      estimatedCompletionTime: activeQueue.length * queue.averageServiceTime
    });
  } catch (error) {
    console.error('Get queue stats error:', error);
    res.status(500).json({ message: 'Server error fetching queue statistics' });
  }
});

// Call next customer (for barbers)
router.post('/:queueId/next', auth, authorize('barber'), async (req, res) => {
  try {
    const { queueId } = req.params;
    const barberId = req.user.userId;
    
    const queue = await Queue.findById(queueId)
      .populate({
        path: 'queue.booking',
        populate: [
          { path: 'customer', select: 'name phone' },
          { path: 'services.service', select: 'name duration price' }
        ]
      });
    
    if (!queue || queue.barber.toString() !== barberId) {
      return res.status(404).json({ message: 'Queue not found or unauthorized' });
    }
    
    // Find the next waiting customer
    const nextCustomer = queue.queue.find(item => item.status === 'waiting');
    
    if (!nextCustomer) {
      return res.status(400).json({ message: 'No customers waiting in queue' });
    }
    
    // Update the current customer to in-progress
    nextCustomer.status = 'in-progress';
    nextCustomer.notifiedAt = new Date();
    nextCustomer.startedAt = new Date();
    
    // If there was someone currently being served, mark them as completed
    if (queue.currentlyServing) {
      const currentBooking = await Booking.findById(queue.currentlyServing);
      if (currentBooking && currentBooking.status === 'in-progress') {
        currentBooking.status = 'completed';
        await currentBooking.save();
      }
      queue.totalServedToday += 1;
    }
    
    // Set the new customer as currently serving
    queue.currentlyServing = nextCustomer.booking;
    
    await queue.save();
    
    // Update the booking status
    const booking = await Booking.findById(nextCustomer.booking);
    if (booking) {
      booking.status = 'in-progress';
      await booking.save();

      // Notify the called customer
      req.io.to(`customer-${booking.customer}`).emit('notification', {
        type: 'info',
        message: '🎉 It\'s your turn! Your service is about to begin.',
        bookingId: booking._id.toString()
      });
    }

    // Notify customers near the front of the queue (position <= 2)
    await notifyNearFrontCustomers(queue, req.io);
    
    res.json({
      message: 'Next customer called successfully',
      nextCustomer: nextCustomer,
      queue: queue
    });
  } catch (error) {
    console.error('Call next customer error:', error);
    res.status(500).json({ message: 'Server error calling next customer' });
  }
});

module.exports = router;
