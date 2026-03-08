const { Op } = require('sequelize');
const Patient = require('../models/patient.model');
const Case    = require('../models/case.model');

// Get all patients — scoped by role
exports.getAllPatients = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status && status !== 'All') where.patientStatus = status;
    if (req.query.caseRef) where.caseId = req.query.caseRef;
    if (search) where.fullName = { [Op.like]: `%${search}%` };

    // ✅ Staff only sees patients from cases assigned to them
    const caseWhere = req.user.role === 'admin'
      ? {}
      : { assignedTo: req.user.id };

    const total    = await Patient.count({
      where,
      include: [{ model: Case, as: 'linkedCase', where: caseWhere, required: true }],
    });

    const patients = await Patient.findAll({
      where,
      include: [{
        model: Case,
        as: 'linkedCase',
        attributes: ['id', 'caseId', 'fullName', 'contact'],
        where: caseWhere,
        required: true,
      }],
      order:  [['createdAt', 'DESC']],
      limit:  Number(limit),
      offset: (page - 1) * limit,
    });

    const mapped = patients.map(p => ({
      id:            p.id,
      caseId:        p.linkedCase?.caseId,
      fullName:      p.fullName,
      contact:       p.linkedCase?.contact,
      woundCategory: p.woundCategory,
      patientStatus: p.patientStatus,
      doses:         p.doses,
      nextSchedule:  p.nextSchedule,
      caseOutcome:   p.caseOutcome,
      createdAt:     p.createdAt,
    }));

    res.status(200).json({
      patients: mapped,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single patient
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id, {
      include: [{ model: Case, as: 'linkedCase' }],
    });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create patient
exports.createPatient = async (req, res) => {
  try {
    const { caseId, woundCategory, patientStatus, doses, nextSchedule, caseOutcome } = req.body;

    const linkedCase = await Case.findByPk(caseId);
    if (!linkedCase) return res.status(404).json({ message: 'Linked case not found' });

    const patient = await Patient.create({
      caseId,
      fullName:      linkedCase.fullName,
      woundCategory,
      patientStatus,
      doses:         doses || [],
      nextSchedule:  nextSchedule || null,
      caseOutcome,
    });

    res.status(201).json({ message: 'Patient record created', patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update patient
exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    await patient.update(req.body);
    res.status(200).json({ message: 'Patient updated', patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete patient
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    await patient.destroy();
    res.status(200).json({ message: 'Patient deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stats — scoped by role
exports.getPatientStats = async (req, res) => {
  try {
    // ✅ Staff only sees stats for their assigned cases
    const caseWhere = req.user.role === 'admin'
      ? {}
      : { assignedTo: req.user.id };

    const includeCase = [{
      model: Case,
      as: 'linkedCase',
      where: caseWhere,
      required: true,
      attributes: [],
    }];

    const [total, ongoing, completed, pending] = await Promise.all([
      Patient.count({ include: includeCase }),
      Patient.count({ where: { patientStatus: 'Ongoing'   }, include: includeCase }),
      Patient.count({ where: { patientStatus: 'Completed' }, include: includeCase }),
      Patient.count({ where: { patientStatus: 'Pending'   }, include: includeCase }),
    ]);

    res.status(200).json({ total, ongoing, completed, pending });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mobile: Get patient records for logged-in user's cases
exports.getMyPatients = async (req, res) => {
  try {
    const userCases = await Case.findAll({
      where:      { patientUserId: req.user.id },
      attributes: ['id'],
    });
    const caseIds = userCases.map(c => c.id);

    const patients = await Patient.findAll({
      where: { caseId: { [Op.in]: caseIds } },
      include: [{
        model: Case,
        as: 'linkedCase',
        attributes: ['id', 'caseId', 'fullName', 'dateOfExposure', 'exposureType', 'status'],
      }],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};