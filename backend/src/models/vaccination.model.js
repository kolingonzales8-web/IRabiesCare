const mongoose = require('mongoose');

const vaccinationSchema = new mongoose.Schema({
  // Link to Patient
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Linked patient is required'],
  },

  // A. Vaccine Details
  vaccineBrand: {
    type: String,
    required: [true, 'Vaccine brand is required'],
    trim: true,
  },
  injectionSite: {
    type: String,
    required: [true, 'Injection site is required'],
    enum: ['Left Arm', 'Right Arm'],
  },

  // B. WHO PEP Dose Schedule
  // Each day has:
  //   - actual administered date (day0, day3, ...)
  //   - planned/scheduled date  (day0Scheduled, day3Scheduled, ...)
  schedule: {
    // Administered dates (actual)
    day0:  { type: Date, default: null },
    day3:  { type: Date, default: null },
    day7:  { type: Date, default: null },
    day14: { type: Date, default: null },
    day28: { type: Date, default: null },

    // Scheduled/planned dates
    day0Scheduled:  { type: Date, default: null },
    day3Scheduled:  { type: Date, default: null },
    day7Scheduled:  { type: Date, default: null },
    day14Scheduled: { type: Date, default: null },
    day28Scheduled: { type: Date, default: null },


    day0Missed:  { type: Boolean, default: false },
    day3Missed:  { type: Boolean, default: false },
    day7Missed:  { type: Boolean, default: false },
    day14Missed: { type: Boolean, default: false },
    day28Missed: { type: Boolean, default: false },
    },



  // C. RIG Administration
  rigGiven: {
    type: Boolean,
    default: false,
  },
  rigType: {
    type: String,
    enum: ['HRIG', 'ERIG', null],
    default: null,
  },
  rigDateAdministered: {
    type: Date,
    default: null,
  },
  rigDosage: {
    type: Number,
    default: null,
  },

  // D. Vaccine Inventory
  manufacturer: {
    type: String,
    trim: true,
    default: null,
  },
  vaccineStockUsed: {
    type: Number,
    default: null,
  },

  // Status
  status: {
    type: String,
    default: 'Ongoing',
    enum: ['Ongoing', 'Completed'],
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Vaccination', vaccinationSchema);