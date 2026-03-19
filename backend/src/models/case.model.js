const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseId:        { type: String, unique: true },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedTo:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Patient Details
  fullName: { type: String, required: true },
  age:      { type: Number, required: true },
  sex:      { type: String, enum: ['Male', 'Female'], required: true },
  address:  { type: String, required: true },
  contact:  { type: String, required: true },
  email:    { type: String, default: null },

  // Exposure Info
  exposureType:     { type: String, enum: ['Bite', 'Scratch', 'Lick on Broken Skin'], required: true },
  bodyPartAffected: { type: String, enum: ['Hand', 'Leg', 'Arm', 'Face', 'Others'], default: null },

  // Incident Logging
  dateOfExposure: { type: Date,   required: true },
  timeOfExposure: { type: String, required: true },
  location:       { type: String, required: true },

  // Animal Info
  animalInvolved:   { type: String, enum: ['Dog', 'Cat', 'Others'],       required: true },
  animalStatus:     { type: String, enum: ['Stray', 'Owned', 'Unknown'],  required: true },
  animalVaccinated: { type: String, enum: ['Yes', 'No', 'Unknown'],       default: 'Unknown' },

  // Wound Info
  woundBleeding:  { type: String, enum: ['Yes', 'No', 'Unknown'], default: null },
  woundWashed:    { type: String, enum: ['Yes', 'No', 'Unknown'], default: null },
  numberOfWounds: { type: Number, default: null },

  // Document
  documentUrl: { type: String, default: null },

  // Status
  status: { type: String, enum: ['Pending', 'Ongoing', 'Completed', 'Urgent'], default: 'Pending' },
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

// Auto-generate caseId before saving
caseSchema.pre('save', async function () {
  if (!this.isNew) return;
  const last = await mongoose.model('Case').findOne({}, {}, { sort: { createdAt: -1 } });
  const lastNum = last?.caseId ? parseInt(last.caseId) : 0;
  this.caseId = String(lastNum + 1).padStart(4, '0');
});

module.exports = mongoose.model('Case', caseSchema);