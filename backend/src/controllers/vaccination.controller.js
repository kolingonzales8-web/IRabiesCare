const Vaccination = require('../models/vaccination.model');
const Patient = require('../models/patient.model');
const Case = require('../models/case.model');

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Auto-determine status from schedule administered dates
const resolveStatus = (schedule, providedStatus) => {
  if (!schedule) return providedStatus || 'Ongoing';
  const days = ['day0', 'day3', 'day7', 'day14', 'day28'];
  const doneCount = days.filter(d => schedule[d]).length;
  if (doneCount === 5) return 'Completed';
  if (doneCount > 0)  return 'Ongoing';
  return providedStatus || 'Ongoing';
};

// ─── Get All Vaccinations (admin) ─────────────────────────────────────────────
exports.getAllVaccinations = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status && status !== 'All') query.status = status;

    let vaccinations = await Vaccination.find(query)
      .populate({
        path: 'patient',
        populate: { path: 'case', select: 'caseId fullName' },
      })
      .sort({ createdAt: -1 })
      .lean();

    if (search) {
      const s = search.toLowerCase();
      vaccinations = vaccinations.filter(v =>
        v.patient?.case?.fullName?.toLowerCase().includes(s) ||
        v.patient?.case?.caseId?.includes(s) ||
        v.vaccineBrand?.toLowerCase().includes(s)
      );
    }

    const total      = vaccinations.length;
    const totalPages = Math.ceil(total / limit);
    const paginated  = vaccinations.slice((page - 1) * limit, page * limit);

    const result = paginated.map(v => ({
      _id:                v._id,
      caseId:             v.patient?.case?.caseId,
      patientName:        v.patient?.case?.fullName,
      patientRef:         v.patient?._id,
      vaccineBrand:       v.vaccineBrand,
      injectionSite:      v.injectionSite,
      schedule:           v.schedule,
      rigGiven:           v.rigGiven,
      rigType:            v.rigType,
      rigDateAdministered: v.rigDateAdministered,
      rigDosage:          v.rigDosage,
      manufacturer:       v.manufacturer,
      vaccineStockUsed:   v.vaccineStockUsed,
      status:             v.status,
      createdAt:          v.createdAt,
    }));

    res.status(200).json({ vaccinations: result, total, page: Number(page), totalPages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Mobile: Get my vaccinations ─────────────────────────────────────────────
exports.getMyVaccinations = async (req, res) => {
  try {
    const userCases = await Case.find({ createdBy: req.user._id }).select('_id');
    const caseIds   = userCases.map(c => c._id);

    const patients   = await Patient.find({ case: { $in: caseIds } }).select('_id');
    const patientIds = patients.map(p => p._id);

    const vaccinations = await Vaccination.find({ patient: { $in: patientIds } })
      .populate({
        path: 'patient',
        populate: { path: 'case', select: 'caseId fullName' },
      })
      .sort({ createdAt: -1 })
      .lean();

    const result = vaccinations.map(v => ({
      _id:          v._id,
      caseId:       v.patient?.case?.caseId,
      patientName:  v.patient?.case?.fullName,
      vaccineBrand: v.vaccineBrand,
      injectionSite: v.injectionSite,
      schedule:     v.schedule,
      rigGiven:     v.rigGiven,
      status:       v.status,
      createdAt:    v.createdAt,
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Single Vaccination ───────────────────────────────────────────────────
exports.getVaccinationById = async (req, res) => {
  try {
    const vaccination = await Vaccination.findById(req.params.id)
      .populate({
        path: 'patient',
        populate: { path: 'case', select: 'caseId fullName age sex address contact' },
      });
    if (!vaccination) return res.status(404).json({ message: 'Vaccination record not found' });
    res.status(200).json(vaccination);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Create Vaccination ───────────────────────────────────────────────────────
exports.createVaccination = async (req, res) => {
  try {
    const {
      patientId, vaccineBrand, injectionSite,
      schedule, rigGiven, rigType, rigDateAdministered, rigDosage,
      manufacturer, vaccineStockUsed, status,
    } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Build schedule object — support both administered + scheduled dates
    const scheduleData = {
      day0:  schedule?.day0  || null,
      day3:  schedule?.day3  || null,
      day7:  schedule?.day7  || null,
      day14: schedule?.day14 || null,
      day28: schedule?.day28 || null,
      day0Scheduled:  schedule?.day0Scheduled  || null,
      day3Scheduled:  schedule?.day3Scheduled  || null,
      day7Scheduled:  schedule?.day7Scheduled  || null,
      day14Scheduled: schedule?.day14Scheduled || null,
      day28Scheduled: schedule?.day28Scheduled || null,
    };

    const autoStatus = resolveStatus(scheduleData, status);

    const newVaccination = await Vaccination.create({
      patient:             patientId,
      vaccineBrand,
      injectionSite,
      schedule:            scheduleData,
      rigGiven:            !!rigGiven,
      rigType:             rigGiven ? rigType : null,
      rigDateAdministered: rigGiven ? rigDateAdministered : null,
      rigDosage:           rigGiven ? rigDosage : null,
      manufacturer,
      vaccineStockUsed,
      status:              autoStatus,
      createdBy:           req.user._id,
    });

    res.status(201).json({ message: 'Vaccination record created successfully', vaccination: newVaccination });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Vaccination ───────────────────────────────────────────────────────
exports.updateVaccination = async (req, res) => {
  try {
    const {
      vaccineBrand, injectionSite,
      schedule, rigGiven, rigType, rigDateAdministered, rigDosage,
      manufacturer, vaccineStockUsed, status,
    } = req.body;

    // Build schedule object — merge administered + scheduled dates
    const scheduleData = {
      day0:  schedule?.day0  || null,
      day3:  schedule?.day3  || null,
      day7:  schedule?.day7  || null,
      day14: schedule?.day14 || null,
      day28: schedule?.day28 || null,
      day0Scheduled:  schedule?.day0Scheduled  || null,
      day3Scheduled:  schedule?.day3Scheduled  || null,
      day7Scheduled:  schedule?.day7Scheduled  || null,
      day14Scheduled: schedule?.day14Scheduled || null,
      day28Scheduled: schedule?.day28Scheduled || null,
    };

    // Auto-resolve status from administered dates
    const autoStatus = resolveStatus(scheduleData, status);

    const updateData = {
      ...(vaccineBrand  && { vaccineBrand }),
      ...(injectionSite && { injectionSite }),
      schedule:            scheduleData,
      rigGiven:            !!rigGiven,
      rigType:             rigGiven ? rigType : null,
      rigDateAdministered: rigGiven ? rigDateAdministered : null,
      rigDosage:           rigGiven ? rigDosage : null,
      ...(manufacturer     !== undefined && { manufacturer }),
      ...(vaccineStockUsed !== undefined && { vaccineStockUsed }),
      status: autoStatus,
    };

    const updated = await Vaccination.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: 'Vaccination record not found' });
    res.status(200).json({ message: 'Vaccination record updated successfully', vaccination: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Vaccination ───────────────────────────────────────────────────────
exports.deleteVaccination = async (req, res) => {
  try {
    const deleted = await Vaccination.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Vaccination record not found' });
    res.status(200).json({ message: 'Vaccination record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Stats ────────────────────────────────────────────────────────────────────
exports.getVaccinationStats = async (req, res) => {
  try {
    const total     = await Vaccination.countDocuments({});
    const ongoing   = await Vaccination.countDocuments({ status: 'Ongoing' });
    const completed = await Vaccination.countDocuments({ status: 'Completed' });
    const rigGiven  = await Vaccination.countDocuments({ rigGiven: true });

    res.status(200).json({ total, ongoing, completed, rigGiven });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};