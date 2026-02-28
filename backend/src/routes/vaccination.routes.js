const express = require('express');
const router = express.Router();
const vaccinationController = require('../controllers/vaccination.controller');
const { protect } = require('../middlewares/auth.middleware');

// All routes protected
router.get('/stats', protect, vaccinationController.getVaccinationStats);
router.get('/my', protect, vaccinationController.getMyVaccinations);     // ← new
router.get('/', protect, vaccinationController.getAllVaccinations);
router.get('/:id', protect, vaccinationController.getVaccinationById);
router.post('/', protect, vaccinationController.createVaccination);
router.put('/:id', protect, vaccinationController.updateVaccination);
router.delete('/:id', protect, vaccinationController.deleteVaccination);

module.exports = router;