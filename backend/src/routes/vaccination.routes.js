const express = require('express');
const router = express.Router();
const vaccinationController = require('../controllers/vaccination.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/stats',    protect, vaccinationController.getVaccinationStats);
router.get('/upcoming', protect, vaccinationController.getUpcomingVaccinations); // ← added
router.get('/my',       protect, vaccinationController.getMyVaccinations);
router.get('/',         protect, vaccinationController.getAllVaccinations);
router.get('/:id',      protect, vaccinationController.getVaccinationById);
router.post('/',        protect, vaccinationController.createVaccination);
router.put('/:id',      protect, vaccinationController.updateVaccination);
router.delete('/:id',   protect, vaccinationController.deleteVaccination);

module.exports = router;