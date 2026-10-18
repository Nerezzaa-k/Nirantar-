from typing import Optional
from pydantic import BaseModel

class ClassifyReasonRequest(BaseModel):
    selected_reason: str
    note: Optional[str] = ""
    condition_name: Optional[str] = "Hypertension"

class ClassifyReasonResponse(BaseModel):
    normalized_category: str
    explanation: str
    recommended_intervention_category: str
    priority_suggestion: str
    requires_human_review: bool = True
    source: str = "ai"
