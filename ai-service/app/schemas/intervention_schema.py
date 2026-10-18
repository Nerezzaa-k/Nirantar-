from typing import List, Optional, Any
from pydantic import BaseModel

class RecommendInterventionRequest(BaseModel):
    patient_id: str
    reported_reason: str
    condition_name: Optional[str] = "Hypertension"
    risk_score: Optional[int] = 50
    available_stock: Optional[Any] = None

class PrimaryRecommendation(BaseModel):
    action: str
    intervention_type: str
    priority: str
    rationale: str

class AltAction(BaseModel):
    action: str

class RecommendInterventionResponse(BaseModel):
    primary_recommendation: PrimaryRecommendation
    alternative_actions: List[AltAction]
    safety_guardrails: List[str]
    source: str = "ai"
