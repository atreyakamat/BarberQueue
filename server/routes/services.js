const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Map a service row to the frontend-expected shape
function mapService(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    duration: row.duration,
    category: row.category,
    isActive: row.is_active,
    barberId: row.barber_obj || row.barber_id,
    image: row.image,
    popularity: row.popularity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* ── GET /barber/:barberId ─ Services for a barber ──────────────── */
router.get('/barber/:barberId', async (req, res) => {
  try {
    const rows = await db('services')
      .where({ barber_id: req.params.barberId, is_active: true })
      .orderBy([{ column: 'category' }, { column: 'name' }]);

    res.json({ services: rows.map(mapService) });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error fetching services' });
  }
});

/* ── GET / ─ All services (with pagination) ─────────────────────── */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    let query = db('services').where({ 'services.is_active': true });

    if (category) query = query.where({ category });
    if (search) query = query.whereILike('services.name', `%${search}%`);

    const lim = parseInt(limit);
    const offset = (parseInt(page) - 1) * lim;

    const rows = await query
      .clone()
      .join('users as u', 'u.id', 'services.barber_id')
      .select(
        'services.*',
        'u.name as barber_name',
        'u.shop_name',
        'u.shop_address',
        'u.rating as barber_rating'
      )
      .orderBy([{ column: 'services.popularity', order: 'desc' }, { column: 'services.name' }])
      .limit(lim)
      .offset(offset);

    // Build total count from a fresh query with same filters
    let countQ = db('services').where({ 'services.is_active': true });
    if (category) countQ = countQ.where({ category });
    if (search) countQ = countQ.whereILike('name', `%${search}%`);
    const [{ count: total }] = await countQ.count('id as count');

    const services = rows.map((r) => {
      const s = mapService(r);
      s.barberId = {
        _id: r.barber_id,
        name: r.barber_name,
        shopName: r.shop_name,
        shopAddress: r.shop_address,
        rating: r.barber_rating ? parseFloat(r.barber_rating) : 0,
      };
      return s;
    });

    res.json({
      services,
      totalPages: Math.ceil(parseInt(total) / lim),
      currentPage: parseInt(page),
      total: parseInt(total),
    });
  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({ message: 'Server error fetching services' });
  }
});

/* ── GET /categories ────────────────────────────────────────────── */
router.get('/categories', async (req, res) => {
  try {
    const categories = await db('services')
      .where({ is_active: true })
      .distinct('category')
      .pluck('category');

    const categoryInfo = [
      { value: 'haircut', label: 'Haircut', icon: '✂️' },
      { value: 'beard', label: 'Beard & Shave', icon: '🧔' },
      { value: 'massage', label: 'Head Massage', icon: '💆' },
      { value: 'color', label: 'Hair Color', icon: '🎨' },
      { value: 'cleanup', label: 'Face Cleanup', icon: '🧴' },
      { value: 'wash', label: 'Hair Wash', icon: '🚿' },
      { value: 'styling', label: 'Styling', icon: '💇' },
    ];

    res.json({
      categories: categoryInfo.filter((c) => categories.includes(c.value)),
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

/* ── POST / ─ Create service (barber) ───────────────────────────── */
router.post(
  '/',
  auth,
  authorize('barber'),
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Service name must be at least 2 characters'),
    body('description').optional().trim().isLength({ max: 500 }),
    body('price').isNumeric().isFloat({ min: 0 }),
    body('duration').isInt({ min: 5 }),
    body('category').isIn(['haircut', 'beard', 'massage', 'color', 'cleanup', 'wash', 'styling']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { name, description, price, duration, category, image } = req.body;

      // Check duplicate for this barber (case-insensitive)
      const existing = await db('services')
        .where({ barber_id: req.user.userId })
        .whereRaw('LOWER(name) = ?', [name.toLowerCase()])
        .first();

      if (existing) {
        return res.status(400).json({ message: 'Service with this name already exists' });
      }

      const [service] = await db('services')
        .insert({
          name,
          description: description || null,
          price,
          duration,
          category,
          image: image || null,
          barber_id: req.user.userId,
        })
        .returning('*');

      res.status(201).json({ message: 'Service created successfully', service: mapService(service) });
    } catch (error) {
      console.error('Create service error:', error);
      res.status(500).json({ message: 'Server error creating service' });
    }
  }
);

/* ── PUT /:id ─ Update service (barber) ─────────────────────────── */
router.put(
  '/:id',
  auth,
  authorize('barber'),
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('price').optional().isNumeric().isFloat({ min: 0 }),
    body('duration').optional().isInt({ min: 5 }),
    body('category').optional().isIn(['haircut', 'beard', 'massage', 'color', 'cleanup', 'wash', 'styling']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const service = await db('services')
        .where({ id: req.params.id, barber_id: req.user.userId })
        .first();

      if (!service) return res.status(404).json({ message: 'Service not found' });

      const { name, description, price, duration, category, image, isActive } = req.body;
      const updates = { updated_at: new Date() };

      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (price !== undefined) updates.price = price;
      if (duration !== undefined) updates.duration = duration;
      if (category) updates.category = category;
      if (image !== undefined) updates.image = image;
      if (isActive !== undefined) updates.is_active = isActive;

      const [updated] = await db('services')
        .where({ id: req.params.id })
        .update(updates)
        .returning('*');

      res.json({ message: 'Service updated successfully', service: mapService(updated) });
    } catch (error) {
      console.error('Update service error:', error);
      res.status(500).json({ message: 'Server error updating service' });
    }
  }
);

/* ── DELETE /:id ─ Soft-delete (barber) ─────────────────────────── */
router.delete('/:id', auth, authorize('barber'), async (req, res) => {
  try {
    const service = await db('services')
      .where({ id: req.params.id, barber_id: req.user.userId })
      .first();

    if (!service) return res.status(404).json({ message: 'Service not found' });

    await db('services')
      .where({ id: req.params.id })
      .update({ is_active: false, updated_at: new Date() });

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error deleting service' });
  }
});

/* ── GET /popular ───────────────────────────────────────────────── */
router.get('/popular', async (req, res) => {
  try {
    const rows = await db('services')
      .where({ is_active: true })
      .join('users as u', 'u.id', 'services.barber_id')
      .select(
        'services.*',
        'u.name as barber_name',
        'u.shop_name',
        'u.rating as barber_rating'
      )
      .orderBy('services.popularity', 'desc')
      .limit(10);

    const services = rows.map((r) => {
      const s = mapService(r);
      s.barberId = {
        _id: r.barber_id,
        name: r.barber_name,
        shopName: r.shop_name,
        rating: r.barber_rating ? parseFloat(r.barber_rating) : 0,
      };
      return s;
    });

    res.json({ services });
  } catch (error) {
    console.error('Get popular services error:', error);
    res.status(500).json({ message: 'Server error fetching popular services' });
  }
});

module.exports = router;
