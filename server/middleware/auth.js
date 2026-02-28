const jwt = require('jsonwebtoken');
const db = require('../db');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user in PostgreSQL (exclude password)
    const user = await db('users')
      .select(
        'id', 'name', 'phone', 'email', 'role',
        'shop_name', 'shop_address',
        'working_hours_start', 'working_hours_end',
        'is_available', 'avatar', 'rating', 'total_ratings',
        'is_active', 'created_at', 'updated_at'
      )
      .where({ id: decoded.userId })
      .first();

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Map snake_case → camelCase for downstream compat
    req.user = decoded; // { userId, role }
    req.userProfile = {
      id: user.id,
      _id: user.id, // compat alias
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      shopName: user.shop_name,
      shopAddress: user.shop_address,
      workingHours: {
        start: user.working_hours_start,
        end: user.working_hours_end,
      },
      isAvailable: user.is_available,
      avatar: user.avatar,
      rating: parseFloat(user.rating) || 0,
      totalRatings: user.total_ratings,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.',
      });
    }
    next();
  };
};

module.exports = { auth, authorize };
