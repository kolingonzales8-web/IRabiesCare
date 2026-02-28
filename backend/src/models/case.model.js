const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    unique: true,
  },

  // Owner of the case
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Patient Details
  fullName:  { type: String, required: [true, 'Patient name is required'], trim: true },
  age:       { type: Number, required: [true, 'Age is required'] },
  sex:       { type: String, required: [true, 'Sex is required'], enum: ['Male', 'Female'] },
  address:   { type: String, required: [true, 'Address is required'] },
  contact:   { type: String, required: [true, 'Contact number is required'] },
  email:     { type: String, trim: true, default: null },

  // Exposure Info
  exposureType: {
    type: String,
    required: [true, 'Exposure type is required'],
    enum: ['Bite', 'Scratch', 'Lick on Broken Skin'],
  },
  bodyPartAffected: {
    type: String,
    enum: ['Hand', 'Leg', 'Arm', 'Face', 'Others'],
    default: null,
  },

  // Incident Logging
  dateOfExposure: { type: Date, required: [true, 'Date of exposure is required'] },
  timeOfExposure: { type: String, required: [true, 'Time of exposure is required'] },
  location:       { type: String, required: [true, 'Location is required'] },

  // Animal Info
  animalInvolved: { type: String, required: [true, 'Animal is required'], enum: ['Dog', 'Cat', 'Others'] },
  animalStatus:   { type: String, required: [true, 'Animal status is required'], enum: ['Stray', 'Owned', 'Unknown'] },
  animalVaccinated: {
    type: String,
    enum: ['Yes', 'No', 'Unknown'],
    default: 'Unknown',
  },

  // Wound Info
  woundBleeding: {
    type: String,
    enum: ['Yes', 'No', 'Unknown'],
    default: null,
  },
  woundWashed: {
    type: String,
    enum: ['Yes', 'No', 'Unknown'],
    default: null,
  },
  numberOfWounds: {
    type: Number,
    default: null,
  },

  // Document
  documentUrl: { type: String, default: null },

  // Status
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Ongoing', 'Completed', 'Urgent'],
  },
}, { timestamps: true });

// Auto-generate Case ID before saving
caseSchema.pre('save', async function () {
  if (!this.caseId) {
    const count = await mongoose.model('Case').countDocuments();
    this.caseId = String(count + 1).padStart(4, '0');
  }
});

module.exports = mongoose.model('Case', caseSchema);