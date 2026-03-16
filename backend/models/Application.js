const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    eventCode: {
      type: String,
      required: [true, 'Event code is required'],
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// A vendor can only apply once per event code
applicationSchema.index({ vendorId: 1, eventCode: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
