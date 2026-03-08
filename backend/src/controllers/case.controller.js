const { Op, fn, col, literal } = require('sequelize');
const Case = require('../models/case.model');

// Staff/Admin: Get cases based on role
exports.getAllCases = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, unassigned } = req.query;

    const where = req.user.role === 'admin'
      ? {}
      : { assignedTo: req.user.id };

    // ✅ Unassigned filter — admin only
    if (unassigned === 'true') {
      where.assignedTo = null;
    }

    if (status && status !== 'All') where.status = status;
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { caseId:   { [Op.like]: `%${search}%` } },
      ];
    }

    const total = await Case.count({ where });
    const cases = await Case.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit:  Number(limit),
      offset: (page - 1) * limit,
    });

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
    const cases = await Case.findAll({
      where: { patientUserId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single case
exports.getCaseById = async (req, res) => {
  try {
    const caseItem = await Case.findByPk(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    res.status(200).json(caseItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create case — supports optional walk-in mobile account creation
exports.createCase = async (req, res) => {
  try {
    const {
      createAccount,
      accountEmail,
      accountPassword,
      ...caseFields
    } = req.body;

    const newCase = await Case.create({
      ...caseFields,
      createdBy: req.user.id,
      // ✅ If staff creates a case, auto-assign to themselves
      assignedTo: caseFields.assignedTo || (req.user.role === 'staff' ? req.user.id : null),
    });

    if (createAccount && accountEmail && accountPassword) {
      const User = require('../models/user.model');

      const existing = await User.findOne({ where: { email: accountEmail } });
      if (existing) {
        return res.status(201).json({
          message:        'Case registered successfully, but that email already has an account. Please use a different email.',
          case:           newCase,
          accountCreated: false,
        });
      }

      const newUser = await User.create({
        name:     caseFields.fullName,
        email:    accountEmail,
        password: accountPassword,
        role:     'user',
      });

      await newCase.update({ patientUserId: newUser.id });

      return res.status(201).json({
        message:        'Case registered and mobile account created successfully',
        case:           newCase,
        accountCreated: true,
      });
    }

    res.status(201).json({
      message:        'Case registered successfully',
      case:           newCase,
      accountCreated: false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update case
exports.updateCase = async (req, res) => {
  try {
    const caseItem = await Case.findByPk(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });

    await caseItem.update(req.body);
    res.status(200).json({
      message: 'Case updated successfully',
      case: caseItem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete case
exports.deleteCase = async (req, res) => {
  try {
    const caseItem = await Case.findByPk(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });

    await caseItem.destroy();
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
        Case.count({ where: caseWhere }),
        Case.count({ where: { ...caseWhere, status: 'Ongoing'   } }),
        Case.count({ where: { ...caseWhere, status: 'Completed' } }),
        Case.count({ where: { ...caseWhere, status: 'Pending'   } }),
        Case.count({ where: { ...caseWhere, status: 'Urgent'    } }),
        Patient.count({ where: { woundCategory: 'Category I'   } }),
        Patient.count({ where: { woundCategory: 'Category II'  } }),
        Patient.count({ where: { woundCategory: 'Category III' } }),
      ]);

    res.status(200).json({
      total, ongoing, completed, pending, urgent,
      categoryI, categoryII, categoryIII,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Trend — scoped by role
exports.getCaseTrend = async (req, res) => {
  try {
    const Vaccination = require('../models/vaccination.model');
    const { period = 'monthly' } = req.query;

    const formatMap = {
      daily:   '%a',
      monthly: '%b',
      yearly:  '%Y',
    };
    const fmt = formatMap[period] || '%b';

    const caseWhere = req.user.role === 'admin' ? {} : { assignedTo: req.user.id };

    const [caseCounts, vaccRows] = await Promise.all([
      Case.findAll({
        attributes: [
          [fn('DATE_FORMAT', col('createdAt'), fmt), 'name'],
          [fn('COUNT', col('id')), 'cases'],
          [fn('MIN', col('createdAt')), 'sortKey'],
        ],
        where: caseWhere,
        group: [fn('DATE_FORMAT', col('createdAt'), fmt)],
        order: [[fn('MIN', col('createdAt')), 'ASC']],
        raw: true,
      }),

      Vaccination.findAll({
        attributes: [
          [fn('DATE_FORMAT', col('createdAt'), fmt), 'name'],
          [fn('COUNT', col('id')), 'vaccinated'],
          [fn('SUM', literal("CASE WHEN status = 'Completed' THEN 1 ELSE 0 END")), 'completed'],
          [fn('MIN', col('createdAt')), 'sortKey'],
        ],
        group: [fn('DATE_FORMAT', col('createdAt'), fmt)],
        order: [[fn('MIN', col('createdAt')), 'ASC']],
        raw: true,
      }),
    ]);

    const map = {};

    caseCounts.forEach(r => {
      map[r.name] = {
        name:       r.name,
        sortKey:    r.sortKey,
        cases:      Number(r.cases) || 0,
        vaccinated: 0,
        completed:  0,
      };
    });

    vaccRows.forEach(r => {
      if (map[r.name]) {
        map[r.name].vaccinated = Number(r.vaccinated) || 0;
        map[r.name].completed  = Number(r.completed)  || 0;
      } else {
        map[r.name] = {
          name:       r.name,
          sortKey:    r.sortKey,
          cases:      0,
          vaccinated: Number(r.vaccinated) || 0,
          completed:  Number(r.completed)  || 0,
        };
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