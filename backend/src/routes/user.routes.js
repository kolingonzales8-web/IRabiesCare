const express     = require('express');
const router      = express.Router();
const User        = require('../models/user.model');
const { protect } = require('../middlewares/auth.middleware');

// GET profile
router.get('/profile', protect, (req, res) => {
  res.json({ user: req.user });
});

// PATCH save push token (called by mobile app after login)
router.patch('/push-token', protect, async (req, res) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) return res.status(400).json({ message: 'pushToken is required.' });

    await User.findByIdAndUpdate(req.user.id, { pushToken });
    res.json({ message: 'Push token saved.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all users
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create user
router.post('/', protect, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update user
router.put('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, role, password, isActive, deactivationRemark } = req.body;

    if (name     !== undefined) user.name     = name;
    if (email    !== undefined) user.email    = email;
    if (isActive !== undefined) user.isActive = isActive;
    if (role !== undefined && user.role !== 'user') user.role = role;
    if (password) user.password = password;
    if (deactivationremark !== undefined) user.deactivationremark = deactivationremark;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, deactivationRemark: user.deactivationRemark },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE user
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;