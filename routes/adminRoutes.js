const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Application = require('../models/Application');
const Vendor = require('../models/Vendor');
const Order = require('../models/Order');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username: username.toLowerCase() });
    if (!admin) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        managedEventCodes: admin.managedEventCodes,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/applications/:eventCode  (Fetch pending applications for an event)
router.get('/applications/:eventCode', authMiddleware, adminOnly, async (req, res) => {
  try {
    const applications = await Application.find({
      eventCode: req.params.eventCode.toUpperCase(),
    }).populate('vendorId', '-password');

    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/approve/:appId  (Approve or reject an application)
router.put('/approve/:appId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected".' });
    }

    const application = await Application.findById(req.params.appId);
    if (!application) return res.status(404).json({ error: 'Application not found.' });

    application.status = status;
    await application.save();

    // If approved, also update the vendor's platform-level approval status
    if (status === 'approved') {
      await Vendor.findByIdAndUpdate(application.vendorId, {
        approvalStatus: 'approved',
      });
    }

    res.json({
      message: `Application ${status}.`,
      application,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/orders/:eventCode  (Organizer view — all orders for an event)
router.get('/orders/:eventCode', authMiddleware, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({
      eventCode: req.params.eventCode.toUpperCase(),
    })
      .populate('vendorId', 'stallName slug upiId')
      .sort({ createdAt: -1 });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    res.json({
      eventCode: req.params.eventCode.toUpperCase(),
      totalOrders: orders.length,
      totalRevenue,
      orders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/me  (fetch current admin profile)
router.get('/me', authMiddleware, adminOnly, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
