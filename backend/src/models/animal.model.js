const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema({
  caseId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Animal Profile
  animalSpecies:    { type: String, enum: ['Dog', 'Cat', 'Others'], required: true },
  animalOwnership:  { type: String, enum: ['Owned', 'Stray', 'Unknown'], required: true },
  animalVaccinated: { type: Boolean, default: false },
  ownerName:        { type: String,  default: null },
  ownerContact:     { type: String,  default: null },

  // Observation Period
  observationStartDate: { type: Date,   default: null },
  observationEndDate:   { type: Date,   default: null },
  observationStatus: {
    type: String,
    enum: ['Under Observation', 'Completed Observation', 'Lost to Follow-up'],
    default: 'Under Observation',
  },

  // Outcome
  animalOutcome: {
    type: String,
    enum: ['Alive', 'Died', 'Tested Positive', 'Tested Negative'],
    default: 'Alive',
  },
  dateOfOutcome: { type: Date,   default: null },
  remarks:       { type: String, default: null },
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

module.exports = mongoose.model('Animal', animalSchema);