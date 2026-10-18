from typing import List, Optional, Any, Dict
from pydantic import BaseModel

class DistrictSummaryRequest(BaseModel):
    totalPatients: Optional[int] = 0
    highRiskCount: Optional[int] = 0
    topReasons: Optional[List[Dict[str, Any]]] = None
    hotspots: Optional[List[Dict[str, Any]]] = None

class DistrictSummaryResponse(BaseModel):
    overview: str
    critical_hotspots: List[Dict[str, Any]]
    predominant_barriers: List[Dict[str, Any]]
    actionable_recommendations: List[str]
    source: str = "ai"
