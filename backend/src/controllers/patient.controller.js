const Patient      = require('../models/patient.model');
const logActivity  = require('../utils/logActivity'); 
const Case         = require('../models/case.model');
const User         = require('../models/user.model');         // ← ADD
const Notification = require('../models/notification.model'); // ← ADD
const { pushToUsers, getConnectedAdminIds } = require('./notifications.controller');

// Get all patients — scoped by role
exports.getAllPatients = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const caseWhere = req.user.role === 'admin' ? {} : { assignedTo: req.user.id };
    if (req.query.caseRef) caseWhere._id = req.query.caseRef;

    const scopedCases = await Case.find(caseWhere).select('_id fullName contact caseId');
    const caseIds     = scopedCases.map(c => c._id);

    const where = { caseId: { $in: caseIds } };
    if (status && status !== 'All') where.patientStatus = status;
    if (search) where.fullName = { $regex: search, $options: 'i' };

    const total    = await Patient.countDocuments(where);
    const patients = await Patient.find(where)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit);

    const caseMap = {};
    scopedCases.forEach(c => { caseMap[c._id.toString()] = c; });

    const mapped = patients.map(p => {
      const linkedCase = caseMap[p.caseId?.toString()];
      return {
        id: p._id, caseId: linkedCase?.caseId, fullName: p.fullName,
        contact: linkedCase?.contact, woundCategory: p.woundCategory,
        patientStatus: p.patientStatus, doses: p.doses,
        nextSchedule: p.nextSchedule, caseOutcome: p.caseOutcome, createdAt: p.createdAt,
      };
    });

    res.status(200).json({ patients: mapped, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single patient
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('caseId');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    const linkedCase = patient.caseId;
    res.status(200).json({ ...patient.toJSON(), caseId: linkedCase?.caseId, contact: linkedCase?.contact });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create patient
exports.createPatient = async (req, res) => {
  try {
    const { caseId, woundCategory, patientStatus, doses, nextSchedule, caseOutcome } = req.body;
    const linkedCase = await Case.findById(caseId);
    if (!linkedCase) return res.status(404).json({ message: 'Linked case not found' });

    const patient = await Patient.create({
      caseId, fullName: linkedCase.fullName,
      woundCategory, patientStatus,
      doses: doses || [], nextSchedule: nextSchedule || null, caseOutcome,
    });


      const adminUsers = await User.find({ role: 'admin' }).select('_id');
      await Notification.create({
        type: 'patient',
        message: `New patient record created for ${linkedCase.fullName}`,
        createdBy: req.user.name,
        recipients: adminUsers.map(u => u._id),
      });

     try {
      const adminIds  = getConnectedAdminIds();
      const assignedCase = await Case.findById(caseId).select('assignedTo');
      const staffId   = assignedCase?.assignedTo?.toString();
      const notifyIds = [...new Set([...adminIds, ...(staffId ? [staffId] : [])])];
      pushToUsers(notifyIds, { type: 'new_record', module: 'patients', message: 'New patient record created' });
    } catch (e) { console.error('[SSE] push error:', e.message); }
    

      await logActivity({
    action: 'CREATE', module: 'Patient',
    description: `Patient record created for ${linkedCase.fullName}`,
    user: req.user, targetId: patient._id,
    targetName: linkedCase.fullName, req,
  });

    res.status(201).json({ message: 'Patient record created', patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update patient
exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    Object.assign(patient, req.body);
    await patient.save();

     await logActivity({
      action: 'UPDATE', module: 'Patient',
      description: `Patient record updated for ${patient.fullName}`,
      user: req.user, targetId: patient._id,
      targetName: patient.fullName, req,
    });

    res.status(200).json({ message: 'Patient updated', patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }


};

// Delete patient
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

     await logActivity({
      action: 'DELETE', module: 'Patient',
      description: `Patient record deleted for ${patient.fullName}`,
      user: req.user, targetId: patient._id,
      targetName: patient.fullName, req,
    });

    await patient.deleteOne();
    res.status(200).json({ message: 'Patient deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stats — scoped by role
exports.getPatientStats = async (req, res) => {
  try {
    const caseWhere   = req.user.role === 'admin' ? {} : { assignedTo: req.user.id };
    const scopedCases = await Case.find(caseWhere).select('_id');
    const caseIds     = scopedCases.map(c => c._id);
    const where       = { caseId: { $in: caseIds } };

    const [total, ongoing, completed, pending] = await Promise.all([
      Patient.countDocuments(where),
      Patient.countDocuments({ ...where, patientStatus: 'Ongoing'   }),
      Patient.countDocuments({ ...where, patientStatus: 'Completed' }),
      Patient.countDocuments({ ...where, patientStatus: 'Pending'   }),
    ]);

    res.status(200).json({ total, ongoing, completed, pending });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mobile: Get patient records for logged-in user's cases
exports.getMyPatients = async (req, res) => {
  try {
    const userCases = await Case.find({ patientUserId: req.user.id }).select('_id');
    const caseIds   = userCases.map(c => c._id);
    const patients  = await Patient.find({ caseId: { $in: caseIds } })
      .populate('caseId', 'caseId fullName dateOfExposure exposureType status')
      .sort({ createdAt: -1 });
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

