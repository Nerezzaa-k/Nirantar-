const MedicationRefill = require('../models/MedicationRefill');
const Patient = require('../models/Patient');
const { calculatePatientRisk } = require('../services/riskEngine');
const { logAudit } = require('../middleware/audit');

// @desc    Get refills
// @route   GET /api/v1/refills
// @access  Private
const getRefills = async (req, res, next) => {
  try {
    const { patientId, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await MedicationRefill.countDocuments(filter);

    const refills = await MedicationRefill.find(filter)
      .populate('patientId', 'name patientCode villageId phone')
      .populate('conditionId', 'name code')
      .sort({ refillDueDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: refills.length,
      total,
      refills
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record new refill
// @route   POST /api/v1/refills
// @access  Private
const createRefill = async (req, res, next) => {
  try {
    const {
      patientId,
      conditionId,
      medicationName,
      quantity = 30,
      refillDueDate,
      refillDate,
      status = 'collected',
      stockSource
    } = req.body;

    const refill = await MedicationRefill.create({
      patientId,
      conditionId,
      medicationName,
      quantity,
      refillDueDate,
      refillDate: refillDate || (status === 'collected' ? new Date() : null),
      status,
      stockSource: stockSource || 'Primary Health Centre'
    });

    await calculatePatientRisk(patientId);
    await logAudit(req.user._id, 'REFILL_CREATE', 'MedicationRefill', refill._id, { patientId, status });

    res.status(201).json({
      success: true,
      refill
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update refill status (e.g. mark collected or delivered)
// @route   PATCH /api/v1/refills/:id
// @access  Private
const updateRefill = async (req, res, next) => {
  try {
    const { status, refillDate } = req.body;
    const updates = { status };
    if (status === 'collected' || status === 'doorstep_delivered') {
      updates.refillDate = refillDate || new Date();
    }

    const refill = await MedicationRefill.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!refill) {
      return res.status(404).json({ success: false, message: 'Refill record not found' });
    }

    await calculatePatientRisk(refill.patientId);
    await logAudit(req.user._id, 'REFILL_UPDATE', 'MedicationRefill', refill._id, { status });

    res.json({
      success: true,
      refill
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRefills,
  createRefill,
  updateRefill
};
