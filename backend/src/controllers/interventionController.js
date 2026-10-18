const Intervention = require('../models/Intervention');
const Outcome = require('../models/Outcome');
const Patient = require('../models/Patient');
const { calculatePatientRisk } = require('../services/riskEngine');
const { INTERVENTION_STATUS, ROLES } = require('../config/constants');
const { logAudit } = require('../middleware/audit');

// @desc    Get interventions with filtering
// @route   GET /api/v1/interventions
// @access  Private
const getInterventions = async (req, res, next) => {
  try {
    const { status, priority, patientId, assignedTo, page = 1, limit = 50 } = req.query;

    const filter = {};

    if (req.user.role === ROLES.PATIENT) {
      filter.patientId = req.user.patientId;
    } else if (req.user.role === ROLES.CAREGIVER) {
      filter.patientId = { $in: req.user.linkedPatientIds || [] };
    } else if (req.user.role === ROLES.HEALTHCARE_WORKER) {
      if (assignedTo === 'me') {
        filter.assignedTo = req.user._id;
      }
    }

    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (patientId) filter.patientId = patientId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Intervention.countDocuments(filter);

    const interventions = await Intervention.find(filter)
      .populate('patientId', 'name patientCode villageId phone currentRiskScore currentRiskCategory')
      .populate('conditionId', 'name code')
      .populate('assignedTo', 'name phone')
      .populate('outcomeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: interventions.length,
      total,
      page: parseInt(page),
      interventions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single intervention
// @route   GET /api/v1/interventions/:id
// @access  Private
const getInterventionById = async (req, res, next) => {
  try {
    const intervention = await Intervention.findById(req.params.id)
      .populate('patientId')
      .populate('conditionId')
      .populate('assignedTo', 'name phone email')
      .populate('outcomeId');

    if (!intervention) {
      return res.status(404).json({ success: false, message: 'Intervention not found' });
    }

    res.json({
      success: true,
      intervention
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create intervention manually
// @route   POST /api/v1/interventions
// @access  Private (Healthcare worker / Admin)
const createIntervention = async (req, res, next) => {
  try {
    const {
      patientId,
      conditionId,
      reportedReason,
      interventionType,
      recommendedAction,
      assignedTo,
      priority,
      dueDate,
      notes
    } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const intervention = await Intervention.create({
      patientId,
      conditionId: conditionId || patient.primaryCondition,
      reportedReason: reportedReason || 'General Follow-up',
      interventionType: interventionType || 'human_followup',
      recommendedAction: recommendedAction || 'Review adherence and barrier status',
      assignedTo: assignedTo || patient.assignedWorkerId || req.user._id,
      priority: priority || 'medium',
      status: INTERVENTION_STATUS.ASSIGNED,
      dueDate: dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes
    });

    await logAudit(req.user._id, 'INTERVENTION_CREATE', 'Intervention', intervention._id, {
      patientId,
      type: interventionType
    });

    res.status(201).json({
      success: true,
      intervention
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update intervention status & details
// @route   PATCH /api/v1/interventions/:id
// @access  Private
const updateIntervention = async (req, res, next) => {
  try {
    const { status, notes, assignedTo, dueDate } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (notes) updates.notes = notes;
    if (assignedTo) updates.assignedTo = assignedTo;
    if (dueDate) updates.dueDate = dueDate;

    if (status === INTERVENTION_STATUS.COMPLETED) {
      updates.completedAt = new Date();
    }

    const intervention = await Intervention.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).populate('patientId').populate('assignedTo', 'name');

    if (!intervention) {
      return res.status(404).json({ success: false, message: 'Intervention not found' });
    }

    await logAudit(req.user._id, 'INTERVENTION_UPDATE', 'Intervention', intervention._id, { status });

    res.json({
      success: true,
      intervention
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record outcome for an intervention (LEARN step)
// @route   POST /api/v1/interventions/:id/outcome
// @access  Private
const recordOutcome = async (req, res, next) => {
  try {
    const intervention = await Intervention.findById(req.params.id);
    if (!intervention) {
      return res.status(404).json({ success: false, message: 'Intervention not found' });
    }

    const {
      outcomeType,
      patientReached = true,
      treatmentResumedOrMaintained = true,
      notes
    } = req.body;

    const outcome = await Outcome.create({
      patientId: intervention.patientId,
      interventionId: intervention._id,
      outcomeType: outcomeType || 'treatment_resumed',
      patientReached: Boolean(patientReached),
      treatmentResumedOrMaintained: Boolean(treatmentResumedOrMaintained),
      recordedBy: req.user._id,
      notes: notes || 'Outcome verified by care worker',
      recordedAt: new Date()
    });

    // Mark intervention completed
    intervention.status = INTERVENTION_STATUS.COMPLETED;
    intervention.completedAt = new Date();
    intervention.outcomeId = outcome._id;
    if (notes) {
      intervention.notes = intervention.notes ? `${intervention.notes} | Outcome: ${notes}` : `Outcome: ${notes}`;
    }
    await intervention.save();

    // Recalculate patient risk score after rescue action!
    const updatedRisk = await calculatePatientRisk(intervention.patientId);

    await logAudit(req.user._id, 'OUTCOME_RECORD', 'Outcome', outcome._id, {
      interventionId: intervention._id,
      resumed: outcome.treatmentResumedOrMaintained
    });

    res.status(201).json({
      success: true,
      message: 'Intervention outcome recorded and patient risk recalculated.',
      outcome,
      intervention,
      newRiskScore: updatedRisk.score,
      newRiskCategory: updatedRisk.category
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInterventions,
  getInterventionById,
  createIntervention,
  updateIntervention,
  recordOutcome
};
