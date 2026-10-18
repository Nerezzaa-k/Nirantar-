from typing import List, Optional, Any, Dict
from pydantic import BaseModel

class WorkerAssistantRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None

class WorkerAssistantResponse(BaseModel):
    answer: str
    grounded_records: List[str] = []
    source: str = "ai"
