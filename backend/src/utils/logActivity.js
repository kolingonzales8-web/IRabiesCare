const ActivityLog = require('../models/activityLog.model');

/**
 * Log an activity to the database.
 *
 * @param {Object} params
 * @param {'CREATE'|'UPDATE'|'DELETE'|'LOGIN'|'LOGOUT'|'ASSIGN'|'STATUS_CHANGE'|'PASSWORD_RESET'} params.action
 * @param {'Case'|'Patient'|'Vaccination'|'Animal'|'User'|'Auth'} params.module
 * @param {string} params.description - Human readable description
 * @param {Object} [params.user] - req.user object
 * @param {string} [params.targetId] - ID of the affected record
 * @param {string} [params.targetName] - Name/label of the affected record
 * @param {Object} [params.req] - Express request (for IP)
 */
async function logActivity({
  action,
  module,
  description,
  user = null,
  targetId = null,
  targetName = null,
  req = null,
}) {
  try {
    const ip = req
      ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null)
      : null;

    await ActivityLog.create({
      action,
      module,
      description,
      performedBy:     user?._id  || null,   // ← changed: id → _id
      performedByName: user?.name || 'System',
      performedByRole: user?.role || 'system',
      targetId,
      targetName,
      ipAddress: ip,
    });
  } catch (err) {
    // Never let logging break the main request
    console.error('logActivity error:', err.message);
  }
}

module.exports = logActivity;