const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role:     { type: String, default: 'user' },

  // ── Online presence ──────────────────────
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date,    default: null  },

  // ── Push notifications ───────────────────
  pushToken: { type: String, default: null },
  // ─────────────────────────────────────────
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret.__v;
    },
  },
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method for walk-in account creation
userSchema.statics.createWalkInAccount = async function ({ email, password, fullName, role = 'user' }) {
  if (!email || !password || !fullName)
    throw new Error('Email, password, and full name are required');
  if (password.length < 6)
    throw new Error('Password must be at least 6 characters');

  const existing = await this.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new Error('Email already has an account');

  return await this.create({ name: fullName, email, password, role });
};

module.exports = mongoose.model('User', userSchema);