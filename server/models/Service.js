const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 5
  },
  category: {
    type: String,
    enum: ['haircut', 'beard', 'massage', 'color', 'cleanup', 'wash', 'styling'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  popularity: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
serviceSchema.index({ barberId: 1, isActive: 1 });
serviceSchema.index({ category: 1 });

module.exports = mongoose.model('Service', serviceSchema);
