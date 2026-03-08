const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { sequelize } = require('../config/db');
const User = require('../models/user.model');

const seedAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected');

    // Sync the User table if it doesn't exist yet
    await sequelize.sync({ alter: true });

    // Delete existing admin to start fresh
    await User.destroy({ where: { email: 'admin@gmail.com' } });
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