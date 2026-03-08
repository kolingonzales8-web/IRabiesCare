const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ changed: findByPk instead of findById, exclude password via attributes
    req.user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};