const Patient = require('../models/Patient');
const Condition = require('../models/Condition');
const Visit = require('../models/Visit');
const MedicationRefill = require('../models/MedicationRefill');
const MedicineStock = require('../models/MedicineStock');
const RiskScore = require('../models/RiskScore');
const Village = require('../models/Village');
const { FACTOR_WEIGHTS, DEFAULT_THRESHOLDS, RISK_CATEGORIES } = require('../config/constants');

/**
 * Calculate explainable risk score (0-100) based on actual patient records and configured rules.
 * @param {string|ObjectId} patientId
 * @returns {Promise<Object>} Calculated RiskScore document & breakdown
 */
const calculatePatientRisk = async (patientId) => {
  const patient = await Patient.findById(patientId)
    .populate('primaryCondition')
    .populate('villageId');

  if (!patient) {
    throw new Error(`Patient ${patientId} not found`);
  }

  // Load condition configuration or use defaults
  let conditionConfig = patient.primaryCondition;
  if (!conditionConfig) {
    conditionConfig = await Condition.findOne({ enabled: true });
  }

  const factorWeights = conditionConfig?.riskFactorConfiguration || {
    refillOverdueMax: FACTOR_WEIGHTS.REFILL_OVERDUE,
    daysSinceLastVisitMax: FACTOR_WEIGHTS.DAYS_SINCE_LAST_VISIT,
    pastMissedVisitsMax: FACTOR_WEIGHTS.PAST_MISSED_VISITS,
    clinicalTrendMax: FACTOR_WEIGHTS.CLINICAL_TREND,
    seasonalFactorMax: FACTOR_WEIGHTS.SEASONAL_FACTOR,
    distanceMax: FACTOR_WEIGHTS.DISTANCE,
    medicineStockoutMax: FACTOR_WEIGHTS.MEDICINE_STOCKOUT
  };

  const thresholds = conditionConfig?.riskThresholds || {
    lowMax: DEFAULT_THRESHOLDS.LOW_MAX,
    mediumMax: DEFAULT_THRESHOLDS.MEDIUM_MAX,
    highMin: DEFAULT_THRESHOLDS.HIGH_MIN
  };

  const gracePeriodDays = conditionConfig?.refillGracePeriodDays || 5;
  const followUpIntervalDays = conditionConfig?.followUpIntervalDays || 30;

  const factorBreakdown = [];
  const missingDataPoints = [];
  const now = new Date();

  // 1. Refill Overdue (Max 25 pts)
  let refillPoints = 0;
  const latestRefill = await MedicationRefill.findOne({ patientId })
    .sort({ refillDueDate: -1 });

  if (!latestRefill) {
    missingDataPoints.push('Medication refill history unavailable');
    factorBreakdown.push({
      factor: 'Refill Status',
      points: 0,
      maxPoints: factorWeights.refillOverdueMax,
      description: 'No recorded refill history. Not penalized.',
      underlyingData: null
    });
  } else {
    const dueDate = new Date(latestRefill.refillDueDate);
    const diffDays = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

    if (latestRefill.status === 'overdue' || (latestRefill.status !== 'collected' && diffDays > gracePeriodDays)) {
      if (diffDays > gracePeriodDays + 14) {
        refillPoints = factorWeights.refillOverdueMax; // 25
      } else if (diffDays > gracePeriodDays) {
        refillPoints = Math.round((diffDays / (gracePeriodDays + 14)) * factorWeights.refillOverdueMax);
      }
      factorBreakdown.push({
        factor: 'Refill Overdue',
        points: Math.min(refillPoints, factorWeights.refillOverdueMax),
        maxPoints: factorWeights.refillOverdueMax,
        description: `Refill overdue by ${diffDays} days (Grace period: ${gracePeriodDays} days).`,
        underlyingData: { dueDate: latestRefill.refillDueDate, daysOverdue: diffDays, status: latestRefill.status }
      });
    } else {
      factorBreakdown.push({
        factor: 'Refill Status',
        points: 0,
        maxPoints: factorWeights.refillOverdueMax,
        description: `Medication refill is up to date (Due: ${dueDate.toLocaleDateString()}).`,
        underlyingData: { dueDate: latestRefill.refillDueDate, status: latestRefill.status }
      });
    }
  }

  // 2. Days Since Last Visit Relative to Follow-up Interval (Max 20 pts)
  let visitIntervalPoints = 0;
  const recentVisits = await Visit.find({ patientId }).sort({ visitDate: -1 }).limit(5);
  const lastAttendedVisit = recentVisits.find(v => v.status === 'attended');

  if (!lastAttendedVisit && !patient.lastVisitDate) {
    missingDataPoints.push('Last attended clinic visit record unavailable');
    factorBreakdown.push({
      factor: 'Visit Interval',
      points: 0,
      maxPoints: factorWeights.daysSinceLastVisitMax,
      description: 'No prior clinic visit date on record. Not penalized.',
      underlyingData: null
    });
  } else {
    const lastDate = lastAttendedVisit ? new Date(lastAttendedVisit.visitDate) : new Date(patient.lastVisitDate);
    const daysSinceVisit = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

    if (daysSinceVisit > followUpIntervalDays) {
      const daysOverInterval = daysSinceVisit - followUpIntervalDays;
      visitIntervalPoints = Math.min(
        factorWeights.daysSinceLastVisitMax,
        Math.round((daysOverInterval / followUpIntervalDays) * factorWeights.daysSinceLastVisitMax)
      );
      factorBreakdown.push({
        factor: 'Visit Interval Overdue',
        points: visitIntervalPoints,
        maxPoints: factorWeights.daysSinceLastVisitMax,
        description: `${daysSinceVisit} days since last visit (Standard interval: ${followUpIntervalDays} days).`,
        underlyingData: { lastVisitDate: lastDate, daysSinceVisit, standardInterval: followUpIntervalDays }
      });
    } else {
      factorBreakdown.push({
        factor: 'Visit Interval',
        points: 0,
        maxPoints: factorWeights.daysSinceLastVisitMax,
        description: `Within standard follow-up interval (${daysSinceVisit} / ${followUpIntervalDays} days).`,
        underlyingData: { lastVisitDate: lastDate, daysSinceVisit }
      });
    }
  }

  // 3. Past Missed Visits (Max 15 pts)
  let missedVisitPoints = 0;
  const missedCount = recentVisits.filter(v => v.status === 'missed').length;
  if (missedCount > 0) {
    missedVisitPoints = Math.min(factorWeights.pastMissedVisitsMax, missedCount * 7.5);
    factorBreakdown.push({
      factor: 'Past Missed Visits',
      points: Math.round(missedVisitPoints),
      maxPoints: factorWeights.pastMissedVisitsMax,
      description: `${missedCount} missed appointment(s) in recent visit history.`,
      underlyingData: { missedCount, totalRecentVisits: recentVisits.length }
    });
  } else {
    factorBreakdown.push({
      factor: 'Past Missed Visits',
      points: 0,
      maxPoints: factorWeights.pastMissedVisitsMax,
      description: 'Zero missed visits in recent appointments.',
      underlyingData: { missedCount: 0 }
    });
  }

  // 4. Clinical Trend (Max 15 pts)
  let clinicalTrendPoints = 0;
  const visitsWithVitals = recentVisits.filter(v => v.clinicalMeasurements && (v.clinicalMeasurements.bloodPressureSystolic || v.clinicalMeasurements.bloodGlucose));

  if (visitsWithVitals.length < 2) {
    missingDataPoints.push('Longitudinal clinical trends require at least 2 vitals readings');
    factorBreakdown.push({
      factor: 'Clinical Trend',
      points: 0,
      maxPoints: factorWeights.clinicalTrendMax,
      description: 'Insufficient vitals history to establish trend. Excluded safely.',
      underlyingData: null
    });
  } else {
    const latestVitals = visitsWithVitals[0].clinicalMeasurements;
    const priorVitals = visitsWithVitals[1].clinicalMeasurements;

    let worsening = false;
    let vitalsDesc = 'Stable trend';

    if (latestVitals.bloodPressureSystolic && priorVitals.bloodPressureSystolic) {
      if (latestVitals.bloodPressureSystolic > priorVitals.bloodPressureSystolic + 10 || latestVitals.bloodPressureSystolic >= 150) {
        worsening = true;
        vitalsDesc = `Rising BP: ${priorVitals.bloodPressureSystolic} -> ${latestVitals.bloodPressureSystolic} mmHg`;
      }
    }
    if (latestVitals.bloodGlucose && priorVitals.bloodGlucose) {
      if (latestVitals.bloodGlucose > priorVitals.bloodGlucose + 30 || latestVitals.bloodGlucose >= 200) {
        worsening = true;
        vitalsDesc = `Rising Glucose: ${priorVitals.bloodGlucose} -> ${latestVitals.bloodGlucose} mg/dL`;
      }
    }

    if (worsening) {
      clinicalTrendPoints = factorWeights.clinicalTrendMax;
      factorBreakdown.push({
        factor: 'Uncontrolled Clinical Trend',
        points: clinicalTrendPoints,
        maxPoints: factorWeights.clinicalTrendMax,
        description: `${vitalsDesc}. Higher risk of drop-out if patient feels unmanaged.`,
        underlyingData: { latestVitals, priorVitals }
      });
    } else {
      factorBreakdown.push({
        factor: 'Clinical Trend',
        points: 0,
        maxPoints: factorWeights.clinicalTrendMax,
        description: 'Vitals trend is stable or controlled.',
        underlyingData: { latestVitals }
      });
    }
  }

  // 5. Seasonal Factor (Max 10 pts)
  let seasonalPoints = 0;
  const village = patient.villageId;
  const currentSeason = village?.season || 'normal';

  if (currentSeason === 'monsoon' || currentSeason === 'harvest') {
    seasonalPoints = factorWeights.seasonalFactorMax;
    factorBreakdown.push({
      factor: 'Seasonal Barrier',
      points: seasonalPoints,
      maxPoints: factorWeights.seasonalFactorMax,
      description: `Active ${currentSeason} season in ${village?.name || 'village'}. Field work and washed-out roads hinder attendance.`,
      underlyingData: { season: currentSeason, village: village?.name }
    });
  } else {
    factorBreakdown.push({
      factor: 'Seasonal Barrier',
      points: 0,
      maxPoints: factorWeights.seasonalFactorMax,
      description: `Normal season (${currentSeason}). No severe climate/agricultural hindrance.`,
      underlyingData: { season: currentSeason }
    });
  }

  // 6. Distance to Healthcare Facility (Max 10 pts)
  let distancePoints = 0;
  const distanceKm = patient.distanceToFacilityKm || 5.0;

  if (distanceKm >= 10) {
    distancePoints = factorWeights.distanceMax;
  } else if (distanceKm > 5) {
    distancePoints = Math.round(((distanceKm - 5) / 5) * factorWeights.distanceMax);
  }

  factorBreakdown.push({
    factor: 'Distance to Facility',
    points: distancePoints,
    maxPoints: factorWeights.distanceMax,
    description: `Distance: ${distanceKm} km from facility (Threshold: >5 km moderate, >=10 km high).`,
    underlyingData: { distanceKm }
  });

  // 7. Medicine Stock-out at Primary Facility (Max 5 pts)
  let stockPoints = 0;
  if (patient.facilityId && patient.primaryCondition) {
    const stockOutRecord = await MedicineStock.findOne({
      facilityId: patient.facilityId,
      conditionId: patient.primaryCondition._id,
      isStockout: true
    });

    if (stockOutRecord) {
      stockPoints = factorWeights.medicineStockoutMax;
      factorBreakdown.push({
        factor: 'Facility Medicine Stockout',
        points: stockPoints,
        maxPoints: factorWeights.medicineStockoutMax,
        description: `Confirmed stock-out for condition medicines (${stockOutRecord.medicationName}) at facility.`,
        underlyingData: { medicationName: stockOutRecord.medicationName, quantityAvailable: stockOutRecord.quantityAvailable }
      });
    } else {
      factorBreakdown.push({
        factor: 'Medicine Stock Availability',
        points: 0,
        maxPoints: factorWeights.medicineStockoutMax,
        description: 'Facility confirms active stock of condition medications.',
        underlyingData: { inStock: true }
      });
    }
  } else {
    factorBreakdown.push({
      factor: 'Medicine Stock Availability',
      points: 0,
      maxPoints: factorWeights.medicineStockoutMax,
      description: 'Stock status assumed stable.',
      underlyingData: null
    });
  }

  // Total raw score
  let rawScore = factorBreakdown.reduce((sum, item) => sum + item.points, 0);
  const normalizedScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Categorize
  let category = RISK_CATEGORIES.LOW;
  if (normalizedScore >= thresholds.highMin) {
    category = RISK_CATEGORIES.HIGH;
  } else if (normalizedScore > thresholds.lowMax) {
    category = RISK_CATEGORIES.MEDIUM;
  }

  // Determine recommended follow-up
  let recommendedFollowUp = 'Maintain scheduled routine visits and normal refill cycle.';
  if (category === RISK_CATEGORIES.HIGH) {
    if (refillPoints >= 15) {
      recommendedFollowUp = 'Urgent: Assign worker for doorstep refill outreach and adherence counselling.';
    } else if (missedVisitPoints >= 10 || visitIntervalPoints >= 15) {
      recommendedFollowUp = 'Urgent: In-person home visit required within 48 hours to prevent total lapse.';
    } else {
      recommendedFollowUp = 'High adherence risk flagged. Review contributing factors and dispatch care intervention.';
    }
  } else if (category === RISK_CATEGORIES.MEDIUM) {
    recommendedFollowUp = 'Proactive reminder call or SMS; monitor upcoming refill date.';
  }

  // Save new RiskScore entry
  const savedScore = await RiskScore.create({
    patientId: patient._id,
    conditionId: patient.primaryCondition?._id,
    score: normalizedScore,
    category,
    factorBreakdown,
    missingDataPoints,
    recommendedFollowUp,
    modelVersion: 'v3.0.0-rules',
    calculatedAt: now
  });

  // Update patient's denormalized risk fields for fast filtering
  patient.currentRiskScore = normalizedScore;
  patient.currentRiskCategory = category;
  patient.lastCalculatedAt = now;
  await patient.save();

  return savedScore;
};

module.exports = { calculatePatientRisk };
