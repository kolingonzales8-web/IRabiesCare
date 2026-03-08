const User = require('../models/user.model');
const jwt  = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user  = await User.create({ name, email, password });
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role, // ✅ include role
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', email);

    const user = await User.findOne({ where: { email } });
    console.log('User found:', user?.email, '| role:', user?.role);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Wrong password' });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role, // ✅ include role
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};