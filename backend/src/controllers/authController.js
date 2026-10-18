const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const { ROLES } = require('../config/constants');
const { logAudit } = require('../middleware/audit');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'nirantar_secret_key', {
    expiresIn: '7d'
  });
};

// @desc    Register new authorized user
// @route   POST /api/v1/auth/register
// @access  Public (or Admin protected in prod)
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, assignedVillageIds, assignedFacilityId, patientId, linkedPatientIds } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: role || ROLES.HEALTHCARE_WORKER,
      assignedVillageIds: assignedVillageIds || [],
      assignedFacilityId,
      patientId,
      linkedPatientIds: linkedPatientIds || [],
      preferences: {
        notifications: true,
        theme: 'light',
        smsAlerts: true
      }
    });

    const token = generateToken(user._id);
    await logAudit(user._id, 'USER_REGISTER', 'User', user._id, { role: user.role, email: user.email });

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('patientId')
      .populate('linkedPatientIds');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const token = generateToken(user._id);
    await logAudit(user._id, 'USER_LOGIN', 'User', user._id, { role: user.role });

    res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = async (req, res) => {
  if (req.user) {
    await logAudit(req.user._id, 'USER_LOGOUT', 'User', req.user._id);
  }
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
};

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('assignedVillageIds')
      .populate('assignedFacilityId')
      .populate('patientId')
      .populate('linkedPatientIds');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile & preferences (theme, notifications)
// @route   PATCH /api/v1/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.body.preferences) {
      updates.preferences = {
        ...req.user.preferences?.toObject(),
        ...req.body.preferences
      };
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    await logAudit(req.user._id, 'USER_UPDATE_PROFILE', 'User', req.user._id);

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password mock/handler
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  res.json({
    success: true,
    message: `Password reset link sent to ${email || 'your email'} (Simulated in prototype mode).`
  });
};

// @desc    Reset password mock/handler
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  res.json({
    success: true,
    message: 'Password has been reset successfully. You may now login.'
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword
};
