const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

// Ensure a queue row exists for a barber (creating if needed) — must be called inside trx
async function ensureQueue(barberId, trx) {
  let queue = await trx('queues').where({ barber_id: barberId }).forUpdate().first();
  if (!queue) {
    [queue] = await trx('queues').insert({ barber_id: barberId }).returning('*');
  }
  // Reset daily stats if new day
  const today = new Date().toISOString().slice(0, 10);
  if (queue.last_reset_date && queue.last_reset_date.toISOString().slice(0, 10) !== today) {
    await trx('queues').where({ id: queue.id }).update({
      total_served_today: 0,
      last_reset_date: today,
    });
    queue.total_served_today = 0;
  }
  return queue;
}

// Notify customers near front of queue (position ≤ 2)
async function notifyNearFrontCustomers(queueId, io) {
  const entries = await db('queue_entries as qe')
    .join('bookings as b', 'b.id', 'qe.booking_id')
    .where({ 'qe.queue_id': queueId })
    .whereIn('qe.status', ['waiting', 'notified'])
    .orderBy('qe.position')
    .select('qe.position', 'b.customer_id', 'b.id as booking_id');

  for (const entry of entries) {
    if (entry.position <= 2) {
      io.to(`customer-${entry.customer_id}`).emit('notification', {
        type: 'info',
        message:
          entry.position === 1
            ? '🎉 You are next! Please be ready.'
            : '⏳ Almost your turn! You are #2 in the queue.',
        position: entry.position,
        bookingId: entry.booking_id,
      });
    }
  }
}

// Map a queue entry row with populated booking data
function mapQueueEntry(entry) {
  return {
    _id: entry.id || entry.qe_id,
    booking: entry.booking_id
      ? {
          _id: entry.booking_id,
          id: entry.booking_id,
          customer: entry.customer_name
            ? { _id: entry.customer_id, name: entry.customer_name, phone: entry.customer_phone }
            : entry.customer_id,
          services: [], // populated separately if needed
          totalAmount: entry.total_amount ? parseFloat(entry.total_amount) : undefined,
          totalDuration: entry.total_duration,
        }
      : null,
    position: entry.position,
    status: entry.status || entry.qe_status,
    estimatedTime: entry.estimated_time,
    joinedAt: entry.joined_at,
    notifiedAt: entry.notified_at,
    startedAt: entry.started_at,
    completedAt: entry.completed_at,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   GET /my-queue  (barber — must be before /:barberId)
   ═══════════════════════════════════════════════════════════════════════ */
router.get('/my-queue', auth, authorize('barber'), async (req, res) => {
  try {
    const barberId = req.user.userId;

    // Ensure queue exists (read-only, no trx needed for GET)
    let queue = await db('queues').where({ barber_id: barberId }).first();
    if (!queue) {
      [queue] = await db('queues').insert({ barber_id: barberId }).returning('*');
    }

    const entries = await db('queue_entries as qe')
      .join('bookings as b', 'b.id', 'qe.booking_id')
      .join('users as u', 'u.id', 'b.customer_id')
      .where({ 'qe.queue_id': queue.id })
      .whereIn('qe.status', ['waiting', 'notified', 'in-progress'])
      .orderBy('qe.position')
      .select(
        'qe.id as qe_id', 'qe.position', 'qe.status as qe_status',
        'qe.estimated_time', 'qe.joined_at', 'qe.notified_at',
        'qe.started_at', 'qe.completed_at',
        'b.id as booking_id', 'b.customer_id', 'b.total_amount', 'b.total_duration',
        'u.name as customer_name', 'u.phone as customer_phone'
      );

    // Fetch booking services for each entry
    const bookingIds = entries.map((e) => e.booking_id);
    let bsMap = {};
    if (bookingIds.length) {
      const bsRows = await db('booking_services as bs')
        .join('services as s', 's.id', 'bs.service_id')
        .whereIn('bs.booking_id', bookingIds)
        .select('bs.booking_id', 's.name', 's.duration', 's.price');
      for (const r of bsRows) {
        if (!bsMap[r.booking_id]) bsMap[r.booking_id] = [];
        bsMap[r.booking_id].push({ name: r.name, duration: r.duration, price: parseFloat(r.price) });
      }
    }

    const mapped = entries.map((e) => {
      const m = mapQueueEntry(e);
      if (m.booking) m.booking.services = (bsMap[e.booking_id] || []).map((s) => ({ service: s, price: s.price }));
      return m;
    });

    res.json({
      _id: queue.id,
      queue: mapped,
      currentlyServing: queue.currently_serving,
      totalServedToday: queue.total_served_today,
      averageServiceTime: queue.average_service_time,
      estimatedWaitTime: mapped.length * queue.average_service_time,
      queueLength: mapped.length,
    });
  } catch (error) {
    console.error('Get my queue error:', error);
    res.status(500).json({ message: 'Server error fetching my queue' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   GET /:barberId  — public queue view
   ═══════════════════════════════════════════════════════════════════════ */
router.get('/:barberId', async (req, res) => {
  try {
    const { barberId } = req.params;

    let queue = await db('queues').where({ barber_id: barberId }).first();
    if (!queue) {
      [queue] = await db('queues').insert({ barber_id: barberId }).returning('*');
    }

    const entries = await db('queue_entries as qe')
      .join('bookings as b', 'b.id', 'qe.booking_id')
      .join('users as u', 'u.id', 'b.customer_id')
      .where({ 'qe.queue_id': queue.id })
      .whereIn('qe.status', ['waiting', 'notified', 'in-progress'])
      .orderBy('qe.position')
      .select(
        'qe.id as qe_id', 'qe.position', 'qe.status as qe_status',
        'qe.estimated_time', 'qe.joined_at',
        'b.id as booking_id', 'b.customer_id',
        'u.name as customer_name', 'u.phone as customer_phone'
      );

    res.json({
      queue: {
        _id: queue.id,
        entries: entries.map(mapQueueEntry),
        currentlyServing: queue.currently_serving,
        totalServedToday: queue.total_served_today,
        averageServiceTime: queue.average_service_time,
        estimatedWaitTime: entries.length * queue.average_service_time,
      },
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ message: 'Server error fetching queue' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   POST /join — Join queue (customer)
   TRANSACTION with row-level locking to prevent race conditions
   ═══════════════════════════════════════════════════════════════════════ */
router.post(
  '/join',
  auth,
  authorize('customer'),
  [
    body('barberId').isUUID().withMessage('Invalid barber ID'),
    body('services').isArray({ min: 1 }).withMessage('At least one service is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { barberId, services: rawServices, notes } = req.body;

      // Normalize: accept both [uuid] and [{serviceId: uuid}]
      const serviceIds = rawServices.map((s) => (typeof s === 'string' ? s : s.serviceId || s.service));

      const result = await db.transaction(async (trx) => {
        // 1. Check for existing active booking
        const existing = await trx('bookings')
          .where({ customer_id: req.user.userId, barber_id: barberId })
          .whereIn('status', ['pending', 'confirmed', 'in-progress'])
          .first();
        if (existing) throw { status: 400, message: 'You already have an active booking with this barber' };

        // 2. Fetch services
        const svcRows = await trx('services')
          .whereIn('id', serviceIds)
          .where({ barber_id: barberId, is_active: true });
        if (svcRows.length !== serviceIds.length) {
          throw { status: 400, message: 'Some services are not available' };
        }

        const totalAmount = svcRows.reduce((s, svc) => s + parseFloat(svc.price), 0);
        const totalDuration = svcRows.reduce((s, svc) => s + svc.duration, 0);

        // 3. Create walk-in booking
        const [booking] = await trx('bookings')
          .insert({
            customer_id: req.user.userId,
            barber_id: barberId,
            scheduled_time: new Date(),
            total_amount: totalAmount,
            total_duration: totalDuration,
            notes: notes || null,
            is_walk_in: true,
            status: 'confirmed',
          })
          .returning('*');

        // Insert booking_services
        await trx('booking_services').insert(
          svcRows.map((svc) => ({ booking_id: booking.id, service_id: svc.id, price: svc.price }))
        );

        // 4. Lock queue row + calculate position atomically
        const queue = await ensureQueue(barberId, trx);

        // Get max position under lock
        const [{ max: maxPos }] = await trx('queue_entries')
          .where({ queue_id: queue.id })
          .whereIn('status', ['waiting', 'notified', 'in-progress'])
          .max('position as max');

        const position = (maxPos || 0) + 1;
        const estimatedWaitTime = (position - 1) * queue.average_service_time;

        await trx('queue_entries').insert({
          queue_id: queue.id,
          booking_id: booking.id,
          position,
          status: 'waiting',
          estimated_time: new Date(Date.now() + estimatedWaitTime * 60000),
        });

        // Update booking with queue info
        await trx('bookings').where({ id: booking.id }).update({
          queue_position: position,
          estimated_wait_time: estimatedWaitTime,
        });

        return { booking, position, estimatedWaitTime, totalAmount, svcRows };
      });

      // Real-time notification
      req.io.to(`barber-${barberId}`).emit('queue-updated', {
        barberId,
        newCustomer: {
          bookingId: result.booking.id,
          customerName: req.userProfile.name,
          position: result.position,
        },
      });

      const queue = await db('queues').where({ barber_id: barberId }).first();
      if (queue) await notifyNearFrontCustomers(queue.id, req.io);

      res.status(201).json({
        message: 'Successfully joined queue',
        queueEntry: {
          position: result.position,
          estimatedWaitTime: result.estimatedWaitTime,
          status: 'waiting',
        },
        booking: {
          id: result.booking.id,
          _id: result.booking.id,
          position: result.position,
          estimatedWaitTime: result.estimatedWaitTime,
          totalAmount: result.totalAmount,
          isWalkIn: true,
          services: result.svcRows.map((s) => ({ name: s.name, duration: s.duration })),
        },
      });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ message: error.message });
      console.error('Join queue error:', error);
      res.status(500).json({ message: 'Server error joining queue' });
    }
  }
);

/* ═══════════════════════════════════════════════════════════════════════
   GET /position/:bookingId — Customer's position
   ═══════════════════════════════════════════════════════════════════════ */
router.get('/position/:bookingId', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await db('bookings').where({ id: bookingId }).first();
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (req.user.role === 'customer' && booking.customer_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const queue = await db('queues').where({ barber_id: booking.barber_id }).first();
    if (!queue) return res.status(404).json({ message: 'Queue not found' });

    const queueEntry = await db('queue_entries')
      .where({ queue_id: queue.id, booking_id: bookingId })
      .first();
    if (!queueEntry) return res.status(404).json({ message: 'Not in queue' });

    // Count people ahead
    const [{ count: ahead }] = await db('queue_entries')
      .where({ queue_id: queue.id, status: 'waiting' })
      .where('position', '<', queueEntry.position)
      .count('id as count');

    const currentPosition = parseInt(ahead) + 1;
    const estimatedWaitTime = (currentPosition - 1) * queue.average_service_time;

    // Get total active
    const [{ count: totalActive }] = await db('queue_entries')
      .where({ queue_id: queue.id })
      .whereIn('status', ['waiting', 'notified', 'in-progress'])
      .count('id as count');

    // Populate barber info
    const barber = await db('users')
      .where({ id: booking.barber_id })
      .select('id', 'name', 'shop_name')
      .first();

    res.json({
      booking: {
        id: booking.id,
        _id: booking.id,
        status: booking.status,
        barber: { _id: barber.id, name: barber.name, shopName: barber.shop_name },
        totalAmount: parseFloat(booking.total_amount),
      },
      queue: {
        position: currentPosition,
        originalPosition: queueEntry.position,
        status: queueEntry.status,
        estimatedWaitTime,
        joinedAt: queueEntry.joined_at,
        totalInQueue: parseInt(totalActive),
      },
    });
  } catch (error) {
    console.error('Get queue position error:', error);
    res.status(500).json({ message: 'Server error fetching queue position' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   PUT /update/:bookingId — Update queue entry status (barber)
   ═══════════════════════════════════════════════════════════════════════ */
router.put(
  '/update/:bookingId',
  auth,
  authorize('barber'),
  [body('status').isIn(['waiting', 'notified', 'in-progress', 'completed', 'no-show'])],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { bookingId } = req.params;
      const { status } = req.body;

      const result = await db.transaction(async (trx) => {
        const queue = await trx('queues')
          .where({ barber_id: req.user.userId })
          .forUpdate()
          .first();
        if (!queue) throw { status: 404, message: 'Queue not found' };

        const entry = await trx('queue_entries')
          .where({ queue_id: queue.id, booking_id: bookingId })
          .forUpdate()
          .first();
        if (!entry) throw { status: 404, message: 'Booking not found in queue' };

        const updates = { status, updated_at: new Date() };
        if (status === 'notified') updates.notified_at = new Date();
        if (status === 'in-progress') {
          updates.started_at = new Date();
          await trx('queues').where({ id: queue.id }).update({ currently_serving: bookingId });
        }
        if (status === 'completed') {
          updates.completed_at = new Date();
          await trx('queues').where({ id: queue.id }).update({
            currently_serving: null,
            total_served_today: queue.total_served_today + 1,
          });
          // Update average service time
          if (entry.started_at) {
            const mins = (Date.now() - new Date(entry.started_at).getTime()) / 60000;
            const newAvg = (queue.average_service_time + mins) / 2;
            await trx('queues').where({ id: queue.id }).update({ average_service_time: Math.round(newAvg) });
          }
        }

        await trx('queue_entries').where({ id: entry.id }).update(updates);

        // Sync booking status
        const bookingStatus =
          status === 'completed' ? 'completed' :
          status === 'no-show' ? 'no-show' :
          status === 'in-progress' ? 'in-progress' : null;

        if (bookingStatus) {
          await trx('bookings').where({ id: bookingId }).update({ status: bookingStatus, updated_at: new Date() });
        }

        return { queue, entry: { ...entry, ...updates } };
      });

      // Notifications
      const booking = await db('bookings').where({ id: bookingId }).first();
      if (booking) {
        const msg =
          status === 'notified' ? 'Your turn is approaching! Please be ready.' :
          status === 'in-progress' ? 'Your service has started.' :
          status === 'completed' ? 'Your service is complete. Thank you!' :
          `Status updated to ${status}`;

        req.io.to(`customer-${booking.customer_id}`).emit('booking-updated', {
          bookingId, status, message: msg,
        });
      }

      // Count active entries
      const [{ count }] = await db('queue_entries')
        .where({ queue_id: result.queue.id })
        .whereIn('status', ['waiting', 'notified', 'in-progress'])
        .count('id as count');

      req.io.to(`barber-${req.user.userId}`).emit('queue-updated', {
        barberId: req.user.userId,
        bookingId, status,
        queueLength: parseInt(count),
      });

      await notifyNearFrontCustomers(result.queue.id, req.io);

      res.json({ message: 'Queue status updated successfully', queueItem: result.entry });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ message: error.message });
      console.error('Update queue error:', error);
      res.status(500).json({ message: 'Server error updating queue' });
    }
  }
);

/* ═══════════════════════════════════════════════════════════════════════
   DELETE /remove/:bookingId  (barber)
   ═══════════════════════════════════════════════════════════════════════ */
router.delete('/remove/:bookingId', auth, authorize('barber'), async (req, res) => {
  try {
    const { bookingId } = req.params;

    await db.transaction(async (trx) => {
      const queue = await trx('queues')
        .where({ barber_id: req.user.userId })
        .forUpdate()
        .first();
      if (!queue) throw { status: 404, message: 'Queue not found' };

      const entry = await trx('queue_entries')
        .where({ queue_id: queue.id, booking_id: bookingId })
        .first();
      if (!entry) throw { status: 404, message: 'Booking not found in queue' };

      await trx('queue_entries').where({ id: entry.id }).del();

      // Reorder remaining entries
      const remaining = await trx('queue_entries')
        .where({ queue_id: queue.id })
        .whereIn('status', ['waiting', 'notified', 'in-progress'])
        .orderBy('position');
      for (let i = 0; i < remaining.length; i++) {
        await trx('queue_entries').where({ id: remaining[i].id }).update({ position: i + 1 });
      }

      // Cancel booking
      await trx('bookings').where({ id: bookingId }).update({ status: 'cancelled', updated_at: new Date() });
    });

    const booking = await db('bookings').where({ id: bookingId }).first();
    if (booking) {
      req.io.to(`customer-${booking.customer_id}`).emit('booking-updated', {
        bookingId, status: 'cancelled',
        message: 'Your booking has been removed from the queue.',
      });
    }

    req.io.to(`barber-${req.user.userId}`).emit('queue-updated', {
      barberId: req.user.userId,
      removedBooking: bookingId,
    });

    const queue = await db('queues').where({ barber_id: req.user.userId }).first();
    if (queue) await notifyNearFrontCustomers(queue.id, req.io);

    res.json({ message: 'Booking removed from queue successfully' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('Remove from queue error:', error);
    res.status(500).json({ message: 'Server error removing from queue' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   GET /stats/:barberId (barber)
   ═══════════════════════════════════════════════════════════════════════ */
router.get('/stats/:barberId', auth, authorize('barber'), async (req, res) => {
  try {
    const { barberId } = req.params;
    if (barberId !== req.user.userId) return res.status(403).json({ message: 'Access denied' });

    const queue = await db('queues').where({ barber_id: barberId }).first();
    if (!queue) return res.status(404).json({ message: 'Queue not found' });

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    const [{ count: todayBookings }] = await db('bookings')
      .where({ barber_id: barberId })
      .whereBetween('scheduled_time', [startOfDay, endOfDay])
      .count('id as count');

    const [{ count: completedToday }] = await db('bookings')
      .where({ barber_id: barberId, status: 'completed' })
      .whereBetween('actual_end_time', [startOfDay, endOfDay])
      .count('id as count');

    const [{ count: activeQueue }] = await db('queue_entries')
      .where({ queue_id: queue.id })
      .whereIn('status', ['waiting', 'notified', 'in-progress'])
      .count('id as count');

    res.json({
      queueLength: parseInt(activeQueue),
      totalServedToday: queue.total_served_today,
      averageServiceTime: queue.average_service_time,
      todayBookings: parseInt(todayBookings),
      completedToday: parseInt(completedToday),
      currentlyServing: queue.currently_serving,
      estimatedCompletionTime: parseInt(activeQueue) * queue.average_service_time,
    });
  } catch (error) {
    console.error('Get queue stats error:', error);
    res.status(500).json({ message: 'Server error fetching queue statistics' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   POST /:queueId/next — Call next customer (barber)
   ═══════════════════════════════════════════════════════════════════════ */
router.post('/:queueId/next', auth, authorize('barber'), async (req, res) => {
  try {
    const { queueId } = req.params;
    const barberId = req.user.userId;

    const result = await db.transaction(async (trx) => {
      const queue = await trx('queues').where({ id: queueId }).forUpdate().first();
      if (!queue || queue.barber_id !== barberId) {
        throw { status: 404, message: 'Queue not found or unauthorized' };
      }

      // Find next waiting entry
      const next = await trx('queue_entries')
        .where({ queue_id: queueId, status: 'waiting' })
        .orderBy('position')
        .forUpdate()
        .first();
      if (!next) throw { status: 400, message: 'No customers waiting in queue' };

      // If someone is currently being served, complete them
      if (queue.currently_serving) {
        const curBooking = await trx('bookings').where({ id: queue.currently_serving }).first();
        if (curBooking && curBooking.status === 'in-progress') {
          await trx('bookings').where({ id: curBooking.id }).update({ status: 'completed', actual_end_time: new Date(), updated_at: new Date() });
          await trx('queue_entries').where({ queue_id: queueId, booking_id: curBooking.id }).update({ status: 'completed', completed_at: new Date() });
        }
        await trx('queues').where({ id: queueId }).update({
          total_served_today: queue.total_served_today + 1,
        });
      }

      // Start serving next customer
      const now = new Date();
      await trx('queue_entries').where({ id: next.id }).update({
        status: 'in-progress', notified_at: now, started_at: now,
      });
      await trx('queues').where({ id: queueId }).update({ currently_serving: next.booking_id });
      await trx('bookings').where({ id: next.booking_id }).update({ status: 'in-progress', actual_start_time: now, updated_at: now });

      return { queue, next };
    });

    // Notify the called customer
    const booking = await db('bookings').where({ id: result.next.booking_id }).first();
    if (booking) {
      req.io.to(`customer-${booking.customer_id}`).emit('notification', {
        type: 'info',
        message: "🎉 It's your turn! Your service is about to begin.",
        bookingId: booking.id,
      });
    }

    await notifyNearFrontCustomers(result.queue.id, req.io);

    res.json({
      message: 'Next customer called successfully',
      current: {
        bookingId: result.next.booking_id,
        position: result.next.position,
        status: 'in-progress',
      },
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('Call next customer error:', error);
    res.status(500).json({ message: 'Server error calling next customer' });
  }
});

module.exports = router;
