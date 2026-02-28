const express = require('express');
const router = express.Router();
const caseController = require('../controllers/case.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/all', protect, caseController.getAllCasesAdmin); // admin sees all patients' cases
router.get('/stats', protect, caseController.getCaseStats);
router.get('/my', protect, caseController.getMyCases);        // patient sees own cases only
router.get('/', protect, caseController.getAllCases);
router.get('/:id', protect, caseController.getCaseById);
router.post('/', protect, caseController.createCase);
router.put('/:id', protect, caseController.updateCase);
router.delete('/:id', protect, caseController.deleteCase);

module.exports = router;