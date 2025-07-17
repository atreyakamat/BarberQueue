const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  services: [{
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  scheduledTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  totalDuration: {
    type: Number, // in minutes
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'card'],
    default: 'cash'
  },
  notes: {
    type: String,
    trim: true
  },
  queuePosition: {
    type: Number,
    default: 0
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true
  },
  isWalkIn: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ barber: 1, scheduledTime: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ scheduledTime: 1 });

// Pre-save middleware to calculate totals
bookingSchema.pre('save', function(next) {
  if (this.isModified('services')) {
    this.totalAmount = this.services.reduce((sum, item) => sum + item.price, 0);
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
