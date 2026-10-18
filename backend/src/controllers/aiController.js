const aiBridgeService = require('../services/aiBridgeService');
const aiAssistanceService = require('../services/aiAssistanceService');
const Patient = require('../models/Patient');
const RiskScore = require('../models/RiskScore');
const analyticsService = require('../services/analyticsService');

// @desc    Get AI-assisted explanation for a patient's risk score
// @route   POST /api/v1/ai/explain-risk
// @access  Private
const explainRisk = async (req, res, next) => {
  try {
    const { patientId, score, category, factorBreakdown, missingDataPoints } = req.body;

    let patientName = 'Patient';
    let conditionName = 'Chronic Condition';

    if (patientId) {
      const patient = await Patient.findById(patientId).populate('primaryCondition');
      if (patient) {
        patientName = patient.name;
        conditionName = patient.treatmentProgram || patient.primaryCondition?.name || 'Chronic Condition';
      }
    }

    const explanation = await aiBridgeService.explainRiskScore({
      score: score || 0,
      category: category || 'medium',
      factorBreakdown: factorBreakdown || [],
      missingDataPoints: missingDataPoints || [],
      patientName,
      conditionName
    });

    res.json({
      success: true,
      explanation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Summarize recorded non-diagnostic follow-up notes
// @route   POST /api/v1/ai/summarize-notes
// @access  Private
const summarizeNotes = async (req, res, next) => {
  try {
    const { notes, patientId } = req.body;
    let patientContext = {};

    if (patientId) {
      const patient = await Patient.findById(patientId);
      if (patient) {
        patientContext = {
          name: patient.name,
          program: patient.treatmentProgram
        };
      }
    }

    const result = await aiAssistanceService.summarizeNotes(notes, patientContext);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Categorize barrier from narrative or voice transcript
// @route   POST /api/v1/ai/categorize-barrier
// @access  Private
const categorizeBarrier = async (req, res, next) => {
  try {
    const { text } = req.body;
    const result = await aiAssistanceService.categorizeBarrierFromText(text);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Draft respectful follow-up message for patient
// @route   POST /api/v1/ai/draft-message
// @access  Private
const draftMessage = async (req, res, next) => {
  try {
    const { patientName, barrierCategory, program, channel, tone } = req.body;
    const result = await aiAssistanceService.draftRespectfulMessage({
      patientName,
      barrierCategory,
      program,
      channel,
      tone
    });
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Classify patient reported reason (legacy compat)
const classifyReason = async (req, res, next) => {
  try {
    const { selectedReason, note, conditionName } = req.body;
    const classification = await aiBridgeService.classifyReason({
      selectedReason,
      note,
      conditionName
    });
    res.json({ success: true, classification });
  } catch (error) {
    next(error);
  }
};

// @desc    Recommend contextual intervention (legacy compat)
const recommendIntervention = async (req, res, next) => {
  try {
    const { patientId, reportedReason, conditionName, riskScore, availableStock } = req.body;
    const recommendation = await aiBridgeService.recommendIntervention({
      patientId,
      reportedReason,
      conditionName,
      riskScore,
      availableStock
    });
    res.json({ success: true, recommendation });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate AI summary for district staff
const getDistrictSummary = async (req, res, next) => {
  try {
    const metrics = await analyticsService.getSummaryMetrics();
    const topReasons = await analyticsService.getDropoutReasons();
    const hotspots = await analyticsService.getGeographicHotspots();

    const summary = await aiBridgeService.getDistrictSummary({
      totalPatients: metrics.totalPatients,
      highRiskCount: metrics.highRiskCount,
      topReasons: topReasons.slice(0, 4),
      hotspots: hotspots.filter((h) => h.highRiskCount > 0)
    });

    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

// @desc    Interactive Worker Assistant
const workerAssistant = async (req, res, next) => {
  try {
    const { query, patientId } = req.body;
    let context = {};

    if (patientId) {
      const patient = await Patient.findById(patientId);
      if (patient) {
        context = {
          patientName: patient.name,
          patientCode: patient.patientId || patient.patientCode,
          program: patient.treatmentProgram,
          riskScore: patient.currentRiskScore,
          riskLevel: patient.currentRiskLevel
        };
      }
    }

    const response = await aiBridgeService.askWorkerAssistant({ query, context });
    res.json({ success: true, response });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  explainRisk,
  summarizeNotes,
  categorizeBarrier,
  draftMessage,
  classifyReason,
  recommendIntervention,
  getDistrictSummary,
  workerAssistant
};
