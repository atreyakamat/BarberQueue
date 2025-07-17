const express = require('express');
const { body, validationResult } = require('express-validator');
const Service = require('../models/Service');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all services for a barber
router.get('/barber/:barberId', async (req, res) => {
  try {
    const { barberId } = req.params;
    const services = await Service.find({ 
      barberId, 
      isActive: true 
    }).sort({ category: 1, name: 1 });

    res.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error fetching services' });
  }
});

// Get all services (with pagination)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const services = await Service.find(query)
      .populate('barberId', 'name shopName shopAddress rating')
      .sort({ popularity: -1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Service.countDocuments(query);

    res.json({
      services,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({ message: 'Server error fetching services' });
  }
});

// Get service categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Service.distinct('category');
    const categoryInfo = [
      { value: 'haircut', label: 'Haircut', icon: '✂️' },
      { value: 'beard', label: 'Beard & Shave', icon: '🧔' },
      { value: 'massage', label: 'Head Massage', icon: '💆' },
      { value: 'color', label: 'Hair Color', icon: '🎨' },
      { value: 'cleanup', label: 'Face Cleanup', icon: '🧴' },
      { value: 'wash', label: 'Hair Wash', icon: '🚿' },
      { value: 'styling', label: 'Styling', icon: '💇' }
    ];

    const availableCategories = categoryInfo.filter(cat => 
      categories.includes(cat.value)
    );

    res.json({ categories: availableCategories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

// Create new service (barber only)
router.post('/', auth, authorize('barber'), [
  body('name').trim().isLength({ min: 2 }).withMessage('Service name must be at least 2 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('price').isNumeric().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration').isInt({ min: 5 }).withMessage('Duration must be at least 5 minutes'),
  body('category').isIn(['haircut', 'beard', 'massage', 'color', 'cleanup', 'wash', 'styling']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, duration, category, image } = req.body;

    // Check if service already exists for this barber
    const existingService = await Service.findOne({
      barberId: req.user.userId,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingService) {
      return res.status(400).json({ message: 'Service with this name already exists' });
    }

    const service = new Service({
      name,
      description,
      price,
      duration,
      category,
      image,
      barberId: req.user.userId
    });

    await service.save();

    res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error creating service' });
  }
});

// Update service (barber only)
router.put('/:id', auth, authorize('barber'), [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Service name must be at least 2 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('price').optional().isNumeric().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration').optional().isInt({ min: 5 }).withMessage('Duration must be at least 5 minutes'),
  body('category').optional().isIn(['haircut', 'beard', 'massage', 'color', 'cleanup', 'wash', 'styling']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const service = await Service.findOne({ _id: id, barberId: req.user.userId });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Update fields
    const { name, description, price, duration, category, image, isActive } = req.body;
    
    if (name) service.name = name;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = price;
    if (duration !== undefined) service.duration = duration;
    if (category) service.category = category;
    if (image !== undefined) service.image = image;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    res.json({
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Server error updating service' });
  }
});

// Delete service (barber only)
router.delete('/:id', auth, authorize('barber'), async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findOne({ _id: id, barberId: req.user.userId });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Soft delete - mark as inactive
    service.isActive = false;
    await service.save();

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error deleting service' });
  }
});

// Get popular services
router.get('/popular', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true })
      .populate('barberId', 'name shopName rating')
      .sort({ popularity: -1 })
      .limit(10);

    res.json({ services });
  } catch (error) {
    console.error('Get popular services error:', error);
    res.status(500).json({ message: 'Server error fetching popular services' });
  }
});

module.exports = router;
