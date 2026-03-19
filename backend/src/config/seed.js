const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// ✅ Verify it's loaded
console.log('MONGODB_URI:', process.env.MONGODB_URI);

const mongoose = require('mongoose');
const User = require('../models/user.model');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    await User.deleteOne({ email: 'admin@gmail.com' });
    console.log('Cleared existing admin');

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@gmail.com',
      password: 'admin123456',
      role: 'admin',
    });

    console.log('✅ Admin created successfully!');
    console.log('ID:', admin._id);
    console.log('Email:', admin.email);
    console.log('Password: admin123456');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();