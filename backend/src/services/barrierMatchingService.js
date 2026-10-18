const SupportAction = require('../models/SupportAction');
const Barrier = require('../models/Barrier');
const Patient = require('../models/Patient');

/**
 * Standard rule-based Barrier-to-Support Action mapping table
 */
const BARRIER_RULES = {
  financial_difficulties: {
    actionType: 'financial_assistance_review',
    title: 'Financial Assistance & Welfare Review',
    suggestedAction: 'Review state healthcare subsidy eligibility (e.g., Ayushman Bharat/PM-JAY/BPL fee waiver) and connect with patient welfare coordinator.',
    recommendationReason: 'Patient reported financial difficulty purchasing medicines or affording visit costs.',
    priority: 'high',
    defaultDaysToDue: 3,
    assignedTeam: 'Patient Welfare & Social Work Team'
  },
  transportation_problems: {
    actionType: 'transportation_assistance',
    title: 'Transportation Support & Outreach Refill',
    suggestedAction: 'Coordinate community travel voucher or enroll patient in community doorstep refill outreach batch.',
    recommendationReason: 'Severe distance, washed-out roads, or lack of transport preventing clinic attendance.',
    priority: 'high',
    defaultDaysToDue: 2,
    assignedTeam: 'Community Logistics & Outreach'
  },
  medication_availability: {
    actionType: 'pharmacy_stock_escalation',
    title: 'Facility Medicine Stock Escalation',
    suggestedAction: 'Escalate stock requirement to Chief Pharmacist / PHC and identify buffer stock at adjacent sub-center.',
    recommendationReason: 'Patient reported medication stockout at primary health center dispensary.',
    priority: 'urgent',
    defaultDaysToDue: 1,
    assignedTeam: 'Pharmacy & Drug Supply'
  },
  reported_side_effects: {
    actionType: 'clinical_doctor_referral',
    title: 'Clinical Medical Officer Review',
    suggestedAction: 'Schedule urgent clinical tele-consultation or clinic review with medical officer to evaluate dosage and adverse effects.',
    recommendationReason: 'Reported adverse side effects require immediate evaluation by a qualified medical professional.',
    priority: 'urgent',
    defaultDaysToDue: 1,
    assignedTeam: 'Clinical Medical Officers'
  },
  lack_of_awareness: {
    actionType: 'treatment_literacy_counseling',
    title: 'Treatment Adherence Literacy Counseling',
    suggestedAction: 'Conduct personalized counseling session explaining long-term therapy benefits and risks of asymptomatic discontinuation.',
    recommendationReason: 'Patient reported feeling healthy or expressed skepticism about continuing daily regimen.',
    priority: 'medium',
    defaultDaysToDue: 5,
    assignedTeam: 'Health Educators & Counselors'
  },
  forgotten_appointments: {
    actionType: 'automated_reminder_plan',
    title: 'Automated Reminders & Rescheduling',
    suggestedAction: 'Set up multi-channel SMS/voice reminder schedule, pair with designated family caregiver, and reschedule missed visit.',
    recommendationReason: 'Patient missed scheduled visit due to memory lapse or oversight.',
    priority: 'medium',
    defaultDaysToDue: 2,
    assignedTeam: 'Care Coordination'
  },
  scheduling_conflicts: {
    actionType: 'flexible_hours_scheduling',
    title: 'Flexible Appointment Window Coordination',
    suggestedAction: 'Offer an early-morning, evening, or weekend appointment slot that does not conflict with daily wage work.',
    recommendationReason: 'Work shift or domestic schedule prevents attending standard clinic hours.',
    priority: 'medium',
    defaultDaysToDue: 4,
    assignedTeam: 'Outpatient Scheduling Team'
  },
  difficulty_accessing_services: {
    actionType: 'home_health_visit',
    title: 'Community Health Worker Home Visit',
    suggestedAction: 'Dispatch assigned healthcare worker for in-person home visit or coordinate mobile clinic outreach.',
    recommendationReason: 'Mobility limitation, elderly care, or physical barrier accessing facility.',
    priority: 'high',
    defaultDaysToDue: 3,
    assignedTeam: 'Community Health Workers (ASHA/ANM)'
  },
  family_personal_circumstances: {
    actionType: 'family_caregiver_engagement',
    title: 'Family & Caregiver Support Engagement',
    suggestedAction: 'Initiate supportive dialogue with authorized caregiver to establish a sustainable domestic medication routine.',
    recommendationReason: 'Domestic strain, caregiver fatigue, or personal crisis impeding treatment continuity.',
    priority: 'medium',
    defaultDaysToDue: 4,
    assignedTeam: 'Family Care Coordination'
  },
  other: {
    actionType: 'comprehensive_case_review',
    title: 'In-Person Comprehensive Case Review',
    suggestedAction: 'Schedule an in-depth phone or in-person consultation to identify specific unlisted barrier and establish tailor-made plan.',
    recommendationReason: 'Unspecified or multifaceted challenge reported.',
    priority: 'medium',
    defaultDaysToDue: 3,
    assignedTeam: 'Primary Care Outreach Team'
  }
};

/**
 * Generate a rule-based support action recommendation from a reported barrier.
 * @param {Object} barrier - Barrier document
 * @param {ObjectId} createdByUserId - User ID of staff or system
 * @returns {Promise<Object>} Created or matched SupportAction document
 */
async function matchBarrierToSupportAction(barrier, createdByUserId = null) {
  const patient = await Patient.findById(barrier.patient || barrier.patientId);
  if (!patient) {
    throw new Error('Patient not found for barrier matching');
  }

  const rule = BARRIER_RULES[barrier.category] || BARRIER_RULES.other;

  const now = new Date();
  const dueDate = new Date(now.getTime() + (rule.defaultDaysToDue || 3) * 24 * 60 * 60 * 1000);

  const assignedTo = patient.assignedWorker || patient.assignedWorkerId || createdByUserId;

  const supportAction = new SupportAction({
    patient: patient._id,
    patientId: patient._id,
    relatedBarrier: barrier._id,
    actionType: rule.actionType,
    title: rule.title,
    suggestedAction: rule.suggestedAction,
    recommendationReason: rule.recommendationReason,
    assignedTo,
    assignedTeam: rule.assignedTeam,
    status: 'suggested',
    priority: rule.priority,
    dueDate,
    createdBy: createdByUserId
  });

  await supportAction.save();

  // Link support action to barrier
  barrier.matchedSupportAction = supportAction._id;
  barrier.status = 'support_matched';
  await barrier.save();

  return supportAction;
}

module.exports = {
  BARRIER_RULES,
  matchBarrierToSupportAction
};
