const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper: map user row → public barber shape
function mapBarber(row) {
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    shopName: row.shop_name,
    shopAddress: row.shop_address,
    rating: row.rating ? parseFloat(row.rating) : 0,
    totalRatings: row.total_ratings,
    workingHours: { start: row.working_hours_start, end: row.working_hours_end },
    avatar: row.avatar,
    isAvailable: row.is_available,
  };
}

/* ── GET /barbers ───────────────────────────────────────────────── */
router.get('/barbers', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'rating' } = req.query;
    let query = db('users')
      .where({ role: 'barber', is_active: true, is_available: true });

    if (search) {
      query = query.where(function () {
        this.whereILike('name', `%${search}%`)
          .orWhereILike('shop_name', `%${search}%`)
          .orWhereILike('shop_address', `%${search}%`);
      });
    }

    const sortMap = {
      rating: [{ column: 'rating', order: 'desc' }],
      name: [{ column: 'name', order: 'asc' }],
      newest: [{ column: 'created_at', order: 'desc' }],
    };

    const lim = parseInt(limit);
    const offset = (parseInt(page) - 1) * lim;

    const rows = await query
      .clone()
      .select('id', 'name', 'shop_name', 'shop_address', 'rating', 'total_ratings',
        'working_hours_start', 'working_hours_end', 'avatar', 'is_available')
      .orderBy(sortMap[sortBy] || sortMap.rating)
      .limit(lim)
      .offset(offset);

    // Total count (same filters, no limit/offset)
    let countQ = db('users').where({ role: 'barber', is_active: true, is_available: true });
    if (search) {
      countQ = countQ.where(function () {
        this.whereILike('name', `%${search}%`)
          .orWhereILike('shop_name', `%${search}%`)
          .orWhereILike('shop_address', `%${search}%`);
      });
    }
    const [{ count: total }] = await countQ.count('id as count');

    res.json({
      barbers: rows.map(mapBarber),
      totalPages: Math.ceil(parseInt(total) / lim),
      currentPage: parseInt(page),
      total: parseInt(total),
    });
  } catch (error) {
    console.error('Get barbers error:', error);
    res.status(500).json({ message: 'Server error fetching barbers' });
  }
});

/* ── GET /barber/:id ────────────────────────────────────────────── */
router.get('/barber/:id', async (req, res) => {
  try {
    const barber = await db('users')
      .where({ id: req.params.id, role: 'barber', is_active: true })
      .select('id', 'name', 'shop_name', 'shop_address', 'rating', 'total_ratings',
        'working_hours_start', 'working_hours_end', 'avatar', 'is_available')
      .first();

    if (!barber) return res.status(404).json({ message: 'Barber not found' });

    // Services
    const services = await db('services')
      .where({ barber_id: req.params.id, is_active: true })
      .orderBy([{ column: 'category' }, { column: 'name' }]);

    // Recent reviews
    const reviews = await db('bookings')
      .join('users as u', 'u.id', 'bookings.customer_id')
      .where({ 'bookings.barber_id': req.params.id, 'bookings.status': 'completed' })
      .whereNotNull('bookings.rating')
      .select('bookings.rating', 'bookings.review', 'bookings.created_at', 'u.name as customer_name')
      .orderBy('bookings.created_at', 'desc')
      .limit(5);

    res.json({
      barber: mapBarber(barber),
      services: services.map((s) => ({
        _id: s.id, id: s.id,
        name: s.name, description: s.description,
        price: parseFloat(s.price), duration: s.duration,
        category: s.category, isActive: s.is_active,
        image: s.image, popularity: s.popularity,
      })),
      reviews: reviews.map((r) => ({
        rating: r.rating,
        review: r.review,
        createdAt: r.created_at,
        customer: { name: r.customer_name },
      })),
    });
  } catch (error) {
    console.error('Get barber details error:', error);
    res.status(500).json({ message: 'Server error fetching barber details' });
  }
});

/* ── GET /barber/:id/slots ──────────────────────────────────────── */
router.get('/barber/:id/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const barber = await db('users')
      .where({ id: req.params.id, role: 'barber', is_active: true, is_available: true })
      .first();
    if (!barber) return res.status(404).json({ message: 'Barber not found or unavailable' });

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) return res.status(400).json({ message: 'Cannot book for past dates' });

    const startOfDay = new Date(selectedDate);
    const endOfDay = new Date(selectedDate);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const existingBookings = await db('bookings')
      .where({ barber_id: req.params.id })
      .whereIn('status', ['pending', 'confirmed', 'in-progress'])
      .whereBetween('scheduled_time', [startOfDay, endOfDay])
      .select('scheduled_time', 'total_duration');

    const wStart = barber.working_hours_start || '09:00';
    const wEnd = barber.working_hours_end || '21:00';
    const slots = generateTimeSlots(wStart, wEnd, 30);

    const availableSlots = slots.filter((slot) => {
      const slotTime = new Date(selectedDate);
      const [h, m] = slot.split(':');
      slotTime.setHours(parseInt(h), parseInt(m), 0, 0);
      if (slotTime <= new Date()) return false;

      return !existingBookings.some((b) => {
        const bStart = new Date(b.scheduled_time);
        const bEnd = new Date(bStart.getTime() + b.total_duration * 60000);
        return slotTime >= bStart && slotTime < bEnd;
      });
    });

    res.json({
      date: selectedDate.toISOString().split('T')[0],
      workingHours: { start: wStart, end: wEnd },
      availableSlots,
      totalSlots: slots.length,
      bookedSlots: slots.length - availableSlots.length,
    });
  } catch (error) {
    console.error('Get barber slots error:', error);
    res.status(500).json({ message: 'Server error fetching availability slots' });
  }
});

function generateTimeSlots(startTime, endTime, intervalMinutes) {
  const slots = [];
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  const startMin = sH * 60 + sM;
  const endMin = eH * 60 + eM;
  for (let m = startMin; m < endMin; m += intervalMinutes) {
    const h = Math.floor(m / 60);
    const mi = m % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${mi.toString().padStart(2, '0')}`);
  }
  return slots;
}

/* ── GET /search ────────────────────────────────────────────────── */
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 10 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const lim = parseInt(limit);
    const offset = (parseInt(page) - 1) * lim;
    const results = { barbers: [], services: [] };

    if (type === 'all' || type === 'barbers') {
      const barbers = await db('users')
        .where({ role: 'barber', is_active: true })
        .where(function () {
          this.whereILike('name', `%${q}%`)
            .orWhereILike('shop_name', `%${q}%`)
            .orWhereILike('shop_address', `%${q}%`);
        })
        .select('id', 'name', 'shop_name', 'shop_address', 'rating', 'total_ratings', 'avatar')
        .limit(lim)
        .offset(offset);

      results.barbers = barbers.map(mapBarber);
    }

    if (type === 'all' || type === 'services') {
      const services = await db('services')
        .where({ 'services.is_active': true })
        .where(function () {
          this.whereILike('services.name', `%${q}%`)
            .orWhereILike('services.description', `%${q}%`)
            .orWhereILike('services.category', `%${q}%`);
        })
        .join('users as u', 'u.id', 'services.barber_id')
        .select(
          'services.*',
          'u.name as barber_name', 'u.shop_name', 'u.rating as barber_rating'
        )
        .limit(lim)
        .offset(offset);

      results.services = services.map((r) => ({
        _id: r.id, id: r.id,
        name: r.name, description: r.description,
        price: parseFloat(r.price), duration: r.duration,
        category: r.category, popularity: r.popularity,
        barberId: {
          _id: r.barber_id, name: r.barber_name,
          shopName: r.shop_name, rating: r.barber_rating ? parseFloat(r.barber_rating) : 0,
        },
      }));
    }

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

/* ── GET /dashboard ─────────────────────────────────────────────── */
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    if (userRole === 'customer') {
      const upcomingBookings = await db('bookings')
        .where({ customer_id: userId })
        .whereIn('status', ['pending', 'confirmed', 'in-progress'])
        .where('scheduled_time', '>=', new Date())
        .orderBy('scheduled_time')
        .limit(5);

      // Populate barber info
      const barberIds = [...new Set(upcomingBookings.map((b) => b.barber_id))];
      const barbers = barberIds.length
        ? await db('users').whereIn('id', barberIds).select('id', 'name', 'shop_name')
        : [];
      const bmap = {};
      for (const b of barbers) bmap[b.id] = { _id: b.id, name: b.name, shopName: b.shop_name };

      const recentBookings = await db('bookings')
        .where({ customer_id: userId })
        .whereIn('status', ['completed', 'cancelled'])
        .orderBy('created_at', 'desc')
        .limit(5);

      const recentBarberIds = [...new Set(recentBookings.map((b) => b.barber_id))];
      const recentBarbers = recentBarberIds.length
        ? await db('users').whereIn('id', recentBarberIds).select('id', 'name', 'shop_name')
        : [];
      for (const b of recentBarbers) bmap[b.id] = { _id: b.id, name: b.name, shopName: b.shop_name };

      // Fetch services for all bookings
      const allIds = [...upcomingBookings, ...recentBookings].map((b) => b.id);
      let svcMap = {};
      if (allIds.length) {
        const bs = await db('booking_services as bs')
          .join('services as s', 's.id', 'bs.service_id')
          .whereIn('bs.booking_id', allIds)
          .select('bs.booking_id', 's.name');
        for (const r of bs) {
          if (!svcMap[r.booking_id]) svcMap[r.booking_id] = [];
          svcMap[r.booking_id].push({ service: { name: r.name } });
        }
      }

      const mapB = (b) => ({
        _id: b.id, id: b.id,
        barber: bmap[b.barber_id] || b.barber_id,
        services: svcMap[b.id] || [],
        scheduledTime: b.scheduled_time,
        status: b.status,
        totalAmount: parseFloat(b.total_amount),
        createdAt: b.created_at,
      });

      const [{ count: totalBookings }] = await db('bookings').where({ customer_id: userId }).count('id as count');
      const [{ count: completedBookings }] = await db('bookings').where({ customer_id: userId, status: 'completed' }).count('id as count');
      const [{ count: cancelledBookings }] = await db('bookings').where({ customer_id: userId, status: 'cancelled' }).count('id as count');

      res.json({
        upcomingBookings: upcomingBookings.map(mapB),
        recentBookings: recentBookings.map(mapB),
        stats: {
          totalBookings: parseInt(totalBookings),
          completedBookings: parseInt(completedBookings),
          cancelledBookings: parseInt(cancelledBookings),
        },
      });
    } else if (userRole === 'barber') {
      const todayBookings = await db('bookings')
        .where({ barber_id: userId })
        .whereBetween('scheduled_time', [startOfDay, endOfDay])
        .orderBy('scheduled_time');

      const custIds = [...new Set(todayBookings.map((b) => b.customer_id))];
      const custs = custIds.length
        ? await db('users').whereIn('id', custIds).select('id', 'name', 'phone')
        : [];
      const cmap = {};
      for (const c of custs) cmap[c.id] = { _id: c.id, name: c.name, phone: c.phone };

      const upcomingBookings = await db('bookings')
        .where({ barber_id: userId })
        .where('scheduled_time', '>=', endOfDay)
        .whereIn('status', ['pending', 'confirmed'])
        .orderBy('scheduled_time')
        .limit(10);

      const upCustIds = [...new Set(upcomingBookings.map((b) => b.customer_id))];
      const upCusts = upCustIds.length
        ? await db('users').whereIn('id', upCustIds).select('id', 'name', 'phone')
        : [];
      for (const c of upCusts) cmap[c.id] = { _id: c.id, name: c.name, phone: c.phone };

      // Services
      const allIds = [...todayBookings, ...upcomingBookings].map((b) => b.id);
      let svcMap = {};
      if (allIds.length) {
        const bs = await db('booking_services as bs')
          .join('services as s', 's.id', 'bs.service_id')
          .whereIn('bs.booking_id', allIds)
          .select('bs.booking_id', 's.name', 's.duration');
        for (const r of bs) {
          if (!svcMap[r.booking_id]) svcMap[r.booking_id] = [];
          svcMap[r.booking_id].push({ service: { name: r.name, duration: r.duration } });
        }
      }

      const queue = await db('queues').where({ barber_id: userId }).first();
      let currentQueue = 0;
      if (queue) {
        const [{ count }] = await db('queue_entries')
          .where({ queue_id: queue.id })
          .whereIn('status', ['waiting', 'notified', 'in-progress'])
          .count('id as count');
        currentQueue = parseInt(count);
      }

      const mapB = (b) => ({
        _id: b.id, id: b.id,
        customer: cmap[b.customer_id] || b.customer_id,
        services: svcMap[b.id] || [],
        scheduledTime: b.scheduled_time,
        status: b.status,
        totalAmount: parseFloat(b.total_amount),
        totalDuration: b.total_duration,
      });

      res.json({
        todayBookings: todayBookings.map(mapB),
        upcomingBookings: upcomingBookings.map(mapB),
        queue: {
          currentLength: currentQueue,
          totalServedToday: queue ? queue.total_served_today : 0,
          averageServiceTime: queue ? queue.average_service_time : 30,
        },
        stats: {
          todayBookings: todayBookings.length,
          completedToday: todayBookings.filter((b) => b.status === 'completed').length,
          totalRevenue: todayBookings
            .filter((b) => b.status === 'completed')
            .reduce((s, b) => s + parseFloat(b.total_amount), 0),
        },
      });
    } else {
      // Admin dashboard
      const [{ count: totalUsers }] = await db('users').count('id as count');
      const [{ count: totalBarbers }] = await db('users').where({ role: 'barber' }).count('id as count');
      const [{ count: totalCustomers }] = await db('users').where({ role: 'customer' }).count('id as count');
      const [{ count: totalBookings }] = await db('bookings').count('id as count');
      const [{ count: todayCount }] = await db('bookings')
        .whereBetween('created_at', [startOfDay, endOfDay])
        .count('id as count');

      const recentBookings = await db('bookings')
        .join('users as c', 'c.id', 'bookings.customer_id')
        .join('users as b', 'b.id', 'bookings.barber_id')
        .select(
          'bookings.*',
          'c.name as customer_name', 'c.phone as customer_phone',
          'b.name as barber_name', 'b.shop_name'
        )
        .orderBy('bookings.created_at', 'desc')
        .limit(10);

      res.json({
        stats: {
          totalUsers: parseInt(totalUsers),
          totalBarbers: parseInt(totalBarbers),
          totalCustomers: parseInt(totalCustomers),
          totalBookings: parseInt(totalBookings),
          todayBookings: parseInt(todayCount),
        },
        recentBookings: recentBookings.map((r) => ({
          _id: r.id,
          customer: { name: r.customer_name, phone: r.customer_phone },
          barber: { name: r.barber_name, shopName: r.shop_name },
          status: r.status,
          totalAmount: parseFloat(r.total_amount),
          createdAt: r.created_at,
        })),
      });
    }
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

module.exports = router;
