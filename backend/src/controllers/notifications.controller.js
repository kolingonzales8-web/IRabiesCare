const Case        = require('../models/case.model');
const Patient     = require('../models/patient.model');
const Animal      = require('../models/animal.model');
const Vaccination = require('../models/vaccination.model');
const User        = require('../models/user.model');
const Notification = require('../models/notification.model'); // ← MOVED HERE

// ── In-memory SSE client registry ────────────────────────────────────────────
const clients = new Map();

exports.streamNotifications = (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  const userId = req.user.id.toString();
  clients.set(userId, { res, user: req.user });

  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(userId);
    console.log(`[SSE] Client disconnected: ${userId}`);
  });

  console.log(`[SSE] Client connected: ${userId} (${req.user.role})`);
};

exports.pushToUsers = (userIds, payload) => {
  const data = JSON.stringify(payload);
  userIds.forEach(uid => {
    const client = clients.get(uid.toString());
    if (client) {
      client.res.write(`event: notification\ndata: ${data}\n\n`);
    }
  });
};

exports.getConnectedAdminIds = () => {
  const adminIds = [];
  clients.forEach((client, uid) => {
    if (client.user.role === 'admin') adminIds.push(uid);
  });
  return adminIds;
};

exports.getNotificationCounts = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const today = { $gte: startOfDay, $lte: endOfDay };

    const userId  = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const caseWhere = isAdmin ? {} : { assignedTo: userId };

    const scopedCases      = await Case.find(caseWhere).select('_id');
    const scopedCaseIds    = scopedCases.map(c => c._id);
    const scopedPatients   = await Patient.find({ caseId: { $in: scopedCaseIds } }).select('_id');
    const scopedPatientIds = scopedPatients.map(p => p._id);

    const [newCases, newPatients, newAnimals, newVaccinations, newUsers] = await Promise.all([
      Case.countDocuments({ ...caseWhere, createdAt: today, createdBy: { $ne: userId } }),
      Patient.countDocuments({ caseId: { $in: scopedCaseIds }, createdAt: today }),
      Animal.countDocuments({ caseId: { $in: scopedCaseIds }, createdAt: today, createdBy: { $ne: userId } }),
      Vaccination.countDocuments({ patientId: { $in: scopedPatientIds }, createdAt: today, createdBy: { $ne: userId } }),
      isAdmin ? User.countDocuments({ createdAt: today }) : Promise.resolve(0),
    ]);

    res.status(200).json({
      cases: newCases, patients: newPatients, animals: newAnimals,
      vaccinations: newVaccinations, users: newUsers,
    });
  } catch (error) {
    console.error('[notifications] getNotificationCounts error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/notifications — scoped by role ───────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const userId  = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const query = isAdmin
      ? {}
      : { recipients: userId };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PATCH /api/notifications/read-all ────────────────────────────────────────
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};