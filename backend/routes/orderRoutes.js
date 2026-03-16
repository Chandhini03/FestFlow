const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const { sendWhatsApp } = require('../utils/whatsapp');
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// POST /api/orders  (Customer places an order)
router.post('/', async (req, res) => {
  try {
    const { vendorSlug, items, customerPhone } = req.body;

    // Find vendor by slug
    const vendor = await Vendor.findOne({ slug: vendorSlug });
    if (!vendor) return res.status(404).json({ error: 'Stall not found.' });
    if (!vendor.isLive) return res.status(400).json({ error: 'This stall is currently offline.' });

    // 1. Validate Stock
    for (const orderItem of items) {
      const inventoryItem = vendor.inventory.find(i => i.name === orderItem.name);
      if (!inventoryItem) {
        return res.status(400).json({ error: `Item "${orderItem.name}" no longer exists in menu.` });
      }
      if (inventoryItem.stock < orderItem.quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${orderItem.name}". Only ${inventoryItem.stock} left.` });
      }
    }

    // 2. Deduct Stock
    for (const orderItem of items) {
      const inventoryItem = vendor.inventory.find(i => i.name === orderItem.name);
      inventoryItem.stock -= orderItem.quantity;
    }

    // Mark inventory as modified so Mongoose saves the subdocument changes
    vendor.markModified('inventory');
    await vendor.save();

    // Calculate totalAmount
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = new Order({
      vendorId: vendor._id,
      items,
      totalAmount,
      customerPhone,
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
      status: { $in: ['Awaiting Verification', 'Preparing'] },
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
      .filter((o) => o.status === 'Completed' || o.status === 'Ready')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({ totalRevenue, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/status  (Vendor updates order status on the Kanban)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Awaiting Verification', 'Preparing', 'Ready', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use: Awaiting Verification, Preparing, Ready, or Completed.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Ensure vendor owns this order
    if (order.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own orders.' });
    }

    order.status = status;
    await order.save();

    // Trigger WhatsApp notifications
    if (status === 'Preparing') {
      sendWhatsApp(order.customerPhone, 'Your order has been confirmed and is being prepared! ✅');
    }
    if (status === 'Ready') {
      sendWhatsApp(order.customerPhone, 'Your order is ready for pickup! 🎉 Visit the stall to collect it.');
    }

    res.json({
      message: `Order status updated to "${status}".`,
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id  (Customer fetches live status)
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
