const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const { authMiddleware } = require('../middleware/auth');

// POST /api/applications  (Vendor applies to an event)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { eventCode } = req.body;
    if (!eventCode) return res.status(400).json({ error: 'Event code is required.' });

    // Check for duplicate application
    const existing = await Application.findOne({
      vendorId: req.user.id,
      eventCode: eventCode.toUpperCase(),
    });
    if (existing) {
      return res.status(400).json({ error: 'You have already applied for this event.' });
    }

    const application = new Application({
      vendorId: req.user.id,
      eventCode: eventCode.toUpperCase(),
    });
    await application.save();

    res.status(201).json({
      message: `Application for ${eventCode.toUpperCase()} submitted! Waiting for admin approval.`,
      application,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/applications/my  (Vendor views their own applications)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const applications = await Application.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
