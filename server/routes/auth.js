const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ─── Helper: map a DB row to the camelCase shape the frontend expects ───
function mapUser(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    role: row.role,
    shopName: row.shop_name,
    shopAddress: row.shop_address,
    workingHours: { start: row.working_hours_start, end: row.working_hours_end },
    isAvailable: row.is_available,
    avatar: row.avatar,
    rating: parseFloat(row.rating) || 0,
    totalRatings: row.total_ratings,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Register ────────────────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('phone').trim().isLength({ min: 10, max: 15 }).withMessage('Valid phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['customer', 'barber']).withMessage('Role must be customer or barber'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, phone, email, password, role, shopName, shopAddress, workingHours } = req.body;

      // Check duplicate phone
      const existing = await db('users').where({ phone }).first();
      if (existing) {
        return res.status(400).json({ message: 'Phone number already registered' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const insertData = {
        name,
        phone,
        email: email || null,
        password: hashedPassword,
        role,
        shop_name: role === 'barber' ? shopName : null,
        shop_address: role === 'barber' ? shopAddress : null,
        working_hours_start: workingHours?.start || '09:00',
        working_hours_end: workingHours?.end || '21:00',
      };

      const [user] = await db('users').insert(insertData).returning('*');

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: mapUser(user),
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// ─── Login ───────────────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { phone, password } = req.body;

      const user = await db('users').where({ phone }).first();
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      if (!user.is_active) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({ message: 'Login successful', token, user: mapUser(user) });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// ─── Get Profile ─────────────────────────────────────────────────────────
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.userId }).first();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: mapUser(user) });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// ─── Update Profile ──────────────────────────────────────────────────────
router.put(
  '/profile',
  auth,
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('email').optional().trim().isEmail(),
    body('shopName').optional().trim(),
    body('shopAddress').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, shopName, shopAddress, workingHours, avatar } = req.body;
      const updates = { updated_at: new Date() };

      if (name) updates.name = name;
      if (email) updates.email = email;
      if (shopName !== undefined) updates.shop_name = shopName;
      if (shopAddress !== undefined) updates.shop_address = shopAddress;
      if (workingHours?.start) updates.working_hours_start = workingHours.start;
      if (workingHours?.end) updates.working_hours_end = workingHours.end;
      if (avatar !== undefined) updates.avatar = avatar;

      const [updated] = await db('users')
        .where({ id: req.user.userId })
        .update(updates)
        .returning('*');

      res.json({ message: 'Profile updated successfully', user: mapUser(updated) });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server error updating profile' });
    }
  }
);

// ─── Toggle Availability (barber) ────────────────────────────────────────
router.put('/availability', auth, async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.userId }).first();
    if (!user || user.role !== 'barber') {
      return res.status(403).json({ message: 'Only barbers can toggle availability' });
    }

    const newVal = !user.is_available;
    await db('users').where({ id: user.id }).update({ is_available: newVal, updated_at: new Date() });

    res.json({ message: `You are now ${newVal ? 'available' : 'unavailable'}`, isAvailable: newVal });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({ message: 'Server error toggling availability' });
  }
});

// ─── POST /toggle-availability (alias) ──────────────────────────────────
router.post('/toggle-availability', auth, async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.userId }).first();
    if (!user || user.role !== 'barber') {
      return res.status(403).json({ message: 'Only barbers can toggle availability' });
    }

    const newVal = !user.is_available;
    await db('users').where({ id: user.id }).update({ is_available: newVal, updated_at: new Date() });

    res.json({ message: `You are now ${newVal ? 'available' : 'unavailable'}`, isAvailable: newVal });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({ message: 'Server error toggling availability' });
  }
});

module.exports = router;
