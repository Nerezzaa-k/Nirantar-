from typing import List, Dict, Any
from app.schemas.risk_schema import ExplainRiskResponse, ContributingFactor, ActionItem
from app.schemas.reason_schema import ClassifyReasonResponse
from app.schemas.intervention_schema import RecommendInterventionResponse, PrimaryRecommendation, AltAction
from app.schemas.district_schema import DistrictSummaryResponse
from app.schemas.assistant_schema import WorkerAssistantResponse

class FallbackService:
    @staticmethod
    def explain_risk(score: int, category: str, factor_breakdown: List[Dict[str, Any]], missing_data_points: List[str], patient_name: str, condition_name: str) -> ExplainRiskResponse:
        positive_factors = [f for f in factor_breakdown if f.get("points", 0) > 0]
        positive_factors.sort(key=lambda x: x.get("points", 0), reverse=True)

        contributing = [ContributingFactor(factor=f.get("factor", "Risk Factor"), points=int(f.get("points", 0))) for f in positive_factors]
        top_str = ", ".join([f"{f.get('factor')} (+{f.get('points')} pts)" for f in positive_factors[:3]]) or "routine baseline factors"

        summary = f"{patient_name} has an explainable adherence risk score of {score}/100 ({category.upper()} risk) for {condition_name}. Flagged primarily due to: {top_str}."

        recommended_actions = []
        if category.lower() == "high":
            recommended_actions.append(ActionItem(
                action=f"Schedule urgent in-person outreach or doorstep refill for {patient_name} within 48 hours.",
                priority="high",
                requires_human_review=True
            ))
            recommended_actions.append(ActionItem(
                action="Verify why latest refill was delayed and coordinate with village ASHA worker.",
                priority="high",
                requires_human_review=True
            ))
        else:
            recommended_actions.append(ActionItem(
                action="Send routine reminder and check availability of next refill batch.",
                priority="medium",
                requires_human_review=False
            ))

        limitations = missing_data_points if missing_data_points else [
            "Longitudinal clinic vitals are sparse. Risk score reflects non-adherence likelihood, not a medical diagnosis."
        ]

        return ExplainRiskResponse(
            summary=summary,
            contributing_factors=contributing,
            recommended_actions=recommended_actions,
            limitations=limitations,
            source="deterministic-protocol"
        )

    @staticmethod
    def classify_reason(selected_reason: str, note: str, condition_name: str) -> ClassifyReasonResponse:
        reason_lower = (selected_reason or "").lower()
        note_lower = (note or "").lower()

        is_side_effect = "side effect" in reason_lower or "side effect" in note_lower
        is_travel = "travel" in reason_lower or "cannot travel" in reason_lower
        is_stock = "medicine" in reason_lower or "unavailable" in reason_lower or "no stock" in reason_lower
        is_feels_fine = "feels fine" in reason_lower or "no longer need" in reason_lower

        if is_side_effect:
            category = "I am experiencing side effects"
            action_cat = "clinical_escalation"
            priority = "urgent"
            explanation = "Patient reported adverse symptoms or side effects requiring clinical evaluation."
        elif is_travel:
            category = "I cannot travel to the healthcare facility"
            action_cat = "doorstep_refill"
            priority = "high"
            explanation = "Patient faces physical or geographical barrier traveling to the PHC facility."
        elif is_stock:
            category = "Medicine is unavailable"
            action_cat = "stock_escalation"
            priority = "high"
            explanation = "Medication supply stockout reported at primary distribution point."
        elif is_feels_fine:
            category = "Feels fine and thinks treatment is unnecessary"
            action_cat = "counselling"
            priority = "medium"
            explanation = "Asymptomatic misunderstanding; patient may believe medication is only needed when symptoms appear."
        else:
            category = selected_reason or "Other"
            action_cat = "human_followup"
            priority = "medium"
            explanation = note or "Barrier reported requiring community follow-up."

        return ClassifyReasonResponse(
            normalized_category=category,
            explanation=explanation,
            recommended_intervention_category=action_cat,
            priority_suggestion=priority,
            requires_human_review=True,
            source="deterministic-protocol"
        )

    @staticmethod
    def recommend_intervention(patient_id: str, reported_reason: str, condition_name: str, risk_score: int, available_stock: Any) -> RecommendInterventionResponse:
        mapping = {
            "I cannot travel to the healthcare facility": (
                "Add the patient to an eligible village doorstep refill or outreach batch",
                "doorstep_refill",
                "high",
                "Distance/road barrier prevents facility visit. Doorstep delivery maintains uninterrupted pill count."
            ),
            "Feels fine and thinks treatment is unnecessary": (
                "Deliver hypertension/diabetes counselling script with family buddy support",
                "counselling",
                "medium",
                "Chronic silent diseases (hypertension) require continuous treatment even in absence of acute symptoms."
            ),
            "Medicine is unavailable": (
                "Identify alternate pharmacy with stock and escalate stockout requisition to PHC pharmacist",
                "stock_escalation",
                "high",
                "Prescription adherence halted due to supply chain stockout. Alternate facility sourcing required."
            ),
            "I am experiencing side effects": (
                "Escalate directly to Medical Officer. Do not change dose or stop therapy independently.",
                "clinical_escalation",
                "urgent",
                "Clinical safety mandate: Side effects require physician examination."
            ),
            "I forgot my medication or appointment": (
                "Offer SMS/IVR reminders and establish family caregiver daily reminder plan",
                "reminder_plan",
                "low",
                "Cognitive routine lapses respond well to structured family and SMS cues."
            )
        }

        action, itype, prio, rat = mapping.get(
            reported_reason,
            ("Schedule human follow-up to understand adherence barrier", "human_followup", "medium", "Comprehensive home visit required to assess personal and social barriers.")
        )

        return RecommendInterventionResponse(
            primary_recommendation=PrimaryRecommendation(
                action=action,
                intervention_type=itype,
                priority=prio,
                rationale=rat
            ),
            alternative_actions=[
                AltAction(action="Assign local ASHA worker for home visit check."),
                AltAction(action="Review upcoming village health and nutrition day (VHND) schedule.")
            ],
            safety_guardrails=[
                "AI must not prescribe medication or change dosages.",
                "Adverse reactions must be referred to a registered medical officer.",
                "Do not promise medicine availability without confirmed inventory stock."
            ],
            source="deterministic-protocol"
        )

    @staticmethod
    def district_summary(totalPatients: int, highRiskCount: int, topReasons: List[Dict[str, Any]], hotspots: List[Dict[str, Any]]) -> DistrictSummaryResponse:
        overview = f"Across the monitored sub-district, {totalPatients} patients are enrolled in long-term non-communicable disease and infectious disease programs, with {highRiskCount} ({round((highRiskCount/max(totalPatients, 1))*100)}%) classified as high risk of dropping out."
        recommendations = [
            "Deploy mobile village doorstep refill distribution to top remote hotspots.",
            "Conduct stock audit across PHCs where medicine unavailability was flagged.",
            "Initiate counselling refresher with ASHA workers regarding asymptomatic adherence for hypertension.",
            "Offer extended clinic hours on Saturdays to support day-wage workers."
        ]
        return DistrictSummaryResponse(
            overview=overview,
            critical_hotspots=hotspots or [],
            predominant_barriers=topReasons or [],
            actionable_recommendations=recommendations,
            source="deterministic-protocol"
        )

    @staticmethod
    def worker_assistant(query: str, context: Dict[str, Any]) -> WorkerAssistantResponse:
        q = (query or "").lower()
        if "high risk" in q or "flagged" in q:
            ans = "A patient is flagged as high risk when their score reaches 60+. The top drivers are: medication refill overdue (>5 days grace period), missed follow-up appointments, worsening blood pressure readings, and remote distance from the PHC."
        elif "cannot travel" in q or "travel" in q:
            ans = "For patients reporting travel difficulty, Nirantar recommends adding them to the village doorstep refill batch. ASHA workers carry the sealed blister packs during scheduled village rounds, eliminating travel expenses for the patient."
        elif "side effect" in q or "reaction" in q:
            ans = "SAFETY PROTOCOL: Side effects must be immediately escalated to the PHC Medical Officer. Care workers must never advise stopping or altering doses independently."
        elif "refill" in q or "stock" in q:
            ans = "When medicine is unavailable at the primary PHC, check nearby facilities in the inventory tab or escalate an urgent stock requisition before the patient's existing tablets are exhausted."
        else:
            ans = "Nirantar AI Assistant: I can help explain patient risk scores, recommend community interventions, review barrier classifications, and look up facility stock statuses."

        return WorkerAssistantResponse(
            answer=ans,
            grounded_records=["Nirantar v3 Clinical Adherence Guidelines", "National Health Mission NCD Protocol"],
            source="deterministic-protocol"
        )

fallback_service = FallbackService()
