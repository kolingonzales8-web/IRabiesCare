const crypto      = require('crypto');
const User        = require('../models/user.model');
const jwt         = require('jsonwebtoken');
const logActivity = require('../utils/logActivity');
const sendEmail   = require('../utils/sendEmail');
const { pushToUsers, getConnectedAdminIds } = require('./notifications.controller');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'Email already in use' });

    const user = await User.create({ name, email, password });

    const Notification = require('../models/notification.model');
    await Notification.create({
      type: 'user',
      message: `New user registered: ${name}`,
      createdBy: name,
    });
    const io = req.app.get('io');
    if (io) io.emit('new_notification', { type: 'user', message: `New user registered: ${name}`, createdBy: name });
        

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    try {
      const adminIds = getConnectedAdminIds();
      pushToUsers(adminIds, { type: 'new_record', module: 'users', message: 'New user registered' });
    } catch (e) { console.error('[SSE] push error:', e.message); }

    

    const token = generateToken(user._id);

    await logActivity({
      action: 'CREATE', module: 'User',
      description: `New user registered: ${name} (${email})`,
      user: { id: user._id, name: user.name, role: user.role },
      targetId: user._id, targetName: user.name, req,
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isOnline: user.isOnline, lastSeen: user.lastSeen },
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

    const user = await User.findOne({ email });
    console.log('User found:', user?.email, '| role:', user?.role);

    if (!user) return res.status(401).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) return res.status(401).json({ message: 'Wrong password' });

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    await logActivity({
      action: 'LOGIN', module: 'Auth',
      description: `${user.name} logged in`,
      user: { id: user._id, name: user.name, role: user.role },
      targetId: user._id, targetName: user.name, req,
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isOnline: user.isOnline, lastSeen: user.lastSeen },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, {
        isOnline: false,
        lastSeen: new Date(),
      });

      await logActivity({
        action: 'LOGOUT', module: 'Auth',
        description: `${req.user.name} logged out`,
        user: { id: req.user._id, name: req.user.name, role: req.user.role },
        targetId: req.user._id, targetName: req.user.name, req,
      });
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot Password — sends OTP via email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with that email.' });

    // Generate 6-digit OTP
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOTP = resetOtp;
    user.resetPasswordOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    await sendEmail({
      to: email,
      subject: 'iRabiesCare - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
          <h2 style="color: #1565C0;">Password Reset Request</h2>
          <p>Hi ${user.name},</p>
          <p>Use the OTP below to reset your password. It expires in <strong>15 minutes</strong>.</p>
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 12px; color: #166534; font-weight: bold;">YOUR OTP CODE</p>
            <p style="font-size: 36px; font-weight: bold; color: #15803d; letter-spacing: 8px; margin: 8px 0;">${resetOtp}</p>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    await logActivity({
      action: 'PASSWORD_RESET', module: 'Auth',
      description: `Password reset OTP sent to ${user.name} (${email})`,
      user: { id: user._id, name: user.name, role: user.role },
      targetId: user._id, targetName: user.name, req,
    });

    res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reset Password — verifies OTP then sets new password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: 'Email, OTP and new password are required.' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with that email.' });

    // Check OTP match
    if (user.resetPasswordOTP !== otp)
      return res.status(401).json({ message: 'Invalid OTP.' });

    // Check OTP expiry
    if (!user.resetPasswordOtpExpires || user.resetPasswordOtpExpires < new Date())
      return res.status(401).json({ message: 'OTP has expired. Please request a new one.' });

    // Set new password and clear OTP fields
    user.password = newPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordOtpExpires = null;
    await user.save();

    await logActivity({
      action: 'PASSWORD_RESET', module: 'Auth',
      description: `Password reset completed for ${user.name} (${email})`,
      user: { id: user._id, name: user.name, role: user.role },
      targetId: user._id, targetName: user.name, req,
    });

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect.' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};