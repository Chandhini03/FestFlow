const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const { authMiddleware } = require('../middleware/auth');

// POST /api/orders  (Customer places an order)
router.post('/', async (req, res) => {
  try {
    const { vendorSlug, items, customerWhatsApp } = req.body;

    // Find vendor by slug
    const vendor = await Vendor.findOne({ slug: vendorSlug });
    if (!vendor) return res.status(404).json({ error: 'Stall not found.' });
    if (!vendor.isLive) return res.status(400).json({ error: 'This stall is currently offline.' });

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = new Order({
      vendorId: vendor._id,
      items,
      total,
      customerWhatsApp,
      eventCode: vendor.currentEventCode,
    });
    await order.save();

    res.status(201).json({
      message: 'Order placed successfully! 🎉',
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/active  (Vendor fetches their active orders for POS — short polling target)
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      vendorId: req.user.id,
      status: { $in: ['placed', 'approved'] },
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/history  (Vendor fetches their completed order ledger)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      vendorId: req.user.id,
    }).sort({ createdAt: -1 });

    const totalRevenue = orders
      .filter((o) => o.status === 'completed' || o.status === 'ready')
      .reduce((sum, o) => sum + o.total, 0);

    res.json({ totalRevenue, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/status  (Vendor updates order status on the Kanban)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'ready', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use: approved, ready, or completed.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Ensure vendor owns this order
    if (order.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own orders.' });
    }

    order.status = status;
    await order.save();

    // TODO: Trigger WhatsApp notifications here (Block 2.5)
    // if (status === 'approved') sendWhatsApp(order.customerWhatsApp, 'Your order has been confirmed! ✅');
    // if (status === 'ready') sendWhatsApp(order.customerWhatsApp, 'Your order is ready for pickup! 🎉');

    res.json({
      message: `Order status updated to "${status}".`,
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
