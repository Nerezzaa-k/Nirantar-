import json
import logging
from typing import Dict, Any, List
from openai import OpenAI
from app.config import settings
from app.services.fallback_service import fallback_service
from app.schemas.risk_schema import ExplainRiskResponse
from app.schemas.reason_schema import ClassifyReasonResponse
from app.schemas.intervention_schema import RecommendInterventionResponse
from app.schemas.district_schema import DistrictSummaryResponse
from app.schemas.assistant_schema import WorkerAssistantResponse

logger = logging.getLogger("nirantar.openai")

class OpenAIService:
    def __init__(self):
        self.client = None
        if settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY.strip()) > 10:
            try:
                self.client = OpenAI(api_key=settings.OPENAI_API_KEY, timeout=10.0)
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")

    def explain_risk(self, score: int, category: str, factor_breakdown: List[Dict[str, Any]], missing_data_points: List[str], patient_name: str, condition_name: str) -> ExplainRiskResponse:
        if not self.client:
            return fallback_service.explain_risk(score, category, factor_breakdown, missing_data_points, patient_name, condition_name)

        try:
            prompt = f"""
You are an expert AI clinical adherence assistant in Nirantar v3.
Explain why this patient was flagged for adherence risk.
Patient Name: {patient_name}
Condition: {condition_name}
Risk Score: {score}/100 ({category.upper()} risk)
Contributing Factors: {json.dumps(factor_breakdown)}
Missing Data: {json.dumps(missing_data_points)}

Safety instructions:
1. Do not diagnose or alter treatment.
2. Ground all points directly in the factor breakdown.
3. Suggest practical next steps for an ASHA/community health worker.

Return JSON in this schema:
{{
  "summary": "...",
  "contributing_factors": [{{"factor": "...", "points": 10}}],
  "recommended_actions": [{{"action": "...", "priority": "high", "requires_human_review": true}}],
  "limitations": ["..."]
}}
"""
            completion = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            data = json.loads(completion.choices[0].message.content)
            data["source"] = "openai"
            return ExplainRiskResponse(**data)
        except Exception as e:
            logger.error(f"OpenAI explain_risk error: {e}")
            return fallback_service.explain_risk(score, category, factor_breakdown, missing_data_points, patient_name, condition_name)

    def classify_reason(self, selected_reason: str, note: str, condition_name: str) -> ClassifyReasonResponse:
        if not self.client:
            return fallback_service.classify_reason(selected_reason, note, condition_name)

        try:
            prompt = f"""
Classify this patient-reported barrier for {condition_name} treatment adherence:
Selected Reason: {selected_reason}
Patient Note: {note}

Safety rules:
- Side effects must be escalated to a medical officer immediately.
- Preserve patient voice; do not override user choice arbitrarily.

Return JSON:
{{
  "normalized_category": "...",
  "explanation": "...",
  "recommended_intervention_category": "...",
  "priority_suggestion": "urgent|high|medium|low",
  "requires_human_review": true
}}
"""
            completion = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            data = json.loads(completion.choices[0].message.content)
            data["source"] = "openai"
            return ClassifyReasonResponse(**data)
        except Exception as e:
            logger.error(f"OpenAI classify_reason error: {e}")
            return fallback_service.classify_reason(selected_reason, note, condition_name)

    def recommend_intervention(self, patient_id: str, reported_reason: str, condition_name: str, risk_score: int, available_stock: Any) -> RecommendInterventionResponse:
        if not self.client:
            return fallback_service.recommend_intervention(patient_id, reported_reason, condition_name, risk_score, available_stock)

        try:
            prompt = f"""
Recommend an adherence rescue intervention for:
Condition: {condition_name}
Reported Reason: {reported_reason}
Risk Score: {risk_score}
Available Stock Data: {json.dumps(available_stock)}

Safety Rules:
- Never change medication dose or stop treatment.
- Side effects escalate to doctor.

Return JSON:
{{
  "primary_recommendation": {{
    "action": "...",
    "intervention_type": "...",
    "priority": "high|medium|urgent|low",
    "rationale": "..."
  }},
  "alternative_actions": [{{"action": "..."}}],
  "safety_guardrails": ["..."]
}}
"""
            completion = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            data = json.loads(completion.choices[0].message.content)
            data["source"] = "openai"
            return RecommendInterventionResponse(**data)
        except Exception as e:
            logger.error(f"OpenAI recommend_intervention error: {e}")
            return fallback_service.recommend_intervention(patient_id, reported_reason, condition_name, risk_score, available_stock)

    def district_summary(self, totalPatients: int, highRiskCount: int, topReasons: List[Dict[str, Any]], hotspots: List[Dict[str, Any]]) -> DistrictSummaryResponse:
        if not self.client:
            return fallback_service.district_summary(totalPatients, highRiskCount, topReasons, hotspots)

        try:
            prompt = f"""
Summarize high-level district insights for PHC medical officers.
Total Patients: {totalPatients}
High Risk Count: {highRiskCount}
Top Dropout Reasons: {json.dumps(topReasons)}
Geographic Hotspots: {json.dumps(hotspots)}

Return JSON:
{{
  "overview": "...",
  "critical_hotspots": [{{"name": "...", "riskColor": "..."}}],
  "predominant_barriers": [{{"reason": "...", "percentage": 40}}],
  "actionable_recommendations": ["..."]
}}
"""
            completion = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            data = json.loads(completion.choices[0].message.content)
            data["source"] = "openai"
            return DistrictSummaryResponse(**data)
        except Exception as e:
            logger.error(f"OpenAI district_summary error: {e}")
            return fallback_service.district_summary(totalPatients, highRiskCount, topReasons, hotspots)

    def worker_assistant(self, query: str, context: Dict[str, Any]) -> WorkerAssistantResponse:
        if not self.client:
            return fallback_service.worker_assistant(query, context)

        try:
            prompt = f"""
You are Nirantar Worker Assistant, helping an ASHA/ANM care worker with treatment adherence queries.
Context: {json.dumps(context)}
User Query: {query}

Provide a concise, helpful response adhering strictly to community health protocols. Do not prescribe medicines.

Return JSON:
{{
  "answer": "...",
  "grounded_records": ["..."]
}}
"""
            completion = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            data = json.loads(completion.choices[0].message.content)
            data["source"] = "openai"
            return WorkerAssistantResponse(**data)
        except Exception as e:
            logger.error(f"OpenAI worker_assistant error: {e}")
            return fallback_service.worker_assistant(query, context)

openai_service = OpenAIService()
