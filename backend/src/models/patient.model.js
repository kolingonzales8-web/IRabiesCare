const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Case = require('./case.model');

const Patient = sequelize.define('Patient', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  caseId: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: Case, key: 'id' }
  },
  fullName: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  woundCategory: { 
    type: DataTypes.ENUM('Category I', 'Category II', 'Category III'), 
    defaultValue: 'Category I' 
  },
  patientStatus: { 
    type: DataTypes.ENUM('Pending', 'Ongoing', 'Completed'), 
    defaultValue: 'Pending' 
  },
  // doses array stored as JSON (MySQL supports JSON type)
  doses: { 
    type: DataTypes.JSON, 
    defaultValue: [] 
  },
  nextSchedule: { 
    type: DataTypes.DATE, 
    defaultValue: null 
  },
  caseOutcome: { 
    type: DataTypes.ENUM('Ongoing', 'Recovered', 'Deceased', 'Lost to Follow-up'), 
    defaultValue: 'Ongoing' 
  },
}, { timestamps: true });

Patient.belongsTo(Case, { foreignKey: 'caseId', as: 'linkedCase' });

module.exports = Patient;