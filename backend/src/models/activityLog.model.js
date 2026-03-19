const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action:      { type: String, required: true },
  module:      { type: String, required: true },
  description: { type: String, required: true },

  performedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  performedByName: { type: String, default: 'System' },
  performedByRole: { type: String, default: 'system' },

  targetId:   { type: mongoose.Schema.Types.ObjectId, default: null },
  targetName: { type: String, default: null },
  ipAddress:  { type: String, default: null },
}, {
  timestamps: true,
  updatedAt: false,
  toJSON: {
    virtuals: true,
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret.__v;
    },
  },
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);