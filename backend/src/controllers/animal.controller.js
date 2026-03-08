const { Op } = require('sequelize');
const Animal = require('../models/animal.model');
const Case   = require('../models/case.model');

// Get all animal records — scoped by role
exports.getAllAnimals = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status && status !== 'All') where.observationStatus = status;

    const caseWhere = req.user.role === 'admin'
      ? {}
      : { assignedTo: req.user.id };

    if (search) {
      const s = `%${search}%`;
      where[Op.or] = [
        { animalSpecies: { [Op.like]: s } },
        { ownerName:     { [Op.like]: s } },
      ];
      caseWhere[Op.or] = [
        { caseId:   { [Op.like]: s } },
        { fullName: { [Op.like]: s } },
      ];
    }

    const animals = await Animal.findAll({
      where,
      include: [{
        model: Case,
        as: 'linkedCase',
        attributes: ['id', 'caseId', 'fullName', 'dateOfExposure'],
        where:    caseWhere,
        required: req.user.role !== 'admin', // ✅ staff: required=true to scope, admin: false to allow all
      }],
      order: [['createdAt', 'DESC']],
    });

    const total      = animals.length;
    const totalPages = Math.ceil(total / limit);
    const paginated  = animals.slice((page - 1) * limit, page * limit);

    const result = paginated.map(a => ({
      id:                   a.id,
      caseId:               a.linkedCase?.caseId,
      caseRef:              a.linkedCase?.id,
      patientName:          a.linkedCase?.fullName,
      animalSpecies:        a.animalSpecies,
      animalOwnership:      a.animalOwnership,
      animalVaccinated:     a.animalVaccinated,
      ownerName:            a.ownerName,
      ownerContact:         a.ownerContact,
      observationStartDate: a.observationStartDate,
      observationEndDate:   a.observationEndDate,
      observationStatus:    a.observationStatus,
      animalOutcome:        a.animalOutcome,
      dateOfOutcome:        a.dateOfOutcome,
      remarks:              a.remarks,
      createdAt:            a.createdAt,
    }));

    res.status(200).json({ animals: result, total, page: Number(page), totalPages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single animal record
exports.getAnimalById = async (req, res) => {
  try {
    const animal = await Animal.findByPk(req.params.id, {
      include: [{
        model: Case,
        as: 'linkedCase',
        attributes: ['id', 'caseId', 'fullName', 'age', 'sex', 'address', 'contact', 'dateOfExposure', 'exposureType'],
      }],
    });
    if (!animal) return res.status(404).json({ message: 'Animal record not found' });
    res.status(200).json(animal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create animal record
exports.createAnimal = async (req, res) => {
  try {
    const {
      caseId, animalSpecies, animalOwnership, animalVaccinated,
      ownerName, ownerContact, observationStartDate, observationEndDate,
      observationStatus, animalOutcome, dateOfOutcome, remarks,
    } = req.body;

    const linkedCase = await Case.findByPk(caseId);
    if (!linkedCase) return res.status(404).json({ message: 'Case not found' });

    const existing = await Animal.findOne({ where: { caseId } });
    if (existing) return res.status(400).json({ message: 'An animal record already exists for this case' });

    const newAnimal = await Animal.create({
      caseId, animalSpecies, animalOwnership, animalVaccinated,
      ownerName:            animalOwnership === 'Owned' ? ownerName    : null,
      ownerContact:         animalOwnership === 'Owned' ? ownerContact : null,
      observationStartDate: observationStartDate || null,
      observationEndDate:   observationEndDate   || null,
      observationStatus, animalOutcome,
      dateOfOutcome: dateOfOutcome || null,
      remarks:       remarks       || null,
      createdBy:     req.user.id,
    });

    res.status(201).json({ message: 'Animal record created successfully', animal: newAnimal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update animal record
exports.updateAnimal = async (req, res) => {
  try {
    const animal = await Animal.findByPk(req.params.id);
    if (!animal) return res.status(404).json({ message: 'Animal record not found' });

    if (req.body.animalOwnership && req.body.animalOwnership !== 'Owned') {
      req.body.ownerName    = null;
      req.body.ownerContact = null;
    }

    await animal.update(req.body);
    res.status(200).json({ message: 'Animal record updated successfully', animal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete animal record
exports.deleteAnimal = async (req, res) => {
  try {
    const animal = await Animal.findByPk(req.params.id);
    if (!animal) return res.status(404).json({ message: 'Animal record not found' });

    await animal.destroy();
    res.status(200).json({ message: 'Animal record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stats — scoped by role
exports.getAnimalStats = async (req, res) => {
  try {
    const caseWhere = req.user.role === 'admin'
      ? {}
      : { assignedTo: req.user.id };

    const scopedInclude = [{
      model: Case,
      as: 'linkedCase',
      required: true,
      attributes: [],
      where: caseWhere,
    }];

    const [total, underObservation, completedObservation, lostToFollowUp] = await Promise.all([
      Animal.count({ include: scopedInclude }),
      Animal.count({ where: { observationStatus: 'Under Observation'       }, include: scopedInclude }),
      Animal.count({ where: { observationStatus: 'Completed Observation'   }, include: scopedInclude }),
      Animal.count({ where: { observationStatus: 'Lost to Follow-up'       }, include: scopedInclude }),
    ]);

    res.status(200).json({ total, underObservation, completedObservation, lostToFollowUp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};