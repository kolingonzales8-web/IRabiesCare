const Animal = require('../models/animal.model');
const Case = require('../models/case.model');

// Get all animal records (admin sees all)
exports.getAllAnimals = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status && status !== 'All') query.observationStatus = status;

    let animals = await Animal.find(query)
      .populate('case', 'caseId fullName dateOfExposure')
      .sort({ createdAt: -1 })
      .lean();

    // Search on populated case fields
    if (search) {
      const s = search.toLowerCase();
      animals = animals.filter(a =>
        a.case?.caseId?.includes(s) ||
        a.case?.fullName?.toLowerCase().includes(s) ||
        a.animalSpecies?.toLowerCase().includes(s) ||
        a.ownerName?.toLowerCase().includes(s)
      );
    }

    const total = animals.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = animals.slice((page - 1) * limit, page * limit);

    const result = paginated.map(a => ({
      _id: a._id,
      caseId: a.case?.caseId,
      caseRef: a.case?._id,
      patientName: a.case?.fullName,
      animalSpecies: a.animalSpecies,
      animalOwnership: a.animalOwnership,
      animalVaccinated: a.animalVaccinated,
      ownerName: a.ownerName,
      ownerContact: a.ownerContact,
      observationStartDate: a.observationStartDate,
      observationEndDate: a.observationEndDate,
      observationStatus: a.observationStatus,
      animalOutcome: a.animalOutcome,
      dateOfOutcome: a.dateOfOutcome,
      remarks: a.remarks,
      createdAt: a.createdAt,
    }));

    res.status(200).json({ animals: result, total, page: Number(page), totalPages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single animal record
exports.getAnimalById = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id)
      .populate('case', 'caseId fullName age sex address contact dateOfExposure exposureType');
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

    // Verify case exists
    const linkedCase = await Case.findById(caseId);
    if (!linkedCase) return res.status(404).json({ message: 'Case not found' });

    // Prevent duplicate animal record for same case
    const existing = await Animal.findOne({ case: caseId });
    if (existing) return res.status(400).json({ message: 'An animal record already exists for this case' });

    const newAnimal = await Animal.create({
      case: caseId,
      animalSpecies,
      animalOwnership,
      animalVaccinated,
      ownerName: animalOwnership === 'Owned' ? ownerName : null,
      ownerContact: animalOwnership === 'Owned' ? ownerContact : null,
      observationStartDate: observationStartDate || null,
      observationEndDate: observationEndDate || null,
      observationStatus,
      animalOutcome,
      dateOfOutcome: dateOfOutcome || null,
      remarks: remarks || null,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: 'Animal record created successfully', animal: newAnimal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update animal record
exports.updateAnimal = async (req, res) => {
  try {
    if (req.body.animalOwnership && req.body.animalOwnership !== 'Owned') {
      req.body.ownerName = null;
      req.body.ownerContact = null;
    }

    const updated = await Animal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Animal record not found' });
    res.status(200).json({ message: 'Animal record updated successfully', animal: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete animal record
exports.deleteAnimal = async (req, res) => {
  try {
    const deleted = await Animal.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Animal record not found' });
    res.status(200).json({ message: 'Animal record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stats
exports.getAnimalStats = async (req, res) => {
  try {
    const total                = await Animal.countDocuments({});
    const underObservation     = await Animal.countDocuments({ observationStatus: 'Under Observation' });
    const completedObservation = await Animal.countDocuments({ observationStatus: 'Completed Observation' });
    const lostToFollowUp       = await Animal.countDocuments({ observationStatus: 'Lost to Follow-up' });

    res.status(200).json({ total, underObservation, completedObservation, lostToFollowUp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};