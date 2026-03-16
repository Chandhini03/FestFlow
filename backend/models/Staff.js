const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    role: {
      type: String,
      enum: ['cashier'],
      default: 'cashier',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);
