const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const User = require('../models/user.model');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Delete existing admin to start fresh
    await User.deleteOne({ email: 'admin@gmail.com' });
    console.log('Cleared existing admin');

    // Create fresh admin
    await User.create({
      name: 'Admin',
      email: 'admin@gmail.com',
      password: 'admin123456',
    });

    console.log('✅ Admin created successfully!');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin123456');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();