const Patient = require('../models/Patient');
const Condition = require('../models/Condition');
const RiskScore = require('../models/RiskScore');
const { calculatePatientRisk } = require('../services/riskEngine');
const { logAudit } = require('../middleware/audit');

// @desc    Calculate or recalculate risk score for a patient
// @route   POST /api/v1/risk/calculate/:patientId
// @access  Private (Worker / Admin)
const calculateRisk = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const riskResult = await calculatePatientRisk(patientId);

    await logAudit(req.user._id, 'RISK_CALCULATE', 'RiskScore', riskResult._id, {
      patientId,
      score: riskResult.score,
      category: riskResult.category
    });

    res.json({
      success: true,
      message: 'Risk score recalculated successfully.',
      riskScore: riskResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get ranked list of patients by risk score
// @route   GET /api/v1/risk/patients
// @access  Private
const getRiskPatients = async (req, res, next) => {
  try {
    const { conditionId, category, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };
    if (conditionId) filter.primaryCondition = conditionId;
    if (category) filter.currentRiskCategory = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Patient.countDocuments(filter);

    const patients = await Patient.find(filter)
      .populate('primaryCondition', 'name code')
      .populate('villageId', 'name district')
      .populate('assignedWorkerId', 'name')
      .sort({ currentRiskScore: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: patients.length,
      total,
      patients
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current risk engine configuration & weights
// @route   GET /api/v1/risk/configuration
// @access  Private
const getConfiguration = async (req, res, next) => {
  try {
    const conditions = await Condition.find({ enabled: true });
    res.json({
      success: true,
      conditions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update risk engine configuration for a condition
// @route   PATCH /api/v1/risk/configuration/:conditionId
// @access  Private (Admin only)
const updateConfiguration = async (req, res, next) => {
  try {
    const { conditionId } = req.params;
    const condition = await Condition.findByIdAndUpdate(conditionId, req.body, { new: true });

    if (!condition) {
      return res.status(404).json({ success: false, message: 'Condition not found' });
    }

    await logAudit(req.user._id, 'RISK_CONFIG_UPDATE', 'Condition', condition._id);

    res.json({
      success: true,
      message: 'Risk configuration updated successfully.',
      condition
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculateRisk,
  getRiskPatients,
  getConfiguration,
  updateConfiguration
};
