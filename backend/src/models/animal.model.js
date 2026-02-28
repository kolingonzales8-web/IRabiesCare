const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema({
  // Link to Case
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: [true, 'Linked case is required'],
    unique: true, // one animal record per case
  },

  // A. Animal Profile
  animalSpecies: {
    type: String,
    required: [true, 'Animal species is required'],
    enum: ['Dog', 'Cat', 'Others'],
  },
  animalOwnership: {
    type: String,
    required: [true, 'Animal ownership is required'],
    enum: ['Owned', 'Stray', 'Unknown'],
  },
  animalVaccinated: {
    type: Boolean,
    default: false,
  },
  ownerName: {
    type: String,
    trim: true,
    default: null,
  },
  ownerContact: {
    type: String,
    trim: true,
    default: null,
  },

  // B. Observation Period
  observationStartDate: {
    type: Date,
    default: null,
  },
  observationEndDate: {
    type: Date,
    default: null,
  },
  observationStatus: {
    type: String,
    default: 'Under Observation',
    enum: ['Under Observation', 'Completed Observation', 'Lost to Follow-up'],
  },

  // C. Outcome Logging
  animalOutcome: {
    type: String,
    default: 'Alive',
    enum: ['Alive', 'Died', 'Tested Positive', 'Tested Negative'],
  },
  dateOfOutcome: {
    type: Date,
    default: null,
  },
  remarks: {
    type: String,
    trim: true,
    default: null,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Animal', animalSchema);