const Intervention = require('../models/Intervention');
const Patient = require('../models/Patient');
const MedicineStock = require('../models/MedicineStock');
const { REASON_TO_ACTION_MAPPING, INTERVENTION_STATUS } = require('../config/constants');

/**
 * Maps reported reason to recommended intervention and creates an actionable intervention task.
 */
const createInterventionFromReason = async ({
  patientId,
  conditionId,
  checkInId = null,
  reportedReason,
  additionalNotes = '',
  assignedWorkerId = null
}) => {
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new Error('Patient not found');
  }

  const assignedTo = assignedWorkerId || patient.assignedWorkerId;

  // Retrieve mapping or fallback
  const mapping = REASON_TO_ACTION_MAPPING[reportedReason] || {
    recommendedAction: 'Schedule human follow-up to understand the barrier',
    interventionType: 'human_followup',
    priority: 'medium',
    requiresMedicalReview: false
  };

  let recommendedAction = mapping.recommendedAction;
  let priority = mapping.priority;
  let interventionType = mapping.interventionType;

  // Special safety & context rules:
  // 1. Medicine unavailable: check if alternative facility has stock
  if (reportedReason === 'Medicine is unavailable' && patient.facilityId) {
    const alternativeStock = await MedicineStock.findOne({
      facilityId: { $ne: patient.facilityId },
      quantityAvailable: { $gt: 20 },
      isStockout: false
    }).populate('facilityId');

    if (alternativeStock && alternativeStock.facilityId) {
      recommendedAction = `Identified alternate stock at ${alternativeStock.facilityId.name} (${alternativeStock.quantityAvailable} units). Escalate stock replenishment to district pharmacist.`;
    } else {
      recommendedAction = 'All nearby facilities low on stock. Escalate urgent stock procurement to District Medical Officer.';
    }
  }

  // 2. Side effects: Escalate immediately to Medical Officer
  if (reportedReason === 'I am experiencing side effects') {
    priority = 'urgent';
    interventionType = 'clinical_escalation';
    recommendedAction = 'ALERT: Patient experiencing adverse side effects. Immediately alert Medical Officer for clinical review. Do not change dosage or stop medication without doctor review.';
  }

  // 3. Due date calculation based on priority
  const dueDate = new Date();
  if (priority === 'urgent') {
    dueDate.setHours(dueDate.getHours() + 24); // 24 hours
  } else if (priority === 'high') {
    dueDate.setDate(dueDate.getDate() + 3); // 3 days
  } else {
    dueDate.setDate(dueDate.getDate() + 7); // 7 days
  }

  const intervention = await Intervention.create({
    patientId: patient._id,
    conditionId: conditionId || patient.primaryCondition,
    checkInId,
    reportedReason,
    interventionType,
    recommendedAction,
    assignedTo,
    priority,
    status: INTERVENTION_STATUS.ASSIGNED,
    dueDate,
    notes: additionalNotes ? `Patient note: "${additionalNotes}"` : undefined
  });

  return intervention;
};

module.exports = {
  createInterventionFromReason,
  REASON_TO_ACTION_MAPPING
};
