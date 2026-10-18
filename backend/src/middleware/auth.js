const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token is missing.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nirantar_secret_key');
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.'
    });
  }
};

module.exports = { protect };
