const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  caseId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  fullName: { type: String, required: true },

  woundCategory: { type: String, enum: ['Category I', 'Category II', 'Category III'], default: 'Category I' },
  patientStatus: { type: String, enum: ['Pending', 'Ongoing', 'Completed'],           default: 'Pending' },
  caseOutcome:   { type: String, enum: ['Ongoing', 'Recovered', 'Deceased', 'Lost to Follow-up'], default: 'Ongoing' },

  doses:        { type: Array,  default: [] },
  nextSchedule: { type: Date,   default: null },
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

module.exports = mongoose.model('Patient', patientSchema);