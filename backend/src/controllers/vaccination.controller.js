const Vaccination = require('../models/vaccination.model');
const Patient     = require('../models/patient.model');
const Case        = require('../models/case.model');

const resolveStatus = (data, providedStatus) => {
  if (!data) return providedStatus || 'Ongoing';
  const days = ['day0', 'day3', 'day7', 'day14', 'day28'];
  const doneCount = days.filter(d => data[d]).length;
  if (doneCount === 5) return 'Completed';
  if (doneCount > 0)  return 'Ongoing';
  return providedStatus || 'Ongoing';
};

// Get All Vaccinations — scoped by role
exports.getAllVaccinations = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const caseWhere   = req.user.role === 'admin' ? {} : { assignedTo: req.user.id };
    const scopedCases = await Case.find(caseWhere).select('_id caseId fullName');
    const caseIds     = scopedCases.map(c => c._id);

    const scopedPatients = await Patient.find({ caseId: { $in: caseIds } }).select('_id caseId fullName');
    const patientIds     = scopedPatients.map(p => p._id);

    const where = { patientId: { $in: patientIds } };
    if (status && status !== 'All') where.status = status;

    let vaccinations = await Vaccination.find(where).sort({ createdAt: -1 });

    if (search) {
      const s = search.toLowerCase();
      const caseMap = {};
      scopedCases.forEach(c => { caseMap[c._id.toString()] = c; });
      const patientCaseMap = {};
      scopedPatients.forEach(p => { patientCaseMap[p._id.toString()] = caseMap[p.caseId?.toString()]; });

      vaccinations = vaccinations.filter(v => {
        const lc = patientCaseMap[v.patientId?.toString()];
        return lc?.fullName?.toLowerCase().includes(s) ||
               lc?.caseId?.includes(s) ||
               v.vaccineBrand?.toLowerCase().includes(s);
      });
    }

    const total      = vaccinations.length;
    const totalPages = Math.ceil(total / limit);
    const paginated  = vaccinations.slice((page - 1) * limit, page * limit);

    // Build lookup maps
    const caseMap = {};
    scopedCases.forEach(c => { caseMap[c._id.toString()] = c; });
    const patientCaseMap = {};
    scopedPatients.forEach(p => { patientCaseMap[p._id.toString()] = caseMap[p.caseId?.toString()]; });

    const result = paginated.map(v => {
      const lc = patientCaseMap[v.patientId?.toString()];
      return {
        id: v._id, caseId: lc?.caseId, patientName: lc?.fullName, patientRef: v.patientId,
        vaccineBrand: v.vaccineBrand, injectionSite: v.injectionSite,
        day0: v.day0, day3: v.day3, day7: v.day7, day14: v.day14, day28: v.day28,
        day0Scheduled: v.day0Scheduled, day3Scheduled: v.day3Scheduled, day7Scheduled: v.day7Scheduled,
        day14Scheduled: v.day14Scheduled, day28Scheduled: v.day28Scheduled,
        day0Missed: v.day0Missed, day3Missed: v.day3Missed, day7Missed: v.day7Missed,
        day14Missed: v.day14Missed, day28Missed: v.day28Missed,
        rigGiven: v.rigGiven, rigType: v.rigType, rigDateAdministered: v.rigDateAdministered,
        rigDosage: v.rigDosage, manufacturer: v.manufacturer, vaccineStockUsed: v.vaccineStockUsed,
        status: v.status, createdAt: v.createdAt,
      };
    });

    res.status(200).json({ vaccinations: result, total, page: Number(page), totalPages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mobile: Get My Vaccinations
exports.getMyVaccinations = async (req, res) => {
  try {
    const userCases  = await Case.find({ patientUserId: req.user.id }).select('_id caseId fullName');
    if (!userCases.length) return res.status(200).json([]);

    const caseIds    = userCases.map(c => c._id);
    const patients   = await Patient.find({ caseId: { $in: caseIds } }).select('_id caseId');
    if (!patients.length) return res.status(200).json([]);

    const patientIds = patients.map(p => p._id);
    const vaccinations = await Vaccination.find({ patientId: { $in: patientIds } }).sort({ createdAt: -1 });

    const caseMap = {};
    userCases.forEach(c => { caseMap[c._id.toString()] = c; });
    const patientCaseMap = {};
    patients.forEach(p => { patientCaseMap[p._id.toString()] = caseMap[p.caseId?.toString()]; });

    const result = vaccinations.map(v => {
      const lc = patientCaseMap[v.patientId?.toString()];
      return {
        id: v._id, caseId: lc?.caseId, patientName: lc?.fullName, patientRef: v.patientId,
        vaccineBrand: v.vaccineBrand, injectionSite: v.injectionSite, status: v.status,
        day0: v.day0, day3: v.day3, day7: v.day7, day14: v.day14, day28: v.day28,
        day0Scheduled: v.day0Scheduled, day3Scheduled: v.day3Scheduled, day7Scheduled: v.day7Scheduled,
        day14Scheduled: v.day14Scheduled, day28Scheduled: v.day28Scheduled,
        day0Missed: v.day0Missed, day3Missed: v.day3Missed, day7Missed: v.day7Missed,
        day14Missed: v.day14Missed, day28Missed: v.day28Missed,
        rigGiven: v.rigGiven, rigType: v.rigType, rigDosage: v.rigDosage, createdAt: v.createdAt,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('getMyVaccinations error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get Single Vaccination
exports.getVaccinationById = async (req, res) => {
  try {
    const vaccination = await Vaccination.findById(req.params.id);
    if (!vaccination) return res.status(404).json({ message: 'Vaccination record not found' });

    const patient = await Patient.findById(vaccination.patientId);
    const lc      = patient ? await Case.findById(patient.caseId).select('caseId fullName age sex address contact') : null;

    res.status(200).json({ ...vaccination.toJSON(), linkedPatient: { ...patient?.toJSON(), linkedCase: lc } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Vaccination
exports.createVaccination = async (req, res) => {
  try {
    const { patientId, vaccineBrand, injectionSite, schedule, rigGiven, rigType,
      rigDateAdministered, rigDosage, manufacturer, vaccineStockUsed, status } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const scheduleFields = {
      day0:  schedule?.day0  || null, day3:  schedule?.day3  || null,
      day7:  schedule?.day7  || null, day14: schedule?.day14 || null, day28: schedule?.day28 || null,
      day0Scheduled:  schedule?.day0Scheduled  || null, day3Scheduled:  schedule?.day3Scheduled  || null,
      day7Scheduled:  schedule?.day7Scheduled  || null, day14Scheduled: schedule?.day14Scheduled || null,
      day28Scheduled: schedule?.day28Scheduled || null,
      day0Missed:  schedule?.day0Missed  || false, day3Missed:  schedule?.day3Missed  || false,
      day7Missed:  schedule?.day7Missed  || false, day14Missed: schedule?.day14Missed || false,
      day28Missed: schedule?.day28Missed || false,
    };

    const autoStatus = resolveStatus(scheduleFields, status);

    const newVaccination = await Vaccination.create({
      patientId, vaccineBrand, injectionSite, ...scheduleFields,
      rigGiven: !!rigGiven,
      rigType:             rigGiven ? rigType             : null,
      rigDateAdministered: rigGiven ? rigDateAdministered : null,
      rigDosage:           rigGiven ? rigDosage           : null,
      manufacturer, vaccineStockUsed, status: autoStatus, createdBy: req.user.id,
    });

    res.status(201).json({ message: 'Vaccination record created successfully', vaccination: newVaccination });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Vaccination
exports.updateVaccination = async (req, res) => {
  try {
    const vaccination = await Vaccination.findById(req.params.id);
    if (!vaccination) return res.status(404).json({ message: 'Vaccination record not found' });

    const { vaccineBrand, injectionSite, schedule, rigGiven, rigType,
      rigDateAdministered, rigDosage, manufacturer, vaccineStockUsed, status } = req.body;

    const scheduleFields = {
      day0:  schedule?.day0  || null, day3:  schedule?.day3  || null,
      day7:  schedule?.day7  || null, day14: schedule?.day14 || null, day28: schedule?.day28 || null,
      day0Scheduled:  schedule?.day0Scheduled  || null, day3Scheduled:  schedule?.day3Scheduled  || null,
      day7Scheduled:  schedule?.day7Scheduled  || null, day14Scheduled: schedule?.day14Scheduled || null,
      day28Scheduled: schedule?.day28Scheduled || null,
      day0Missed:  schedule?.day0Missed  || false, day3Missed:  schedule?.day3Missed  || false,
      day7Missed:  schedule?.day7Missed  || false, day14Missed: schedule?.day14Missed || false,
      day28Missed: schedule?.day28Missed || false,
    };

    const autoStatus = resolveStatus(scheduleFields, status);

    Object.assign(vaccination, {
      ...(vaccineBrand  && { vaccineBrand }),
      ...(injectionSite && { injectionSite }),
      ...scheduleFields,
      rigGiven: !!rigGiven,
      rigType:             rigGiven ? rigType             : null,
      rigDateAdministered: rigGiven ? rigDateAdministered : null,
      rigDosage:           rigGiven ? rigDosage           : null,
      ...(manufacturer     !== undefined && { manufacturer }),
      ...(vaccineStockUsed !== undefined && { vaccineStockUsed }),
      status: autoStatus,
    });

    await vaccination.save();
    res.status(200).json({ message: 'Vaccination record updated successfully', vaccination });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Vaccination
exports.deleteVaccination = async (req, res) => {
  try {
    const vaccination = await Vaccination.findById(req.params.id);
    if (!vaccination) return res.status(404).json({ message: 'Vaccination record not found' });
    await vaccination.deleteOne();
    res.status(200).json({ message: 'Vaccination record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stats — scoped by role
exports.getVaccinationStats = async (req, res) => {
  try {
    const caseWhere      = req.user.role === 'admin' ? {} : { assignedTo: req.user.id };
    const scopedCases    = await Case.find(caseWhere).select('_id');
    const caseIds        = scopedCases.map(c => c._id);
    const scopedPatients = await Patient.find({ caseId: { $in: caseIds } }).select('_id');
    const patientIds     = scopedPatients.map(p => p._id);
    const where          = { patientId: { $in: patientIds } };

    const [total, ongoing, completed, rigGiven, missedDoses] = await Promise.all([
      Vaccination.countDocuments(where),
      Vaccination.countDocuments({ ...where, status: 'Ongoing'   }),
      Vaccination.countDocuments({ ...where, status: 'Completed' }),
      Vaccination.countDocuments({ ...where, rigGiven: true }),
      Vaccination.countDocuments({ ...where, $or: [
        { day0Missed: true }, { day3Missed: true }, { day7Missed: true },
        { day14Missed: true }, { day28Missed: true },
      ]}),
    ]);

    res.status(200).json({ total, ongoing, completed, rigGiven, missedDoses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upcoming Vaccinations — scoped by role
exports.getUpcomingVaccinations = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const now  = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const caseWhere      = req.user.role === 'admin' ? {} : { assignedTo: req.user.id };
    const scopedCases    = await Case.find(caseWhere).select('_id caseId fullName');
    const caseIds        = scopedCases.map(c => c._id);
    const scopedPatients = await Patient.find({ caseId: { $in: caseIds } }).select('_id caseId');
    const patientIds     = scopedPatients.map(p => p._id);

    const vaccinations = await Vaccination.find({
      patientId: { $in: patientIds },
      status: 'Ongoing',
      $or: [
        { day0Scheduled:  { $gte: now, $lte: soon } },
        { day3Scheduled:  { $gte: now, $lte: soon } },
        { day7Scheduled:  { $gte: now, $lte: soon } },
        { day14Scheduled: { $gte: now, $lte: soon } },
        { day28Scheduled: { $gte: now, $lte: soon } },
      ],
    }).sort({ day3Scheduled: 1 }).limit(Number(limit));

    const caseMap = {};
    scopedCases.forEach(c => { caseMap[c._id.toString()] = c; });
    const patientCaseMap = {};
    scopedPatients.forEach(p => { patientCaseMap[p._id.toString()] = caseMap[p.caseId?.toString()]; });

    const doseDays = ['day0', 'day3', 'day7', 'day14', 'day28'];
    const result = vaccinations.map(v => {
      const lc         = patientCaseMap[v.patientId?.toString()];
      const nextDayKey = doseDays.find(d => !v[d] && v[`${d}Scheduled`]);
      return {
        id: v._id, caseId: lc?.caseId, patientName: lc?.fullName,
        vaccineBrand: v.vaccineBrand,
        nextDose:     nextDayKey ? `Day ${nextDayKey.replace('day', '')}` : null,
        nextDoseDate: nextDayKey ? v[`${nextDayKey}Scheduled`] : null,
        status: v.status,
      };
    });

    res.status(200).json({ vaccinations: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};