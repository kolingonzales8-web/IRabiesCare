const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Case = require('./case.model');
const User = require('./user.model');

const Animal = sequelize.define('Animal', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  caseId: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    unique: true, // one animal per case
    references: { model: Case, key: 'id' }
  },
  createdBy: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: User, key: 'id' }
  },

  // A. Animal Profile
  animalSpecies: { 
    type: DataTypes.ENUM('Dog', 'Cat', 'Others'), 
    allowNull: false 
  },
  animalOwnership: { 
    type: DataTypes.ENUM('Owned', 'Stray', 'Unknown'), 
    allowNull: false 
  },
  animalVaccinated: { type: DataTypes.BOOLEAN, defaultValue: false },
  ownerName:        { type: DataTypes.STRING,  defaultValue: null },
  ownerContact:     { type: DataTypes.STRING,  defaultValue: null },

  // B. Observation Period
  observationStartDate: { type: DataTypes.DATE, defaultValue: null },
  observationEndDate:   { type: DataTypes.DATE, defaultValue: null },
  observationStatus: { 
    type: DataTypes.ENUM('Under Observation', 'Completed Observation', 'Lost to Follow-up'), 
    defaultValue: 'Under Observation' 
  },

  // C. Outcome Logging
  animalOutcome: { 
    type: DataTypes.ENUM('Alive', 'Died', 'Tested Positive', 'Tested Negative'), 
    defaultValue: 'Alive' 
  },
  dateOfOutcome: { type: DataTypes.DATE,   defaultValue: null },
  remarks:       { type: DataTypes.STRING, defaultValue: null },

}, { timestamps: true });

Animal.belongsTo(Case, { foreignKey: 'caseId', as: 'linkedCase' });
Animal.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = Animal;