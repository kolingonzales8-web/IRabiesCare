const Case = require('../models/case.model');

// Admin: Get ALL cases from ALL patients (no createdBy filter)
exports.getAllCasesAdmin = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {};

    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { caseId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Case.countDocuments(query);
    const cases = await Case.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

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

// Patient: Get only their own cases
exports.getAllCases = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = { createdBy: req.user._id };

    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { caseId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Case.countDocuments(query);
    const cases = await Case.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

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

// Patient dashboard: Get own cases (no pagination)
exports.getMyCases = async (req, res) => {
  try {
    const cases = await Case.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });
    res.status(200).json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single case by ID — no ownership check so admin can view any case
exports.getCaseById = async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    res.status(200).json(caseItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new case
exports.createCase = async (req, res) => {
  try {
    const newCase = await Case.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json({
      message: 'Case registered successfully',
      case: newCase,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update case — no ownership check so admin can update any case
exports.updateCase = async (req, res) => {
  try {
    const updated = await Case.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Case not found' });
    res.status(200).json({
      message: 'Case updated successfully',
      case: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete case — no ownership check so admin can delete any case
exports.deleteCase = async (req, res) => {
  try {
    const deleted = await Case.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Case not found' });
    res.status(200).json({ message: 'Case deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stats — all cases system-wide
exports.getCaseStats = async (req, res) => {
  try {
    const total     = await Case.countDocuments({});
    const ongoing   = await Case.countDocuments({ status: 'Ongoing' });
    const completed = await Case.countDocuments({ status: 'Completed' });
    const pending   = await Case.countDocuments({ status: 'Pending' });
    const urgent    = await Case.countDocuments({ status: 'Urgent' });

    res.status(200).json({ total, ongoing, completed, pending, urgent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};