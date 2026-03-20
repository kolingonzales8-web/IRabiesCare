const express     = require('express');
const router      = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { chat }    = require('../controllers/chatbot.controller');

// POST /api/chat
router.post('/', protect, chat);

module.exports = router;