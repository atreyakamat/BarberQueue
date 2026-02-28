const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

// Map a booking row + joined services into the frontend-expected shape.
// `row` is a single booking row. `services` is an array from booking_services join.
function mapBooking(row, services = []) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    customer: row.customer_obj || row.customer_id,
    barber: row.barber_obj || row.barber_id,
    services: services.map((s) => ({
      service: {
        _id: s.service_id,
        id: s.service_id,
        name: s.service_name,
        duration: s.service_duration,
        price: parseFloat(s.service_price),
      },
      price: parseFloat(s.bs_price),
      _id: s.bs_id,
    })),
    scheduledTime: row.scheduled_time,
    status: row.status,
    totalAmount: parseFloat(row.total_amount),
    totalDuration: row.total_duration,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    notes: row.notes,
    queuePosition: row.queue_position,
    estimatedWaitTime: row.estimated_wait_time,
    actualStartTime: row.actual_start_time,
    actualEndTime: row.actual_end_time,
    rating: row.rating,
    review: row.review,
    isWalkIn: row.is_walk_in,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Fetch booking_services joined with services table for a list of booking IDs
async function fetchBookingServices(bookingIds, trx) {
  const conn = trx || db;
  if (!bookingIds.length) return {};
  const rows = await conn('booking_services as bs')
    .join('services as s', 's.id', 'bs.service_id')
    .whereIn('bs.booking_id', bookingIds)
    .select(
      'bs.id as bs_id',
      'bs.booking_id',
      'bs.service_id',
      'bs.price as bs_price',
      's.name as service_name',
      's.duration as service_duration',
      's.price as service_price'
    );
  const map = {};
  for (const r of rows) {
    if (!map[r.booking_id]) map[r.booking_id] = [];
    map[r.booking_id].push(r);
  }
  return map;
}

// Populate customer/barber lightweight objects on booking rows
async function populateUsers(bookings, fields = ['name', 'phone', 'shop_name']) {
  const uids = [...new Set(bookings.flatMap((b) => [b.customer_id, b.barber_id]))];
  if (!uids.length) return;
  const users = await db('users').whereIn('id', uids).select('id', ...fields);
  const umap = {};
  for (const u of users) {
    umap[u.id] = {
      _id: u.id,
      id: u.id,
      name: u.name,
      phone: u.phone,
      shopName: u.shop_name,
      shopAddress: u.shop_address,
      rating: u.rating ? parseFloat(u.rating) : undefined,
    };
  }
  for (const b of bookings) {
    b.customer_obj = umap[b.customer_id] || b.customer_id;
    b.barber_obj = umap[b.barber_id] || b.barber_id;
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   GET /stats  (barber only)
   ═══════════════════════════════════════════════════════════════════════ */
router.get('/stats', auth, authorize('barber'), async (req, res) => {
  try {
    const barberId = req.user.userId;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    const [totalBookings] = await db('bookings').where({ barber_id: barberId }).count('id as count');
    const [completedBookings] = await db('bookings').where({ barber_id: barberId, status: 'completed' }).count('id as count');
    const [todayBookings] = await db('bookings')
      .where({ barber_id: barberId })
      .whereBetween('scheduled_time', [startOfDay, endOfDay])
      .count('id as count');
    const [todayRevenue] = await db('bookings')
      .where({ barber_id: barberId, status: 'completed' })
      .whereBetween('scheduled_time', [startOfDay, endOfDay])
      .sum('total_amount as total');

    const [{ avg: avgRating }] = await db('bookings')
      .where({ barber_id: barberId })
      .whereNotNull('rating')
      .avg('rating as avg');

    res.json({
      totalBookings: parseInt(totalBookings.count),
      completedBookings: parseInt(completedBookings.count),
      todayBookings: parseInt(todayBookings.count),
      todayRevenue: parseFloat(todayRevenue.total) || 0,
      averageRating: avgRating ? parseFloat(avgRating).toFixed(1) : '0.0',
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({ message: 'Server error fetching booking stats' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   GET /today  (barber only)
   ═══════════════════════════════════════════════════════════════════════ */
router.get('/today', auth, authorize('barber'), async (req, res) => {
  try {
    const barberId = req.user.userId;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    const rows = await db('bookings')
      .where({ barber_id: barberId })
      .whereBetween('scheduled_time', [startOfDay, endOfDay])
      .orderBy('scheduled_time');

    await populateUsers(rows, ['name', 'phone', 'shop_name']);
    const svcMap = await fetchBookingServices(rows.map((r) => r.id));

    res.json({
      bookings: rows.map((r) => mapBooking(r, svcMap[r.id] || [])),
    });
  } catch (error) {
    console.error('Get today bookings error:', error);
    res.status(500).json({ message: 'Server error fetching today bookings' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   POST / — Create Booking
   Uses a SERIALIZABLE transaction to prevent double-booking
   ═══════════════════════════════════════════════════════════════════════ */
router.post(
  '/',
  auth,
  authorize('customer'),
  [
    body('barberId').isUUID().withMessage('Invalid barber ID'),
    body('services').isArray({ min: 1 }).withMessage('At least one service is required'),
    body('scheduledTime').isISO8601().withMessage('Valid scheduled time is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { barberId, services: rawServices, scheduledTime, notes, isWalkIn } = req.body;

      // Normalize: accept both [uuid] and [{serviceId: uuid}]
      const serviceIds = rawServices.map((s) => (typeof s === 'string' ? s : s.serviceId || s.service));

      // --- TRANSACTION: atomic booking creation + conflict check ---
      const result = await db.transaction(async (trx) => {
        // 1. Verify barber exists and is available
        const barber = await trx('users')
          .where({ id: barberId, role: 'barber', is_active: true })
          .first();
        if (!barber) throw { status: 404, message: 'Barber not found or unavailable' };

        // 2. Fetch requested services
        const svcRows = await trx('services')
          .whereIn('id', serviceIds)
          .where({ barber_id: barberId, is_active: true });
        if (svcRows.length !== serviceIds.length) {
          throw { status: 400, message: 'Some services are not available' };
        }

        const totalAmount = svcRows.reduce((s, svc) => s + parseFloat(svc.price), 0);
        const totalDuration = svcRows.reduce((s, svc) => s + svc.duration, 0);

        // 3. Conflict check — lock overlapping bookings to prevent double-booking
        const schedTime = new Date(scheduledTime);
        const endTime = new Date(schedTime.getTime() + totalDuration * 60000);

        const conflicts = await trx('bookings')
          .where({ barber_id: barberId })
          .whereIn('status', ['confirmed', 'in-progress'])
          .where('scheduled_time', '<', endTime)
          .whereRaw(`(scheduled_time + (total_duration || ' minutes')::interval) > ?`, [schedTime])
          .forUpdate(); // row-level lock

        if (conflicts.length > 0) {
          throw { status: 409, message: 'Time slot conflict — the barber already has a booking during this period' };
        }

        // 4. Insert booking
        const [booking] = await trx('bookings').insert({
          customer_id: req.user.userId,
          barber_id: barberId,
          scheduled_time: schedTime,
          total_amount: totalAmount,
          total_duration: totalDuration,
          notes: notes || null,
          is_walk_in: !!isWalkIn,
          status: 'confirmed',
        }).returning('*');

        // 5. Insert booking_services
        const bsInserts = svcRows.map((svc) => ({
          booking_id: booking.id,
          service_id: svc.id,
          price: svc.price,
        }));
        await trx('booking_services').insert(bsInserts);

        // 6. Increment service popularity
        await trx('services').whereIn('id', serviceIds).increment('popularity', 1);

        return booking;
      });

      // Emit real-time notification
      req.io.to(`barber-${barberId}`).emit('new-booking', {
        bookingId: result.id,
        customerName: req.userProfile.name,
        scheduledTime: result.scheduled_time,
      });

      const svcMap = await fetchBookingServices([result.id]);
      res.status(201).json({
        message: 'Booking created successfully',
        booking: mapBooking(result, svcMap[result.id] || []),
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ message: error.message });
      }
      console.error('Create booking error:', error);
      res.status(500).json({ message: 'Server error creating booking' });
    }
  }
);

/* ═══════════════════════════════════════════════════════════════════════
   GET /my-bookings (customer)
   ═══════════════════════════════════════════════════════════════════════ */
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let query = db('bookings').where({ customer_id: req.user.userId });
    if (status) query = query.where({ status });

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const rows = await query.orderBy('created_at', 'desc').limit(parseInt(limit)).offset(offset);
    const [{ count }] = await db('bookings').where({ customer_id: req.user.userId }).count('id as count');

    await populateUsers(rows, ['name', 'phone', 'shop_name', 'shop_address', 'rating']);
    const svcMap = await fetchBookingServices(rows.map((r) => r.id));

    res.json({
      bookings: rows.map((r) => mapBooking(r, svcMap[r.id] || [])),
      totalPages: Math.ceil(parseInt(count) / parseInt(limit)),
      currentPage: parseInt(page),
      total: parseInt(count),
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   GET /barber-bookings (barber)
   ═══════════════════════════════════════════════════════════════════════ */
router.get('/barber-bookings', auth, authorize('barber'), async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    let query = db('bookings').where({ barber_id: req.user.userId });

    if (status) query = query.where({ status });
    if (date) {
      const start = new Date(date);
      const end = new Date(start.getTime() + 86400000);
      query = query.whereBetween('scheduled_time', [start, end]);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const rows = await query.orderBy('scheduled_time', 'desc').limit(parseInt(limit)).offset(offset);

    await populateUsers(rows, ['name', 'phone', 'shop_name']);
    const svcMap = await fetchBookingServices(rows.map((r) => r.id));

    const [{ count }] = await db('bookings').where({ barber_id: req.user.userId }).count('id as count');

    res.json({
      bookings: rows.map((r) => mapBooking(r, svcMap[r.id] || [])),
      totalPages: Math.ceil(parseInt(count) / parseInt(limit)),
      currentPage: parseInt(page),
      total: parseInt(count),
    });
  } catch (error) {
    console.error('Get barber bookings error:', error);
    res.status(500).json({ message: 'Server error fetching barber bookings' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   GET /:id  — Booking details
   ═══════════════════════════════════════════════════════════════════════ */
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await db('bookings').where({ id: req.params.id }).first();
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Access check
    if (
      req.user.role === 'customer' && booking.customer_id !== req.user.userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await populateUsers([booking], ['name', 'phone', 'shop_name', 'shop_address', 'rating']);
    const svcMap = await fetchBookingServices([booking.id]);

    res.json({ booking: mapBooking(booking, svcMap[booking.id] || []) });
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({ message: 'Server error fetching booking details' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   PUT /:id/status — Update status (barber only)
   Uses optimistic locking via version column
   ═══════════════════════════════════════════════════════════════════════ */
router.put(
  '/:id/status',
  auth,
  authorize('barber'),
  [body('status').isIn(['confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { status } = req.body;

      const updated = await db.transaction(async (trx) => {
        const booking = await trx('bookings')
          .where({ id: req.params.id, barber_id: req.user.userId })
          .forUpdate()
          .first();

        if (!booking) throw { status: 404, message: 'Booking not found' };

        const updates = { status, updated_at: new Date(), version: booking.version + 1 };
        if (status === 'in-progress') updates.actual_start_time = new Date();
        if (status === 'completed') updates.actual_end_time = new Date();

        // Optimistic lock check
        const count = await trx('bookings')
          .where({ id: booking.id, version: booking.version })
          .update(updates);

        if (count === 0) throw { status: 409, message: 'Concurrent update detected, please retry' };

        return trx('bookings').where({ id: booking.id }).first();
      });

      // Notify customer
      req.io.to(`customer-${updated.customer_id}`).emit('booking-updated', {
        bookingId: updated.id,
        status,
      });

      const svcMap = await fetchBookingServices([updated.id]);
      res.json({ message: 'Booking status updated', booking: mapBooking(updated, svcMap[updated.id] || []) });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ message: error.message });
      console.error('Update booking status error:', error);
      res.status(500).json({ message: 'Server error updating booking status' });
    }
  }
);

/* ═══════════════════════════════════════════════════════════════════════
   PUT /:id/cancel
   ═══════════════════════════════════════════════════════════════════════ */
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const updated = await db.transaction(async (trx) => {
      const booking = await trx('bookings')
        .where({ id: req.params.id })
        .forUpdate()
        .first();

      if (!booking) throw { status: 404, message: 'Booking not found' };

      // Only owner or barber can cancel
      if (booking.customer_id !== req.user.userId && booking.barber_id !== req.user.userId) {
        throw { status: 403, message: 'Access denied' };
      }
      if (['completed', 'cancelled'].includes(booking.status)) {
        throw { status: 400, message: 'Booking cannot be cancelled' };
      }

      await trx('bookings')
        .where({ id: booking.id })
        .update({ status: 'cancelled', updated_at: new Date() });

      // Remove from queue if present
      await trx('queue_entries')
        .where({ booking_id: booking.id })
        .whereIn('status', ['waiting', 'notified'])
        .del();

      return trx('bookings').where({ id: booking.id }).first();
    });

    req.io.to(`barber-${updated.barber_id}`).emit('booking-updated', {
      bookingId: updated.id,
      status: 'cancelled',
    });

    const svcMap = await fetchBookingServices([updated.id]);
    res.json({
      message: 'Booking cancelled successfully',
      booking: mapBooking(updated, svcMap[updated.id] || []),
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error cancelling booking' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   PUT /:id/reschedule
   ═══════════════════════════════════════════════════════════════════════ */
router.put(
  '/:id/reschedule',
  auth,
  [body('scheduledTime').isISO8601().withMessage('Valid scheduled time is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { scheduledTime } = req.body;

      const updated = await db.transaction(async (trx) => {
        const booking = await trx('bookings')
          .where({ id: req.params.id })
          .forUpdate()
          .first();

        if (!booking) throw { status: 404, message: 'Booking not found' };
        if (booking.customer_id !== req.user.userId) throw { status: 403, message: 'Access denied' };
        if (['completed', 'cancelled', 'in-progress'].includes(booking.status)) {
          throw { status: 400, message: 'Booking cannot be rescheduled' };
        }

        const newTime = new Date(scheduledTime);
        const endTime = new Date(newTime.getTime() + booking.total_duration * 60000);

        // Conflict check with row-level lock
        const conflicts = await trx('bookings')
          .where({ barber_id: booking.barber_id })
          .whereNot({ id: booking.id })
          .whereIn('status', ['confirmed', 'in-progress'])
          .where('scheduled_time', '<', endTime)
          .whereRaw(`(scheduled_time + (total_duration || ' minutes')::interval) > ?`, [newTime])
          .forUpdate();

        if (conflicts.length > 0) {
          throw { status: 400, message: 'New time slot is not available' };
        }

        await trx('bookings')
          .where({ id: booking.id })
          .update({ scheduled_time: newTime, status: 'confirmed', updated_at: new Date() });

        return trx('bookings').where({ id: booking.id }).first();
      });

      req.io.to(`barber-${updated.barber_id}`).emit('booking-updated', {
        bookingId: updated.id,
        status: 'rescheduled',
        newTime: updated.scheduled_time,
      });

      res.json({ message: 'Booking rescheduled successfully' });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ message: error.message });
      console.error('Reschedule booking error:', error);
      res.status(500).json({ message: 'Server error rescheduling booking' });
    }
  }
);

/* ═══════════════════════════════════════════════════════════════════════
   PUT /:id/review
   Uses optimistic locking on user.version for rating update
   ═══════════════════════════════════════════════════════════════════════ */
router.put(
  '/:id/review',
  auth,
  authorize('customer'),
  [
    body('rating').isInt({ min: 1, max: 5 }),
    body('review').optional().trim().isLength({ max: 1000 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { rating, review } = req.body;

      const updatedBooking = await db.transaction(async (trx) => {
        const booking = await trx('bookings')
          .where({ id: req.params.id, customer_id: req.user.userId })
          .forUpdate()
          .first();

        if (!booking) throw { status: 404, message: 'Booking not found' };
        if (booking.status !== 'completed') throw { status: 400, message: 'Can only review completed bookings' };
        if (booking.rating) throw { status: 400, message: 'Already reviewed' };

        await trx('bookings')
          .where({ id: booking.id })
          .update({ rating, review: review || null, updated_at: new Date() });

        // Atomic barber rating update with optimistic locking
        // new_rating = ((old_rating * total_ratings) + new_rating) / (total_ratings + 1)
        const barber = await trx('users')
          .where({ id: booking.barber_id })
          .forUpdate()
          .first();

        const newTotal = barber.total_ratings + 1;
        const newRating = ((parseFloat(barber.rating) * barber.total_ratings) + rating) / newTotal;

        const cnt = await trx('users')
          .where({ id: barber.id, version: barber.version })
          .update({
            rating: newRating.toFixed(2),
            total_ratings: newTotal,
            version: barber.version + 1,
            updated_at: new Date(),
          });

        if (cnt === 0) throw { status: 409, message: 'Concurrent update on barber rating, please retry' };

        return trx('bookings').where({ id: booking.id }).first();
      });

      const svcMap = await fetchBookingServices([updatedBooking.id]);
      res.json({
        message: 'Review submitted successfully',
        booking: mapBooking(updatedBooking, svcMap[updatedBooking.id] || []),
      });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ message: error.message });
      console.error('Submit review error:', error);
      res.status(500).json({ message: 'Server error submitting review' });
    }
  }
);

/* ═══════════════════════════════════════════════════════════════════════
   GET /available-slots
   ═══════════════════════════════════════════════════════════════════════ */
router.get('/available-slots', async (req, res) => {
  try {
    const { barberId, date, serviceId } = req.query;
    if (!barberId || !date) {
      return res.status(400).json({ message: 'Barber ID and date are required' });
    }

    let serviceDuration = 60;
    if (serviceId) {
      const svc = await db('services').where({ id: serviceId }).first();
      if (svc) serviceDuration = svc.duration;
    }

    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await db('bookings')
      .where({ barber_id: barberId })
      .whereIn('status', ['confirmed', 'in-progress'])
      .whereBetween('scheduled_time', [startOfDay, endOfDay])
      .orderBy('scheduled_time');

    const slots = [];
    const workingHours = { start: 9, end: 20 };
    const slotInterval = 30;

    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minutes = 0; minutes < 60; minutes += slotInterval) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minutes, 0, 0);
        if (slotTime <= new Date()) continue;

        const slotEndTime = new Date(slotTime.getTime() + serviceDuration * 60000);
        const hasConflict = existingBookings.some((b) => {
          const bStart = new Date(b.scheduled_time);
          const bEnd = new Date(bStart.getTime() + b.total_duration * 60000);
          return slotTime < bEnd && slotEndTime > bStart;
        });

        if (!hasConflict) {
          slots.push({
            time: slotTime.toISOString(),
            displayTime: slotTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            available: true,
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

/* ═══════════════════════════════════════════════════════════════════════
   GET /barber-status/:barberId
   ═══════════════════════════════════════════════════════════════════════ */
router.get('/barber-status/:barberId', async (req, res) => {
  try {
    const { barberId } = req.params;

    const queue = await db('queues').where({ barber_id: barberId }).first();
    const activeEntries = queue
      ? await db('queue_entries')
          .where({ queue_id: queue.id })
          .whereIn('status', ['waiting', 'notified', 'in-progress'])
          .count('id as count')
      : [{ count: 0 }];

    const now = new Date();
    const currentBooking = await db('bookings')
      .join('users', 'users.id', 'bookings.customer_id')
      .where({ 'bookings.barber_id': barberId, 'bookings.status': 'in-progress' })
      .where('bookings.scheduled_time', '<=', now)
      .select('users.name as customer_name')
      .first();

    const queueLength = parseInt(activeEntries[0]?.count) || 0;
    const status = {
      isAvailable: !currentBooking,
      currentCustomer: currentBooking ? currentBooking.customer_name : null,
      queueLength,
      estimatedWaitTime: queueLength * 30,
      nextAvailableSlot: null,
    };

    if (!status.isAvailable) {
      status.nextAvailableSlot = new Date(now.getTime() + status.estimatedWaitTime * 60000).toISOString();
    }

    res.json(status);
  } catch (error) {
    console.error('Get barber status error:', error);
    res.status(500).json({ message: 'Server error fetching barber status' });
  }
});

module.exports = router;
