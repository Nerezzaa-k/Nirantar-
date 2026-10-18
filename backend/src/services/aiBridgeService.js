const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET || 'nirantar_internal_ai_secret_token_789456';

const apiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Secret': AI_SERVICE_SECRET
  }
});

/**
 * Explain Risk Score with AI or deterministic fallback
 */
const explainRiskScore = async ({ score, category, factorBreakdown, missingDataPoints, patientName, conditionName }) => {
  try {
    const res = await apiClient.post('/api/ai/explain-risk', {
      score,
      category,
      factor_breakdown: factorBreakdown,
      missing_data_points: missingDataPoints,
      patient_name: patientName,
      condition_name: conditionName
    });
    return { ...res.data, source: 'ai' };
  } catch (error) {
    // Graceful fallback to explainable rule summary
    const topFactors = (factorBreakdown || [])
      .filter(f => f.points > 0)
      .sort((a, b) => b.points - a.points);

    return {
      summary: `Patient has an adherence risk score of ${score}/100 (${category.toUpperCase()} risk) for ${conditionName || 'chronic condition'}. The score is driven primarily by: ${topFactors.slice(0, 3).map(f => `${f.factor} (+${f.points} pts)`).join(', ') || 'routine baseline factors'}.`,
      contributing_factors: topFactors.map(f => ({ factor: f.factor, points: f.points })),
      recommended_actions: [
        {
          action: category === 'high'
            ? 'Urgent follow-up visit and adherence barrier discussion.'
            : 'Schedule routine check-in and verify medication supplies.',
          priority: category === 'high' ? 'high' : 'medium',
          requires_human_review: true
        }
      ],
      limitations: missingDataPoints && missingDataPoints.length > 0
        ? missingDataPoints
        : ['Vitals history is limited. Score represents statistical non-adherence probability, not a diagnosis.'],
      source: 'rule-based-fallback'
    };
  }
};

/**
 * Classify Reported Reason with AI or fallback
 */
const classifyReason = async ({ selectedReason, note, conditionName }) => {
  try {
    const res = await apiClient.post('/api/ai/classify-reason', {
      selected_reason: selectedReason,
      note,
      condition_name: conditionName
    });
    return { ...res.data, source: 'ai' };
  } catch (error) {
    return {
      normalized_category: selectedReason || 'Other',
      explanation: note ? `Patient selected "${selectedReason}" and noted: "${note}".` : `Patient indicated "${selectedReason}".`,
      recommended_intervention_category: selectedReason === 'I am experiencing side effects' ? 'clinical_escalation' : 'community_support',
      priority_suggestion: selectedReason === 'I am experiencing side effects' ? 'urgent' : 'medium',
      requires_human_review: true,
      source: 'rule-based-fallback'
    };
  }
};

/**
 * Recommend Interventions with AI or fallback
 */
const recommendIntervention = async ({ patientId, reportedReason, conditionName, riskScore, availableStock }) => {
  try {
    const res = await apiClient.post('/api/ai/recommend-intervention', {
      patient_id: patientId ? patientId.toString() : 'UNKNOWN',
      reported_reason: reportedReason,
      condition_name: conditionName,
      risk_score: riskScore,
      available_stock: availableStock
    });
    return { ...res.data, source: 'ai' };
  } catch (error) {
    return {
      primary_recommendation: {
        action: `Address "${reportedReason}" through targeted community protocol.`,
        intervention_type: 'protocol_dispatch',
        priority: 'high',
        rationale: 'Protocol generated via clinical adherence rules engine while AI service is in offline mode.'
      },
      alternative_actions: [
        { action: 'Contact assigned ASHA/ANM for home verification visit.' }
      ],
      safety_guardrails: [
        'AI must not change medication doses or discontinue prescriptions.',
        'Escalate acute physical symptoms to Medical Officer.'
      ],
      source: 'rule-based-fallback'
    };
  }
};

/**
 * District summary with AI or fallback
 */
const getDistrictSummary = async (stats) => {
  try {
    const res = await apiClient.post('/api/ai/district-summary', stats);
    return { ...res.data, source: 'ai' };
  } catch (error) {
    return {
      overview: `District overview shows ${stats.totalPatients || 0} enrolled patients with ${stats.highRiskCount || 0} flagged as high risk.`,
      critical_hotspots: stats.hotspots?.slice(0, 3) || [],
      predominant_barriers: stats.topReasons || [],
      actionable_recommendations: [
        'Organize village doorstep outreach refill days in high-risk catchment areas.',
        'Replenish pharmacy stock for locations reporting medicine unavailability.',
        'Schedule weekend/evening flexible follow-up clinics for working-class patients.'
      ],
      source: 'rule-based-fallback'
    };
  }
};

/**
 * Worker Assistant Q&A
 */
const askWorkerAssistant = async ({ query, context }) => {
  try {
    const res = await apiClient.post('/api/ai/worker-assistant', {
      query,
      context
    });
    return { ...res.data, source: 'ai' };
  } catch (error) {
    const qLower = (query || '').toLowerCase();
    let responseText = 'Nirantar AI Assistant is operating in local protocol mode. How can I help you manage your patient cohort today?';

    if (qLower.includes('high risk') || qLower.includes('flagged')) {
      responseText = 'Patients are flagged as High Risk when their score reaches 60+. The top drivers are overdue medication refills (>5 days grace period), missed follow-up appointments, worsening blood pressure/glucose readings, and village travel distance.';
    } else if (qLower.includes('travel') || qLower.includes('cannot travel')) {
      responseText = 'For patients who cannot travel to the PHC, Nirantar recommends enrolling them in the village doorstep refill batch or coordinating with the local ASHA worker during weekly outreach rounds.';
    } else if (qLower.includes('refill') || qLower.includes('stock')) {
      responseText = 'Refill delays are the highest predictor of treatment dropout. If local stock is depleted, check nearby PHC stock levels or escalate an urgent stock requisition before the patient runs out of pills.';
    } else if (qLower.includes('side effect')) {
      responseText = 'Safety Alert: Any reported side effect must be escalated directly to the Medical Officer. Never advise stopping medication or modifying doses without a physician evaluation.';
    }

    return {
      answer: responseText,
      grounded_records: ['Nirantar Clinical Adherence Protocol v3.0'],
      source: 'rule-based-fallback'
    };
  }
};

module.exports = {
  explainRiskScore,
  classifyReason,
  recommendIntervention,
  getDistrictSummary,
  askWorkerAssistant
};
