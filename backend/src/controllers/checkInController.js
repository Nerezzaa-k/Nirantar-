const CheckIn = require('../models/CheckIn');
const Patient = require('../models/Patient');
const { createInterventionFromReason } = require('../services/reasonActionService');
const { calculatePatientRisk } = require('../services/riskEngine');
const { logAudit } = require('../middleware/audit');

// @desc    Submit weekly patient check-in
// @route   POST /api/v1/checkins
// @access  Private (Patient, Caregiver, Worker)
const createCheckIn = async (req, res, next) => {
  try {
    const {
      patientId,
      conditionId,
      reportedSymptomsOrConcerns,
      medicineAvailable,
      tabletsRemaining,
      selectedReason,
      additionalNotes
    } = req.body;

    // Use token patientId if authenticated as patient
    const targetPatientId = req.user.role === 'patient' && req.user.patientId
      ? req.user.patientId
      : patientId;

    if (!targetPatientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required.'
      });
    }

    const patient = await Patient.findById(targetPatientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const checkIn = await CheckIn.create({
      patientId: targetPatientId,
      conditionId: conditionId || patient.primaryCondition,
      reportedSymptomsOrConcerns: reportedSymptomsOrConcerns || 'I feel fine',
      medicineAvailable: medicineAvailable !== undefined ? medicineAvailable : true,
      tabletsRemaining: tabletsRemaining !== undefined ? tabletsRemaining : 10,
      selectedReason: selectedReason || (medicineAvailable === false ? 'Medicine is unavailable' : undefined),
      additionalNotes: additionalNotes || '',
      submittedBy: req.user.role === 'caregiver' ? 'caregiver' : req.user.role === 'healthcare_worker' ? 'worker' : 'patient',
      submittedAt: new Date()
    });

    let createdIntervention = null;

    // If patient reported a barrier or needs help, immediately generate rescue intervention
    if (checkIn.selectedReason || reportedSymptomsOrConcerns === 'I need help' || reportedSymptomsOrConcerns === 'I have symptoms or concerns') {
      const reasonToRescue = checkIn.selectedReason || (reportedSymptomsOrConcerns === 'I need help' ? 'Other' : 'I am experiencing side effects');

      createdIntervention = await createInterventionFromReason({
        patientId: patient._id,
        conditionId: checkIn.conditionId,
        checkInId: checkIn._id,
        reportedReason: reasonToRescue,
        additionalNotes: checkIn.additionalNotes,
        assignedWorkerId: patient.assignedWorkerId
      });
    }

    // Recalculate patient risk score dynamically
    const updatedRisk = await calculatePatientRisk(patient._id);

    await logAudit(req.user._id, 'CHECKIN_SUBMIT', 'CheckIn', checkIn._id, {
      patientId: patient._id,
      reason: checkIn.selectedReason,
      symptoms: checkIn.reportedSymptomsOrConcerns
    });

    res.status(201).json({
      success: true,
      message: 'Check-in recorded successfully. Your care team has received your updates.',
      checkIn,
      intervention: createdIntervention,
      currentRiskScore: updatedRisk.score,
      currentRiskCategory: updatedRisk.category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get check-in history
// @route   GET /api/v1/checkins
// @access  Private
const getCheckIns = async (req, res, next) => {
  try {
    const { patientId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (patientId) filter.patientId = patientId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await CheckIn.countDocuments(filter);

    const checkIns = await CheckIn.find(filter)
      .populate('patientId', 'name patientCode')
      .populate('conditionId', 'name')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: checkIns.length,
      total,
      checkIns
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCheckIn,
  getCheckIns
};
