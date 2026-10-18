const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { ROLES } = require('../config/constants');

// @desc    Get users list with role filter
// @route   GET /api/v1/users
// @access  Private (Admin / Workers)
const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = { isActive: true };
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-passwordHash')
      .populate('assignedVillageIds', 'name district')
      .populate('assignedFacilityId', 'name')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit logs
// @route   GET /api/v1/audit-logs
// @access  Private (Admin only)
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getAuditLogs
};
