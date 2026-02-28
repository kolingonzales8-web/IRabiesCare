const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/stats', protect, patientController.getPatientStats);
router.get('/my', protect, patientController.getMyPatients);   // mobile: own patients
router.get('/', protect, patientController.getAllPatients);
router.get('/:id', protect, patientController.getPatientById);
router.post('/', protect, patientController.createPatient);
router.put('/:id', protect, patientController.updatePatient);
router.delete('/:id', protect, patientController.deletePatient);

module.exports = router;