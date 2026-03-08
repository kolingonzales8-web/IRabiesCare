const express    = require('express');
const router     = express.Router();
const User       = require('../models/user.model');
const { protect } = require('../middlewares/auth.middleware');

// GET profile (existing)
router.get('/profile', protect, (req, res) => {
  res.json({ user: req.user });
});

// GET all users
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create user
router.post('/', protect, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update user
router.put('/:id', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update(req.body);
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE user
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;