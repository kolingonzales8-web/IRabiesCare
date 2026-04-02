const Animal = require('../models/animal.model');
const logActivity = require('../utils/logActivity');
const Case   = require('../models/case.model');
const { pushToUsers, getConnectedAdminIds } = require('./notifications.controller');

exports.getAllAnimals = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const caseWhere = req.user.role === 'admin' ? {} : { assignedTo: req.user.id };
    if (search) {
      caseWhere.$or = [
        { caseId:   { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
      ];
    }

    const scopedCases = await Case.find(caseWhere).select('_id caseId fullName dateOfExposure');
    const caseIds     = scopedCases.map(c => c._id);

    const where = { caseId: { $in: caseIds } };
    if (status && status !== 'All') where.observationStatus = status;
    if (search) where.$or = [
      { animalSpecies: { $regex: search, $options: 'i' } },
      { ownerName:     { $regex: search, $options: 'i' } },
    ];

    const total   = await Animal.countDocuments(where);
    const animals = await Animal.find(where)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit);

    const caseMap = {};
    scopedCases.forEach(c => { caseMap[c._id.toString()] = c; });

    const result = animals.map(a => {
      const lc = caseMap[a.caseId?.toString()];
      return {
        id: a._id, caseId: lc?.caseId, caseRef: lc?._id, patientName: lc?.fullName,
        animalSpecies: a.animalSpecies, animalOwnership: a.animalOwnership,
        animalVaccinated: a.animalVaccinated, ownerName: a.ownerName, ownerContact: a.ownerContact,
        observationStartDate: a.observationStartDate, observationEndDate: a.observationEndDate,
        observationStatus: a.observationStatus, animalOutcome: a.animalOutcome,
        dateOfOutcome: a.dateOfOutcome, remarks: a.remarks, createdAt: a.createdAt,
      };
    });

    res.status(200).json({ animals: result, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAnimalById = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id).populate('caseId');
    if (!animal) return res.status(404).json({ message: 'Animal record not found' });
    const lc = animal.caseId;
    res.status(200).json({ ...animal.toJSON(), caseId: lc?.caseId, patientName: lc?.fullName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAnimal = async (req, res) => {
  try {
    const { caseId, animalSpecies, animalOwnership, animalVaccinated, ownerName, ownerContact,
      observationStartDate, observationEndDate, observationStatus, animalOutcome, dateOfOutcome, remarks } = req.body;

    const linkedCase = await Case.findById(caseId);
    if (!linkedCase) return res.status(404).json({ message: 'Case not found' });

    const existing = await Animal.findOne({ caseId });
    if (existing) return res.status(400).json({ message: 'An animal record already exists for this case' });

    const newAnimal = await Animal.create({
      caseId, animalSpecies, animalOwnership, animalVaccinated,
      ownerName:    animalOwnership === 'Owned' ? ownerName    : null,
      ownerContact: animalOwnership === 'Owned' ? ownerContact : null,
      observationStartDate: observationStartDate || null,
      observationEndDate:   observationEndDate   || null,
      observationStatus, animalOutcome,
      dateOfOutcome: dateOfOutcome || null,
      remarks: remarks || null,
      createdBy: req.user.id,
    });

     try {
      const adminIds  = getConnectedAdminIds();
      const staffId   = linkedCase?.assignedTo?.toString();
      const notifyIds = [...new Set([...adminIds, ...(staffId ? [staffId] : [])])];
      pushToUsers(notifyIds, { type: 'new_record', module: 'animals', message: 'New animal record created' });
    } catch (e) { console.error('[SSE] push error:', e.message); }


      

     await logActivity({
      action: 'CREATE', module: 'Animal',
      description: `Animal record created for Case #${linkedCase.caseId}`,
      user: req.user, targetId: newAnimal._id,
      targetName: `${animalSpecies} - ${linkedCase.fullName}`, req,
    });

    res.status(201).json({ message: 'Animal record created successfully', animal: newAnimal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAnimal = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    if (!animal) return res.status(404).json({ message: 'Animal record not found' });

    if (req.body.animalOwnership && req.body.animalOwnership !== 'Owned') {
      req.body.ownerName = null; req.body.ownerContact = null;
    }

    Object.assign(animal, req.body);
    await animal.save();

      await logActivity({
      action: 'UPDATE', module: 'Animal',
      description: `Animal record updated`,
      user: req.user, targetId: animal._id,
      targetName: animal.animalSpecies, req,
    });
    res.status(200).json({ message: 'Animal record updated successfully', animal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAnimal = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    if (!animal) return res.status(404).json({ message: 'Animal record not found' });

     await logActivity({
      action: 'DELETE', module: 'Animal',
      description: `Animal record deleted`,
      user: req.user, targetId: animal._id,
      targetName: animal.animalSpecies, req,
    });

    await animal.deleteOne();
    res.status(200).json({ message: 'Animal record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAnimalStats = async (req, res) => {
  try {
    const caseWhere   = req.user.role === 'admin' ? {} : { assignedTo: req.user.id };
    const scopedCases = await Case.find(caseWhere).select('_id');
    const caseIds     = scopedCases.map(c => c._id);
    const where       = { caseId: { $in: caseIds } };

    const [total, underObservation, completedObservation, lostToFollowUp] = await Promise.all([
      Animal.countDocuments(where),
      Animal.countDocuments({ ...where, observationStatus: 'Under Observation'     }),
      Animal.countDocuments({ ...where, observationStatus: 'Completed Observation' }),
      Animal.countDocuments({ ...where, observationStatus: 'Lost to Follow-up'     }),
    ]);

    res.status(200).json({ total, underObservation, completedObservation, lostToFollowUp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

