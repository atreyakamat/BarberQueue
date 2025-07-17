const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  queue: [{
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    position: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['waiting', 'notified', 'in-progress', 'completed', 'no-show'],
      default: 'waiting'
    },
    estimatedTime: {
      type: Date
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    notifiedAt: {
      type: Date
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    }
  }],
  currentlyServing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  averageServiceTime: {
    type: Number, // in minutes
    default: 30
  },
  totalServedToday: {
    type: Number,
    default: 0
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Method to add booking to queue
queueSchema.methods.addToQueue = function(bookingId) {
  const newPosition = this.queue.length + 1;
  this.queue.push({
    booking: bookingId,
    position: newPosition,
    status: 'waiting'
  });
  this.updateEstimatedTimes();
  return newPosition;
};

// Method to remove booking from queue
queueSchema.methods.removeFromQueue = function(bookingId) {
  this.queue = this.queue.filter(item => 
    item.booking.toString() !== bookingId.toString()
  );
  this.reorderQueue();
  this.updateEstimatedTimes();
};

// Method to reorder queue positions
queueSchema.methods.reorderQueue = function() {
  this.queue.forEach((item, index) => {
    item.position = index + 1;
  });
};

// Method to update estimated times
queueSchema.methods.updateEstimatedTimes = function() {
  let cumulativeTime = 0;
  const now = new Date();
  
  this.queue.forEach((item, index) => {
    if (item.status === 'waiting') {
      cumulativeTime += this.averageServiceTime;
      item.estimatedTime = new Date(now.getTime() + cumulativeTime * 60000);
    }
  });
};

// Method to get next customer
queueSchema.methods.getNextCustomer = function() {
  const waiting = this.queue.filter(item => item.status === 'waiting');
  return waiting.length > 0 ? waiting[0] : null;
};

// Method to reset daily stats
queueSchema.methods.resetDailyStats = function() {
  const today = new Date();
  const lastReset = new Date(this.lastResetDate);
  
  if (today.toDateString() !== lastReset.toDateString()) {
    this.totalServedToday = 0;
    this.lastResetDate = today;
  }
};

module.exports = mongoose.model('Queue', queueSchema);
