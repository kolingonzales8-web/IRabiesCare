const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: [true, 'Linked case is required'],
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
  },
  woundCategory: {
    type: String,
    enum: ['Category I', 'Category II', 'Category III'],
    default: 'Category I',
  },
  patientStatus: {
    type: String,
    enum: ['Pending', 'Ongoing', 'Completed'],
    default: 'Pending',
  },
  doses: {
    type: [Date],
    default: [],
  },
  nextSchedule: {
    type: Date,
    default: null,
  },
  caseOutcome: {
    type: String,
    enum: ['Ongoing', 'Recovered', 'Deceased', 'Lost to Follow-up'],
    default: 'Ongoing',
  },
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);