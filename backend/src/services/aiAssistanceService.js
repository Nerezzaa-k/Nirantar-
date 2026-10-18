const axios = require('axios');

/**
 * Bounded Non-Clinical AI Assistant for Nirantar
 * All functions are strictly non-diagnostic and support staff in communication and summarization.
 */

/**
 * 1. Summarize non-diagnostic follow-up notes
 */
async function summarizeNotes(notes, patientContext = {}) {
  if (!notes || notes.trim().length === 0) {
    return {
      summary: 'No notes provided to summarize.',
      keyTakeaways: [],
      suggestedFollowUpTone: 'Warm and supportive'
    };
  }

  // Attempt external LLM if API key exists
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are an AI assistant in a healthcare continuity coordination platform (Nirantar).
Strict constraint: Do not provide clinical diagnosis or prescribe treatments.
Task: Summarize these non-diagnostic field follow-up notes concisely into:
1) 2-3 sentence overview
2) Bullet points of key social/logistical barriers noted
Notes: "${notes}"
Patient Program: ${patientContext.program || 'Chronic Care'}`
                }
              ]
            }
          ]
        },
        { timeout: 7000 }
      );

      const generated = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generated) {
        return {
          summary: generated,
          engine: 'Gemini 1.5 Flash (Cloud LLM)',
          isFallback: false
        };
      }
    } catch (e) {
      console.warn('[AI Service] External Gemini API unavailable, using built-in engine:', e.message);
    }
  }

  // High quality deterministic fallback
  const lines = notes.split('\n').filter((l) => l.trim().length > 0);
  const words = notes.split(/\s+/).length;

  return {
    summary: `Patient follow-up notes review (${words} words recorded). Key points indicate ongoing treatment monitoring under ${patientContext.program || 'the care program'}, with specific operational observations regarding adherence barriers and contact touchpoints.`,
    keyTakeaways: lines.slice(0, 4).map((l) => l.replace(/^[-*•]\s*/, '').trim()),
    suggestedFollowUpTone: 'Warm, non-judgmental, and focused on practical assistance.',
    engine: 'Nirantar Deterministic Assistant (Offline/Embedded)',
    isFallback: true
  };
}

/**
 * 2. Help staff organize and categorize patient-reported barriers
 */
async function categorizeBarrierFromText(freeText) {
  if (!freeText) {
    return {
      suggestedCategory: 'other',
      confidence: 0.5,
      explanation: 'No narrative provided.'
    };
  }

  const lower = freeText.toLowerCase();

  if (lower.includes('money') || lower.includes('afford') || lower.includes('cost') || lower.includes('rupees') || lower.includes('expensive') || lower.includes('wage') || lower.includes('job') || lower.includes('bpl')) {
    return {
      suggestedCategory: 'financial_difficulties',
      confidence: 0.92,
      explanation: 'Detected references to monetary expense, lost wages, or affordability.'
    };
  }

  if (lower.includes('bus') || lower.includes('travel') || lower.includes('road') || lower.includes('distance') || lower.includes('far') || lower.includes('transport') || lower.includes('vehicle') || lower.includes('monsoon')) {
    return {
      suggestedCategory: 'transportation_problems',
      confidence: 0.94,
      explanation: 'Detected references to travel distance, road conditions, or transportation lack.'
    };
  }

  if (lower.includes('stock') || lower.includes('chemist') || lower.includes('pharmacy') || lower.includes('medicine finished') || lower.includes('out of medicine') || lower.includes('unavailable') || lower.includes('tablets over')) {
    return {
      suggestedCategory: 'medication_availability',
      confidence: 0.95,
      explanation: 'Detected indicators of pharmacy stockouts or depleted medicine supply.'
    };
  }

  if (lower.includes('dizzy') || lower.includes('vomit') || lower.includes('nausea') || lower.includes('pain') || lower.includes('rash') || lower.includes('headache') || lower.includes('side effect') || lower.includes('sick after taking')) {
    return {
      suggestedCategory: 'reported_side_effects',
      confidence: 0.96,
      explanation: 'Detected physical symptom concerns linked to medication ingestion. Requires medical review.'
    };
  }

  if (lower.includes('forgot') || lower.includes('memory') || lower.includes('date passed') || lower.includes('lost track')) {
    return {
      suggestedCategory: 'forgotten_appointments',
      confidence: 0.91,
      explanation: 'Detected reference to forgetting the scheduled appointment date.'
    };
  }

  if (lower.includes('work') || lower.includes('shift') || lower.includes('harvest') || lower.includes('duty') || lower.includes('busy') || lower.includes('clash') || lower.includes('conflict')) {
    return {
      suggestedCategory: 'scheduling_conflicts',
      confidence: 0.89,
      explanation: 'Detected work or daily scheduling clash with regular clinic hours.'
    };
  }

  if (lower.includes('feel fine') || lower.includes('cured') || lower.includes('no need') || lower.includes('stop taking') || lower.includes('why take')) {
    return {
      suggestedCategory: 'lack_of_awareness',
      confidence: 0.88,
      explanation: 'Detected patient belief that treatment is unnecessary because symptoms subsided.'
    };
  }

  if (lower.includes('family') || lower.includes('mother') || lower.includes('child') || lower.includes('wedding') || lower.includes('domestic') || lower.includes('personal')) {
    return {
      suggestedCategory: 'family_personal_circumstances',
      confidence: 0.86,
      explanation: 'Detected domestic or family responsibilities taking precedence.'
    };
  }

  return {
    suggestedCategory: 'other',
    confidence: 0.65,
    explanation: 'Narrative does not match standard keyword patterns. Staff review recommended.'
  };
}

/**
 * 3. Draft respectful follow-up messages for patients
 */
async function draftRespectfulMessage({ patientName, barrierCategory, program, channel = 'sms', tone = 'empathetic' }) {
  const cleanName = patientName || 'Patient';
  const category = (barrierCategory || 'general').replace(/_/g, ' ');

  const messages = {
    financial_difficulties: `Namaste ${cleanName}. We understand healthcare costs can be a burden. Nirantar and your health center have financial support and government subsidy programs available. Please speak with your ASHA worker or reply to this message so we can help coordinate care.`,
    transportation_problems: `Hello ${cleanName}. We know traveling to the clinic can be challenging right now. We offer doorstep medication delivery and travel support so your ${program || 'treatment'} is never interrupted. Let us know when it's convenient for a coordinator to call you.`,
    medication_availability: `Namaste ${cleanName}. We apologize if you experienced any difficulty getting your medicines at the facility. We have verified stock and arranged for your refill. Please let us know if you would like it delivered or held for you.`,
    reported_side_effects: `Hello ${cleanName}. Your comfort and safety are our priority. We noted your concern about how the medication made you feel. Our medical officer is ready to speak with you today to review your symptoms and adjust your plan safely.`,
    forgotten_appointments: `Namaste ${cleanName}. We missed seeing you at your scheduled follow-up! It's completely okay—we know life gets busy. Would you like us to reschedule your visit for this Wednesday or Friday morning?`,
    scheduling_conflicts: `Hello ${cleanName}. We understand work and family commitments take time. Our clinic offers early-morning and weekend outreach slots. Let us find a time that works smoothly with your schedule.`,
    general: `Namaste ${cleanName}. We are checking in from your health center team. Staying on track with your ${program || 'care'} is important to us, and we are here to support you with any difficulties you might be facing.`
  };

  const selectedText = messages[barrierCategory] || messages.general;

  return {
    draftText: `[DEMO MOCK ${channel.toUpperCase()}] ${selectedText}`,
    toneNotes: 'Drafted with trauma-informed, non-stigmatizing healthcare communication guidelines.',
    channel
  };
}

/**
 * 4. Explain existing risk-score factors in plain language
 */
async function explainRiskScore({ score, factors = [], patientName }) {
  const name = patientName || 'The patient';
  let level = 'Low Risk';
  if (score >= 60) level = 'High Risk';
  else if (score >= 30) level = 'Medium Risk';

  const factorNarratives = factors
    .filter((f) => f.points > 0)
    .map((f) => `• ${f.factor} (+${f.points} pts): ${f.description}`);

  const narrative = `Risk Assessment Analysis for ${name}:
Overall Score: ${score}/100 (${level}).
This score was determined by a transparent, rules-based continuity prioritization function designed to ensure no patient is lost to follow-up.

Key Driving Factors:
${factorNarratives.length > 0 ? factorNarratives.join('\n') : '• Patient currently shows stable attendance with no elevated risk indicators.'}

Human Clinical Review Note:
This calculation is solely an operational workflow priority indicator for healthcare workers to prioritize outreach. It does NOT constitute a clinical diagnosis or treatment decision.`;

  return {
    explanation: narrative,
    riskScore: score,
    riskLevel: level,
    factorsEvaluated: factors.length,
    disclaimer: 'Rules-based decision support tool for human review only.'
  };
}

module.exports = {
  summarizeNotes,
  categorizeBarrierFromText,
  draftRespectfulMessage,
  explainRiskScore
};
