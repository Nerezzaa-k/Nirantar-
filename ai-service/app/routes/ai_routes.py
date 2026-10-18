from fastapi import APIRouter, Depends
from app.security.auth import verify_internal_secret
from app.schemas.risk_schema import ExplainRiskRequest, ExplainRiskResponse
from app.schemas.reason_schema import ClassifyReasonRequest, ClassifyReasonResponse
from app.schemas.intervention_schema import RecommendInterventionRequest, RecommendInterventionResponse
from app.schemas.district_schema import DistrictSummaryRequest, DistrictSummaryResponse
from app.schemas.assistant_schema import WorkerAssistantRequest, WorkerAssistantResponse
from app.services.openai_service import openai_service

router = APIRouter(prefix="/api/ai", dependencies=[Depends(verify_internal_secret)])

@router.post("/explain-risk", response_model=ExplainRiskResponse)
def explain_risk(req: ExplainRiskRequest):
    return openai_service.explain_risk(
        score=req.score,
        category=req.category,
        factor_breakdown=req.factor_breakdown,
        missing_data_points=req.missing_data_points,
        patient_name=req.patient_name,
        condition_name=req.condition_name
    )

@router.post("/classify-reason", response_model=ClassifyReasonResponse)
def classify_reason(req: ClassifyReasonRequest):
    return openai_service.classify_reason(
        selected_reason=req.selected_reason,
        note=req.note,
        condition_name=req.condition_name
    )

@router.post("/recommend-intervention", response_model=RecommendInterventionResponse)
def recommend_intervention(req: RecommendInterventionRequest):
    return openai_service.recommend_intervention(
        patient_id=req.patient_id,
        reported_reason=req.reported_reason,
        condition_name=req.condition_name,
        risk_score=req.risk_score,
        available_stock=req.available_stock
    )

@router.post("/district-summary", response_model=DistrictSummaryResponse)
def district_summary(req: DistrictSummaryRequest):
    return openai_service.district_summary(
        totalPatients=req.totalPatients,
        highRiskCount=req.highRiskCount,
        topReasons=req.topReasons,
        hotspots=req.hotspots
    )

@router.post("/worker-assistant", response_model=WorkerAssistantResponse)
def worker_assistant(req: WorkerAssistantRequest):
    return openai_service.worker_assistant(
        query=req.query,
        context=req.context or {}
    )
