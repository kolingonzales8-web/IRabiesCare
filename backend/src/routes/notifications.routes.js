const express                 = require('express');
const router                  = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { protect }             = require('../middlewares/auth.middleware');

// GET /api/notifications/stream  — SSE real-time connection
router.get('/stream', protect, notificationsController.streamNotifications);

// GET /api/notifications/counts  — initial hydration on page load
router.get('/counts', protect, notificationsController.getNotificationCounts);

module.exports = router;