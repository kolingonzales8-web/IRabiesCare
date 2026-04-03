const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type:      { type: String }, // 'case', 'patient', 'animal', 'vaccination', 'user'
  message:   { type: String },
  createdBy: { type: String },
  isRead:    { type: Boolean, default: false },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // ← ADD
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);