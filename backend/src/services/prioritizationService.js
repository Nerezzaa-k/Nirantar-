const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Barrier = require('../models/Barrier');
const FollowUpCase = require('../models/FollowUpCase');
const TreatmentProgram = require('../models/TreatmentProgram');

/**
 * DEFAULT CONFIGURABLE WEIGHTS & THRESHOLDS FOR PRIORITIZATION
 */
const DEFAULT_CONFIG = {
  weights: {
    missedAppointmentMax: 30, // Up to 30 pts (15 pts per missed appointment)
    daysSinceFollowUpMax: 20, // Up to 20 pts based on elapsed days past standard interval
    overdueDaysMax: 20,       // Up to 20 pts based on scheduled appointment overdue days
    unsuccessfulContactMax: 15, // Up to 15 pts (5 pts per unsuccessful attempt)
    unresolvedBarrierMax: 15  // Up to 15 pts (8 pts per open barrier / assistance request)
  },
  thresholds: {
    lowMax: 29,
    mediumMax: 59,
    highMin: 60
  },
  standardIntervalDays: 30
};

/**
 * Calculate transparent, explainable risk score for a patient based on actual database records.
 * Non-clinical decision support tool.
 * @param {string|ObjectId} patientId
 * @returns {Promise<Object>} Calculated assessment result
 */
async function assessPatientPrioritization(patientId) {
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new Error(`Patient ${patientId} not found`);
  }

  // Load program configuration if available
  let program = null;
  if (patient.treatmentProgram) {
    program = await TreatmentProgram.findOne({
      $or: [
        { programCode: patient.treatmentProgram.toUpperCase() },
        { name: new RegExp(patient.treatmentProgram, 'i') }
      ]
    });
  }

  const standardIntervalDays = program?.defaultFollowUpIntervalDays || DEFAULT_CONFIG.standardIntervalDays;
  const weights = {
    ...DEFAULT_CONFIG.weights,
    ...(program?.prioritizationRules || {})
  };

  const now = new Date();
  const contributingFactors = [];
  let totalScore = 0;

  // 1. Missed Appointments (Max 30 pts)
  const missedAppointments = await Appointment.find({
    patient: patient._id,
    status: 'missed'
  }).sort({ scheduledAt: -1 }).limit(10);

  const missedCount = missedAppointments.length;
  let missedPoints = 0;
  if (missedCount > 0) {
    missedPoints = Math.min(weights.missedAppointmentMax, missedCount * 15);
    contributingFactors.push({
      factor: 'Missed Appointments',
      points: missedPoints,
      maxPoints: weights.missedAppointmentMax,
      description: `${missedCount} missed appointment${missedCount > 1 ? 's' : ''} in treatment record.`
    });
  } else {
    contributingFactors.push({
      factor: 'Appointment Attendance',
      points: 0,
      maxPoints: weights.missedAppointmentMax,
      description: 'No recently missed scheduled appointments.'
    });
  }
  totalScore += missedPoints;

  // 2. Days Since Last Completed Follow-up (Max 20 pts)
  const lastCompletedAppt = await Appointment.findOne({
    patient: patient._id,
    status: 'completed'
  }).sort({ scheduledAt: -1 });

  const lastFollowUpDate = lastCompletedAppt?.completedAt || lastCompletedAppt?.scheduledAt || patient.lastVisitDate || patient.treatmentStartDate || patient.createdAt;
  const daysSinceFollowUp = Math.max(0, Math.floor((now - new Date(lastFollowUpDate)) / (1000 * 60 * 60 * 24)));

  let intervalPoints = 0;
  if (daysSinceFollowUp > standardIntervalDays) {
    const elapsedOverdue = daysSinceFollowUp - standardIntervalDays;
    intervalPoints = Math.min(weights.daysSinceFollowUpMax, Math.round((elapsedOverdue / standardIntervalDays) * weights.daysSinceFollowUpMax));
    contributingFactors.push({
      factor: 'Follow-up Interval Elapsed',
      points: intervalPoints,
      maxPoints: weights.daysSinceFollowUpMax,
      description: `${daysSinceFollowUp} days since last completed follow-up (Standard interval: ${standardIntervalDays} days).`
    });
  } else {
    contributingFactors.push({
      factor: 'Follow-up Interval',
      points: 0,
      maxPoints: weights.daysSinceFollowUpMax,
      description: `Within standard follow-up cycle (${daysSinceFollowUp} of ${standardIntervalDays} days elapsed).`
    });
  }
  totalScore += intervalPoints;

  // 3. Number of Overdue Days for Pending Appointment (Max 20 pts)
  const pendingAppt = await Appointment.findOne({
    patient: patient._id,
    status: 'scheduled',
    scheduledAt: { $lt: now }
  }).sort({ scheduledAt: 1 });

  let overduePoints = 0;
  let overdueDays = 0;
  if (pendingAppt) {
    overdueDays = Math.max(1, Math.floor((now - new Date(pendingAppt.scheduledAt)) / (1000 * 60 * 60 * 24)));
    if (overdueDays >= 14) {
      overduePoints = weights.overdueDaysMax;
    } else {
      overduePoints = Math.round((overdueDays / 14) * weights.overdueDaysMax);
    }
    contributingFactors.push({
      factor: 'Overdue Scheduled Visit',
      points: overduePoints,
      maxPoints: weights.overdueDaysMax,
      description: `Follow-up appointment overdue by ${overdueDays} days (Scheduled for ${new Date(pendingAppt.scheduledAt).toLocaleDateString()}).`
    });
  } else {
    contributingFactors.push({
      factor: 'Overdue Days',
      points: 0,
      maxPoints: weights.overdueDaysMax,
      description: 'No overdue scheduled appointments pending.'
    });
  }
  totalScore += overduePoints;

  // 4. Previous Unsuccessful Contact Attempts (Max 15 pts)
  const existingCase = await FollowUpCase.findOne({
    patient: patient._id,
    status: { $nin: ['follow_up_completed', 'closed'] }
  });

  const unsuccessfulAttempts = existingCase?.contactAttempts?.filter(
    (att) => ['no_answer', 'busy', 'wrong_number', 'patient_unreachable'].includes(att.outcome)
  ) || [];

  const unsuccCount = unsuccessfulAttempts.length;
  let contactPoints = 0;
  if (unsuccCount > 0) {
    contactPoints = Math.min(weights.unsuccessfulContactMax, unsuccCount * 5);
    contributingFactors.push({
      factor: 'Unsuccessful Contact Attempts',
      points: contactPoints,
      maxPoints: weights.unsuccessfulContactMax,
      description: `${unsuccCount} previous contact attempt${unsuccCount > 1 ? 's' : ''} failed or received no answer.`
    });
  } else {
    contributingFactors.push({
      factor: 'Contact Reachability',
      points: 0,
      maxPoints: weights.unsuccessfulContactMax,
      description: 'No unresolved failed contact attempts on record.'
    });
  }
  totalScore += contactPoints;

  // 5. Previously Reported Barriers & Unresolved Assistance Requests (Max 15 pts)
  const openBarriers = await Barrier.find({
    patient: patient._id,
    status: { $in: ['open', 'in_review', 'escalated'] }
  });

  const unresolvedAssistance = openBarriers.filter((b) => b.assistanceRequested);
  let barrierPoints = 0;
  if (openBarriers.length > 0) {
    const pts = openBarriers.length * 6 + unresolvedAssistance.length * 4;
    barrierPoints = Math.min(weights.unresolvedBarrierMax, pts);
    const barrierSummaries = openBarriers.map((b) => b.categoryLabel || b.category.replace(/_/g, ' ')).join(', ');
    contributingFactors.push({
      factor: 'Reported Barriers & Assistance',
      points: barrierPoints,
      maxPoints: weights.unresolvedBarrierMax,
      description: `${openBarriers.length} active barrier(s) reported (${barrierSummaries}); ${unresolvedAssistance.length} unresolved assistance request(s).`
    });
  } else {
    contributingFactors.push({
      factor: 'Reported Barriers',
      points: 0,
      maxPoints: weights.unresolvedBarrierMax,
      description: 'Zero active barriers reported by patient or caregiver.'
    });
  }
  totalScore += barrierPoints;

  // Normalize final score between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, Math.round(totalScore)));

  // Classify Risk Level
  let riskLevel = 'low';
  if (normalizedScore >= DEFAULT_CONFIG.thresholds.highMin) {
    riskLevel = 'high';
  } else if (normalizedScore > DEFAULT_CONFIG.thresholds.lowMax) {
    riskLevel = 'medium';
  }

  // Generate actionable, respectful recommended next action
  let recommendedNextAction = 'Maintain scheduled routine visits and check-in timeline.';
  if (riskLevel === 'high') {
    if (unresolvedAssistance.length > 0) {
      const topBarrier = unresolvedAssistance[0];
      const categoryName = topBarrier.category.replace(/_/g, ' ');
      recommendedNextAction = `Contact patient urgently to address unresolved ${categoryName} request and arrange support coordination.`;
    } else if (overdueDays > 7 || missedCount > 1) {
      recommendedNextAction = `Contact patient via phone call or home outreach to understand dropout barrier and reschedule missed visit.`;
    } else {
      recommendedNextAction = `Prioritize immediate healthcare worker outreach to re-engage patient in treatment continuity.`;
    }
  } else if (riskLevel === 'medium') {
    if (openBarriers.length > 0) {
      recommendedNextAction = `Review reported barrier and send proactive reminder or check-in request before next appointment.`;
    } else {
      recommendedNextAction = `Send proactive reminder message; confirm upcoming appointment availability.`;
    }
  }

  // Update patient document with latest assessment
  patient.currentRiskScore = normalizedScore;
  patient.currentRiskLevel = riskLevel;
  patient.currentRiskCategory = riskLevel;
  patient.lastAssessmentDate = now;
  patient.followUpMetadata = {
    lastCompletedFollowUp: lastFollowUpDate,
    nextScheduledAppointment: pendingAppt?.scheduledAt || patient.nextAppointmentDate,
    totalMissedAppointments: missedCount,
    overdueDays,
    unresolvedBarriersCount: openBarriers.length,
    unsuccessfulContactAttempts: unsuccCount
  };
  await patient.save();

  // Create or update active FollowUpCase
  let followUpCase = existingCase;
  if (!followUpCase) {
    const caseCount = await FollowUpCase.countDocuments();
    followUpCase = new FollowUpCase({
      caseNumber: `FC-${1000 + caseCount + 1}`,
      patient: patient._id,
      patientId: patient._id,
      relatedAppointment: pendingAppt?._id || missedAppointments[0]?._id,
      riskScore: normalizedScore,
      riskLevel,
      contributingFactors,
      recommendedNextAction,
      status: riskLevel === 'high' ? 'contact_pending' : 'new',
      assignedTo: patient.assignedWorker || patient.assignedWorkerId,
      isOverdue: overdueDays > 0,
      overdueDays
    });
  } else {
    followUpCase.riskScore = normalizedScore;
    followUpCase.riskLevel = riskLevel;
    followUpCase.contributingFactors = contributingFactors;
    followUpCase.recommendedNextAction = recommendedNextAction;
    followUpCase.isOverdue = overdueDays > 0;
    followUpCase.overdueDays = overdueDays;
    if (pendingAppt) followUpCase.relatedAppointment = pendingAppt._id;
  }
  await followUpCase.save();

  return {
    patientId: patient._id,
    patientName: patient.name,
    patientCode: patient.patientId || patient.patientCode,
    treatmentProgram: patient.treatmentProgram,
    riskScore: normalizedScore,
    riskLevel,
    contributingFactors,
    recommendedNextAction,
    assessmentDate: now,
    followUpCaseId: followUpCase._id,
    caseNumber: followUpCase.caseNumber,
    disclaimer: 'This score is a rules-based decision aid to support human review by authorized healthcare workers. It is not an automated clinical diagnosis or medical treatment prescription.'
  };
}

module.exports = {
  assessPatientPrioritization,
  DEFAULT_CONFIG
};
