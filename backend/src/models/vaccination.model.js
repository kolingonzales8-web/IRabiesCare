const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Patient = require('./patient.model');
const User = require('./user.model');

const Vaccination = sequelize.define('Vaccination', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  patientId: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: Patient, key: 'id' }
  },
  createdBy: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: User, key: 'id' }
  },

  // A. Vaccine Details
  vaccineBrand:  { type: DataTypes.STRING, allowNull: false },
  injectionSite: { type: DataTypes.ENUM('Left Arm', 'Right Arm'), allowNull: false },

  // B. WHO PEP Dose Schedule — flattened from nested object
  // Administered dates
  day0:  { type: DataTypes.DATE, defaultValue: null },
  day3:  { type: DataTypes.DATE, defaultValue: null },
  day7:  { type: DataTypes.DATE, defaultValue: null },
  day14: { type: DataTypes.DATE, defaultValue: null },
  day28: { type: DataTypes.DATE, defaultValue: null },

  // Scheduled dates
  day0Scheduled:  { type: DataTypes.DATE, defaultValue: null },
  day3Scheduled:  { type: DataTypes.DATE, defaultValue: null },
  day7Scheduled:  { type: DataTypes.DATE, defaultValue: null },
  day14Scheduled: { type: DataTypes.DATE, defaultValue: null },
  day28Scheduled: { type: DataTypes.DATE, defaultValue: null },

  // Missed flags
  day0Missed:  { type: DataTypes.BOOLEAN, defaultValue: false },
  day3Missed:  { type: DataTypes.BOOLEAN, defaultValue: false },
  day7Missed:  { type: DataTypes.BOOLEAN, defaultValue: false },
  day14Missed: { type: DataTypes.BOOLEAN, defaultValue: false },
  day28Missed: { type: DataTypes.BOOLEAN, defaultValue: false },

  // C. RIG Administration
  rigGiven:            { type: DataTypes.BOOLEAN, defaultValue: false },
  rigType:             { type: DataTypes.ENUM('HRIG', 'ERIG'), defaultValue: null },
  rigDateAdministered: { type: DataTypes.DATE,    defaultValue: null },
  rigDosage:           { type: DataTypes.FLOAT,   defaultValue: null },

  // D. Vaccine Inventory
  manufacturer:     { type: DataTypes.STRING, defaultValue: null },
  vaccineStockUsed: { type: DataTypes.FLOAT,  defaultValue: null },

  // Status
  status: { 
    type: DataTypes.ENUM('Ongoing', 'Completed'), 
    defaultValue: 'Ongoing' 
  },

}, { timestamps: true });

Vaccination.belongsTo(Patient, { foreignKey: 'patientId', as: 'linkedPatient' });
Vaccination.belongsTo(User,    { foreignKey: 'createdBy', as: 'creator' });

module.exports = Vaccination;