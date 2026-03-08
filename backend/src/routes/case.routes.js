const express = require('express');
const router = express.Router();
const caseController = require('../controllers/case.controller');
const { protect } = require('../middlewares/auth.middleware');

// ── Stats & Trend (must be before /:id to avoid route conflict) ───────────────

router.get('/stats', protect, caseController.getCaseStats);
router.get('/trend', protect, caseController.getCaseTrend);      // ← added
router.get('/my',    protect, caseController.getMyCases);
router.get('/',      protect, caseController.getAllCases);
router.get('/:id',   protect, caseController.getCaseById);
router.post('/',     protect, caseController.createCase);
router.put('/:id',   protect, caseController.updateCase);
router.delete('/:id',protect, caseController.deleteCase);

module.exports = router;