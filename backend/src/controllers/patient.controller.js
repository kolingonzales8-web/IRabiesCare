const Patient = require('../models/patient.model');
const Case = require('../models/case.model');

// Get all patients (admin sees all)
exports.getAllPatients = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status && status !== 'All') query.patientStatus = status;
    if (req.query.caseRef) query.case = req.query.caseRef;
    if (search) query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
    ];

    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .populate('case', 'caseId fullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Flatten for frontend convenience
    const mapped = patients.map(p => ({
      _id: p._id,
      caseId: p.case?.caseId,
      fullName: p.fullName,
      contact: p.case?.contact,
      woundCategory: p.woundCategory,
      patientStatus: p.patientStatus,
      doses: p.doses,
      nextSchedule: p.nextSchedule,
      caseOutcome: p.caseOutcome,
      createdAt: p.createdAt,
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
    const patient = await Patient.findById(req.params.id).populate('case');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create patient record linked to a case
exports.createPatient = async (req, res) => {
  try {
    const { caseId, woundCategory, patientStatus, doses, nextSchedule, caseOutcome } = req.body;

    // Get fullName from the linked case
    const linkedCase = await Case.findById(caseId);
    if (!linkedCase) return res.status(404).json({ message: 'Linked case not found' });

    const patient = await Patient.create({
      case: caseId,
      fullName: linkedCase.fullName,
      woundCategory,
      patientStatus,
      doses: doses || [],
      nextSchedule: nextSchedule || null,
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
    const updated = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json({ message: 'Patient updated', patient: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete patient
exports.deletePatient = async (req, res) => {
  try {
    const deleted = await Patient.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json({ message: 'Patient deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stats
exports.getPatientStats = async (req, res) => {
  try {
    const total     = await Patient.countDocuments({});
    const ongoing   = await Patient.countDocuments({ patientStatus: 'Ongoing' });
    const completed = await Patient.countDocuments({ patientStatus: 'Completed' });
    const pending   = await Patient.countDocuments({ patientStatus: 'Pending' });

    res.status(200).json({ total, ongoing, completed, pending });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mobile: Get patient records for the logged-in user's cases
// Used by ScheduleScreen and DashboardScreen to show the patient
// their own PEP schedule that the admin has assigned.
exports.getMyPatients = async (req, res) => {
  try {
    // Find all cases submitted by the logged-in patient
    const userCases = await Case.find({ createdBy: req.user._id }).select('_id');
    const caseIds = userCases.map(c => c._id);

    // Find patient records the admin created for those cases,
    // and populate all case fields the mobile screens need
    const patients = await Patient.find({ case: { $in: caseIds } })
      .populate('case', 'caseId fullName dateOfExposure exposureType status')
      .sort({ createdAt: -1 });

    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};