const Village = require('../models/Village');
const Facility = require('../models/Facility');

// @desc    Get villages list
// @route   GET /api/v1/villages
// @access  Public / Authenticated
const getVillages = async (req, res, next) => {
  try {
    const villages = await Village.find().populate('facilityId').sort({ name: 1 });
    res.json({
      success: true,
      villages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get facilities list
// @route   GET /api/v1/facilities
// @access  Public / Authenticated
const getFacilities = async (req, res, next) => {
  try {
    const facilities = await Facility.find().sort({ name: 1 });
    res.json({
      success: true,
      facilities
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVillages,
  getFacilities
};
