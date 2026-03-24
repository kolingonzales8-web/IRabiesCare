const Case                 = require('../models/case.model');
const logActivity          = require('../utils/logActivity');
const { cloudinary }       = require('../config/cloudinary');
const sendPushNotification = require('../utils/sendPushNotification');
const User                 = require('../models/user.model');

// Human-readable status messages for patients
const STATUS_MESSAGES = {
  'Pending':   'Your rabies case report has been received and is pending review.',
  'Ongoing':   'Your case is now under observation. Please follow your health center\'s instructions.',
  'Urgent':    'Your case has been marked as urgent. Please visit your health center immediately.',
  'Completed': 'Your rabies case has been marked as completed. Stay safe!',
};

// Staff/Admin: Get cases based on role
exports.getAllCases = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, unassigned } = req.query;

    const where = req.user.role === 'admin' ? {} : { assignedTo: req.user.id };

    if (unassigned === 'true') where.assignedTo = null;
    if (status && status !== 'All') where.status = status;

    if (search) {
      where.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { caseId:   { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Case.countDocuments(where);
    const cases = await Case.find(where)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit);

    res.status(200).json({
      cases,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mobile: Get own cases (no pagination)
exports.getMyCases = async (req, res) => {
  try {
    const cases = await Case.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single case
exports.getCaseById = async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    res.status(200).json(caseItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create case — supports optional walk-in mobile account creation + Cloudinary upload
exports.createCase = async (req, res) => {
  try {
    const { createAccount, accountEmail, accountPassword, ...caseFields } = req.body;

    const documentUrl = req.file?.path || req.file?.secure_url || null;

    const sanitized = {
      ...caseFields,
      email:            caseFields.email            || null,
      bodyPartAffected: caseFields.bodyPartAffected || null,
      animalVaccinated: caseFields.animalVaccinated || null,
      woundBleeding:    caseFields.woundBleeding    || null,
      woundWashed:      caseFields.woundWashed      || null,
      assignedTo:       caseFields.assignedTo       || null,
      documentUrl,
    };

    const newCase = await Case.create({
      ...sanitized,
      createdBy:     req.user.id,
      assignedTo:    sanitized.assignedTo || (req.user.role === 'staff' ? req.user.id : null),
      // ✅ FIX: automatically link case to the logged-in mobile user
      patientUserId: req.user.role === 'user' ? req.user.id : null,
    });

   

    await logActivity({
      action: 'CREATE', module: 'Case',
      description: `New case registered for ${caseFields.fullName}`,
      user: req.user,
      targetId: newCase._id,
      targetName: `Case #${newCase.caseId} - ${caseFields.fullName}`,
      req,
    });

    if (createAccount && accountEmail && accountPassword) {
      const User = require('../models/user.model');

      const existing = await User.findOne({ email: accountEmail });
      if (existing) {
        return res.status(201).json({
          message: 'Case registered successfully, but that email already has an account. Please use a different email.',
          case: newCase, accountCreated: false,
        });
      }

      const newUser = await User.create({
        name: caseFields.fullName, email: accountEmail, password: accountPassword, role: 'user',
      });

      newCase.patientUserId = newUser._id;
      await newCase.save();

      await logActivity({
        action: 'CREATE', module: 'User',
        description: `Mobile account created for walk-in patient: ${caseFields.fullName}`,
        user: req.user, targetId: newUser._id, targetName: caseFields.fullName, req,
      });

      return res.status(201).json({
        message: 'Case registered and mobile account created successfully',
        case: newCase, accountCreated: true,
      });
    }

    res.status(201).json({ message: 'Case registered successfully', case: newCase, accountCreated: false });
  } catch (error) {
    console.error('createCase error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Update case — also handles new document upload
exports.updateCase = async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });

    const oldStatus   = caseItem.status;
    const oldAssigned = caseItem.assignedTo?.toString();

    // If new file uploaded, delete old one from Cloudinary first
    if (req.file && caseItem.documentUrl) {
      try {
        const publicId = caseItem.documentUrl.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
      } catch (e) {
        console.error('Cloudinary delete error:', e.message);
      }
    }

    const sanitized = {
      ...req.body,
      email:            req.body.email            || null,
      bodyPartAffected: req.body.bodyPartAffected || null,
      animalVaccinated: req.body.animalVaccinated || null,
      woundBleeding:    req.body.woundBleeding    || null,
      woundWashed:      req.body.woundWashed      || null,
      numberOfWounds:   req.body.numberOfWounds !== '' ? Number(req.body.numberOfWounds) : null,
      assignedTo:       req.body.assignedTo       || null,
      ...(req.file && { documentUrl: req.file?.path || req.file?.secure_url }),
    };

    Object.assign(caseItem, sanitized);
    await caseItem.save();

    if (sanitized.status && sanitized.status !== oldStatus) {
      await logActivity({
        action: 'STATUS_CHANGE', module: 'Case',
        description: `Case #${caseItem.caseId} status changed from ${oldStatus} to ${sanitized.status}`,
        user: req.user, targetId: caseItem._id,
        targetName: `Case #${caseItem.caseId} - ${caseItem.fullName}`, req,
      });

      // ── Push notification to patient on status change ──────────────────────
      try {
        if (caseItem.patientUserId) {
          const patient = await User.findById(caseItem.patientUserId).select('pushToken name');
          if (patient?.pushToken) {
            const message = STATUS_MESSAGES[sanitized.status]
              ?? `Your case status has been updated to: ${sanitized.status}.`;
            await sendPushNotification(
              patient.pushToken,
              'Case Status Update',
              message,
              { type: 'case_status_update', caseId: caseItem._id.toString(), status: sanitized.status }
            );
            console.log(`[Push] Notified ${patient.name} — status: ${sanitized.status}`);
          } else {
            console.log(`[Push] Patient has no pushToken — skipping notification`);
          }
        } else {
          console.log(`[Push] No patientUserId on case — skipping notification`);
        }
      } catch (notifErr) {
        console.error('[Push] Failed to notify patient:', notifErr.message);
      }
      // ──────────────────────────────────────────────────────────────────────
    }

    if (sanitized.assignedTo && sanitized.assignedTo !== oldAssigned) {
      await logActivity({
        action: 'ASSIGN', module: 'Case',
        description: `Case #${caseItem.caseId} reassigned`,
        user: req.user, targetId: caseItem._id,
        targetName: `Case #${caseItem.caseId} - ${caseItem.fullName}`, req,
      });
    }

    if (!sanitized.status && !sanitized.assignedTo) {
      await logActivity({
        action: 'UPDATE', module: 'Case',
        description: `Case #${caseItem.caseId} details updated`,
        user: req.user, targetId: caseItem._id,
        targetName: `Case #${caseItem.caseId} - ${caseItem.fullName}`, req,
      });
    }

    res.status(200).json({ message: 'Case updated successfully', case: caseItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete case — also deletes Cloudinary document
exports.deleteCase = async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });

    if (caseItem.documentUrl) {
      try {
        const publicId = caseItem.documentUrl.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
      } catch (e) {
        console.error('Cloudinary delete error:', e.message);
      }
    }

    await logActivity({
      action: 'DELETE', module: 'Case',
      description: `Case #${caseItem.caseId} deleted (${caseItem.fullName})`,
      user: req.user, targetId: caseItem._id,
      targetName: `Case #${caseItem.caseId} - ${caseItem.fullName}`, req,
    });

    await caseItem.deleteOne();
    res.status(200).json({ message: 'Case deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stats — scoped by role
exports.getCaseStats = async (req, res) => {
  try {
    const Patient = require('../models/patient.model');
    const caseWhere = req.user.role === 'admin' ? {} : { assignedTo: req.user.id };

    const [total, ongoing, completed, pending, urgent, categoryI, categoryII, categoryIII] =
      await Promise.all([
        Case.countDocuments(caseWhere),
        Case.countDocuments({ ...caseWhere, status: 'Ongoing'   }),
        Case.countDocuments({ ...caseWhere, status: 'Completed' }),
        Case.countDocuments({ ...caseWhere, status: 'Pending'   }),
        Case.countDocuments({ ...caseWhere, status: 'Urgent'    }),
        Patient.countDocuments({ woundCategory: 'Category I'   }),
        Patient.countDocuments({ woundCategory: 'Category II'  }),
        Patient.countDocuments({ woundCategory: 'Category III' }),
      ]);

    res.status(200).json({ total, ongoing, completed, pending, urgent, categoryI, categoryII, categoryIII });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Trend — scoped by role
exports.getCaseTrend = async (req, res) => {
  try {
    const Vaccination = require('../models/vaccination.model');
    const { period = 'monthly' } = req.query;

    const groupFormat = {
      daily:   { $dayOfWeek: '$createdAt' },
      monthly: { $month: '$createdAt' },
      yearly:  { $year: '$createdAt' },
    };

    const nameFormat = {
      daily:   ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
      monthly: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    };

    const caseWhere = req.user.role === 'admin' ? {} : { assignedTo: req.user.id };

    const [caseCounts, vaccRows] = await Promise.all([
      Case.aggregate([
        { $match: caseWhere },
        { $group: { _id: groupFormat[period] || { $month: '$createdAt' }, cases: { $sum: 1 }, sortKey: { $min: '$createdAt' } } },
        { $sort: { sortKey: 1 } },
      ]),
      Vaccination.aggregate([
        { $group: {
          _id: groupFormat[period] || { $month: '$createdAt' },
          vaccinated: { $sum: 1 },
          completed:  { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          sortKey: { $min: '$createdAt' },
        }},
        { $sort: { sortKey: 1 } },
      ]),
    ]);

    const months = nameFormat[period] || null;
    const map = {};

    caseCounts.forEach(r => {
      const name = months ? (months[r._id - 1] || String(r._id)) : String(r._id);
      map[name] = { name, sortKey: r.sortKey, cases: r.cases, vaccinated: 0, completed: 0 };
    });

    vaccRows.forEach(r => {
      const name = months ? (months[r._id - 1] || String(r._id)) : String(r._id);
      if (map[name]) {
        map[name].vaccinated = r.vaccinated;
        map[name].completed  = r.completed;
      } else {
        map[name] = { name, sortKey: r.sortKey, cases: 0, vaccinated: r.vaccinated, completed: r.completed };
      }
    });

    const result = Object.values(map)
      .sort((a, b) => new Date(a.sortKey) - new Date(b.sortKey))
      .map(({ name, cases, vaccinated, completed }) => ({ name, cases, vaccinated, completed }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};