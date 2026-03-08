const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  email: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true,
    set(value) { this.setDataValue('email', value.toLowerCase().trim()); }
  },
  password: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: { len: [6, 255] }
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user',
    allowNull: false
  }
}, { timestamps: true });

// Hash password before saving
User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 12);
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 12);
  }
});

// Compare password method
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to create account for walk-in case (with validation)
User.createWalkInAccount = async (accountData) => {
  const { email, password, fullName, role = 'patient' } = accountData;

  // Validate input
  if (!email || !password || !fullName) {
    throw new Error('Email, password, and full name are required');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Check if email already exists
  const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    throw new Error('Email already has an account');
  }

  // Create new user (beforeCreate hook will hash password)
  const newUser = await User.create({
    name: fullName,
    email: email,
    password: password,
    role: role,
  });

  return newUser;
};

module.exports = User;