const mongoose = require('mongoose');

const vaccinationSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },

  // Vaccine Details
  vaccineBrand:  { type: String, required: true },
  injectionSite: { type: String, enum: ['Left Arm', 'Right Arm'], required: true },

  // WHO PEP Dose Schedule — administered dates
  day0:  { type: Date, default: null },
  day3:  { type: Date, default: null },
  day7:  { type: Date, default: null },
  day14: { type: Date, default: null },
  day28: { type: Date, default: null },

  // Scheduled dates
  day0Scheduled:  { type: Date, default: null },
  day3Scheduled:  { type: Date, default: null },
  day7Scheduled:  { type: Date, default: null },
  day14Scheduled: { type: Date, default: null },
  day28Scheduled: { type: Date, default: null },

  // Missed flags
  day0Missed:  { type: Boolean, default: false },
  day3Missed:  { type: Boolean, default: false },
  day7Missed:  { type: Boolean, default: false },
  day14Missed: { type: Boolean, default: false },
  day28Missed: { type: Boolean, default: false },

  // RIG Administration
  rigGiven:            { type: Boolean, default: false },
  rigType:             { type: String,  enum: ['HRIG', 'ERIG'], default: null },
  rigDateAdministered: { type: Date,    default: null },
  rigDosage:           { type: Number,  default: null },

  // Vaccine Inventory
  manufacturer:     { type: String, default: null },
  vaccineStockUsed: { type: Number, default: null },

  // Status
  status: { type: String, enum: ['Ongoing', 'Completed'], default: 'Ongoing' },
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

module.exports = mongoose.model('Vaccination', vaccinationSchema);