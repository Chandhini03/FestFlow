const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Inline auth middleware to save a file slot
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
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  next();
};

app.locals.authMiddleware = authMiddleware; // To potentially share or just pass down

// Route imports
const vendorRoutes = require('./routes/vendorRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Mount routes
app.use('/api/vendors', vendorRoutes);
app.use('/api/orders', orderRoutes);

// --- INLINE ADMIN & APPLICATION ROUTES TO MAINTAIN 18-FILE STRICT ARCHITECTURE ---
const Application = require('./models/Application');
const Vendor = require('./models/Vendor');
const Order = require('./models/Order');

// POST /api/applications  (Vendor applies to an event)
app.post('/api/applications', authMiddleware, async (req, res) => {
  try {
    const { eventCode } = req.body;
    if (!eventCode) return res.status(400).json({ error: 'Event code is required.' });

    const existing = await Application.findOne({ vendorId: req.user.id, eventCode: eventCode.toUpperCase() });
    if (existing) return res.status(400).json({ error: 'You have already applied for this event.' });

    const application = new Application({ vendorId: req.user.id, eventCode: eventCode.toUpperCase() });
    await application.save();

    res.status(201).json({ message: `Application submitted!`, application });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/applications/my  (Vendor views their own applications)
app.get('/api/applications/my', authMiddleware, async (req, res) => {
  try {
    const applications = await Application.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    const superAdminPassword = process.env.ADMIN_PASSWORD || 'superadmin123';
    if (password !== superAdminPassword) return res.status(401).json({ error: 'Invalid admin credentials.' });

    const token = jwt.sign({ id: 'superadmin', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, admin: { id: 'superadmin', username: 'Super Admin', managedEventCodes: ['ALL'] } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/applications/:eventCode
app.get('/api/admin/applications/:eventCode', authMiddleware, adminOnly, async (req, res) => {
  try {
    const applications = await Application.find({ eventCode: req.params.eventCode.toUpperCase() }).populate('vendorId', '-password');
    res.json(applications);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/approve/:appId
app.put('/api/admin/approve/:appId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const application = await Application.findById(req.params.appId);
    if (!application) return res.status(404).json({ error: 'Application not found.' });
    application.status = status;
    await application.save();
    if (status === 'approved') await Vendor.findByIdAndUpdate(application.vendorId, { approvalStatus: 'approved' });
    res.json({ message: `Application ${status}.`, application });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/orders/:eventCode
app.get('/api/admin/orders/:eventCode', authMiddleware, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({ eventCode: req.params.eventCode.toUpperCase() }).populate('vendorId', 'name slug upiId').sort({ createdAt: -1 });
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    res.json({ eventCode: req.params.eventCode.toUpperCase(), totalOrders: orders.length, totalRevenue, orders });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/me
app.get('/api/admin/me', authMiddleware, adminOnly, async (req, res) => {
  try { res.json({ id: 'superadmin', username: 'Super Admin' }); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Health check
app.get('/', (req, res) => { res.json({ message: 'Stally API is running 🚀' }); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🟢 Server running on port ${PORT}`));
