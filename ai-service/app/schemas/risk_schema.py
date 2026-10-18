from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class FactorItem(BaseModel):
    factor: str
    points: int = 0
    maxPoints: Optional[int] = None
    description: Optional[str] = None
    underlyingData: Optional[Any] = None

class ActionItem(BaseModel):
    action: str
    priority: str = "medium"
    requires_human_review: bool = True

class ExplainRiskRequest(BaseModel):
    score: int
    category: str
    factor_breakdown: List[Dict[str, Any]] = Field(default_factory=list)
    missing_data_points: List[str] = Field(default_factory=list)
    patient_name: Optional[str] = "Patient"
    condition_name: Optional[str] = "Hypertension"

class ContributingFactor(BaseModel):
    factor: str
    points: int

class ExplainRiskResponse(BaseModel):
    summary: str
    contributing_factors: List[ContributingFactor]
    recommended_actions: List[ActionItem]
    limitations: List[str]
    source: str = "ai"
