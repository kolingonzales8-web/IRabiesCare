const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user.model');

const Case = sequelize.define('Case', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  caseId: { 
    type: DataTypes.STRING, 
    unique: true 
  },
  createdBy: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: User, key: 'id' }
  },

  // Links walk-in patient's user account to their case
  patientUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: { model: User, key: 'id' }
  },

  // ✅ Assigned health staff
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: { model: User, key: 'id' }
  },

  // Patient Details
  fullName:  { type: DataTypes.STRING,  allowNull: false },
  age:       { type: DataTypes.INTEGER, allowNull: false },
  sex:       { type: DataTypes.ENUM('Male', 'Female'), allowNull: false },
  address:   { type: DataTypes.STRING,  allowNull: false },
  contact:   { type: DataTypes.STRING,  allowNull: false },
  email:     { type: DataTypes.STRING,  defaultValue: null },

  // Exposure Info
  exposureType: { 
    type: DataTypes.ENUM('Bite', 'Scratch', 'Lick on Broken Skin'), 
    allowNull: false 
  },
  bodyPartAffected: { 
    type: DataTypes.ENUM('Hand', 'Leg', 'Arm', 'Face', 'Others'), 
    defaultValue: null 
  },

  // Incident Logging
  dateOfExposure: { type: DataTypes.DATE,   allowNull: false },
  timeOfExposure: { type: DataTypes.STRING, allowNull: false },
  location:       { type: DataTypes.STRING, allowNull: false },

  // Animal Info
  animalInvolved:   { type: DataTypes.ENUM('Dog', 'Cat', 'Others'),        allowNull: false },
  animalStatus:     { type: DataTypes.ENUM('Stray', 'Owned', 'Unknown'),   allowNull: false },
  animalVaccinated: { type: DataTypes.ENUM('Yes', 'No', 'Unknown'),        defaultValue: 'Unknown' },

  // Wound Info
  woundBleeding:  { type: DataTypes.ENUM('Yes', 'No', 'Unknown'), defaultValue: null },
  woundWashed:    { type: DataTypes.ENUM('Yes', 'No', 'Unknown'), defaultValue: null },
  numberOfWounds: { type: DataTypes.INTEGER, defaultValue: null },

  // Document
  documentUrl: { type: DataTypes.STRING, defaultValue: null },

  // Status
  status: { 
    type: DataTypes.ENUM('Pending', 'Ongoing', 'Completed', 'Urgent'), 
    defaultValue: 'Pending' 
  },
}, { timestamps: true });

// Auto-generate Case ID before creating
Case.beforeCreate(async (caseRecord) => {
  const count = await Case.count();
  caseRecord.caseId = String(count + 1).padStart(4, '0');
});

Case.belongsTo(User, { foreignKey: 'createdBy',     as: 'creator' });
Case.belongsTo(User, { foreignKey: 'patientUserId', as: 'patientUser' });
Case.belongsTo(User, { foreignKey: 'assignedTo',    as: 'assignedStaff' }); // ✅

module.exports = Case;