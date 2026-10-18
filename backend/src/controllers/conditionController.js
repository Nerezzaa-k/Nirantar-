const Condition = require('../models/Condition');

// @desc    Get all supported conditions
// @route   GET /api/v1/conditions
// @access  Public / Authenticated
const getConditions = async (req, res, next) => {
  try {
    const conditions = await Condition.find().sort({ name: 1 });
    res.json({
      success: true,
      conditions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new condition
// @route   POST /api/v1/conditions
// @access  Private (Admin)
const createCondition = async (req, res, next) => {
  try {
    const condition = await Condition.create(req.body);
    res.status(201).json({
      success: true,
      condition
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update condition
// @route   PATCH /api/v1/conditions/:id
// @access  Private (Admin)
const updateCondition = async (req, res, next) => {
  try {
    const condition = await Condition.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!condition) {
      return res.status(404).json({ success: false, message: 'Condition not found' });
    }
    res.json({
      success: true,
      condition
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConditions,
  createCondition,
  updateCondition
};
