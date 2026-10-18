import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

HEADERS = {
    "X-Internal-Secret": settings.AI_SERVICE_SECRET
}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "nirantar-ai-service"

def test_auth_rejection():
    # Calling AI endpoint without secret header should fail with 401
    response = client.post("/api/ai/classify-reason", json={"selected_reason": "Medicine is unavailable"})
    assert response.status_code == 401

def test_explain_risk_fallback():
    payload = {
        "score": 75,
        "category": "high",
        "factor_breakdown": [
            {"factor": "Refill Overdue", "points": 25, "maxPoints": 25},
            {"factor": "Visit Interval Overdue", "points": 20, "maxPoints": 20},
            {"factor": "Rising BP Trend", "points": 15, "maxPoints": 15}
        ],
        "missing_data_points": [],
        "patient_name": "Ramesh Kumar",
        "condition_name": "Hypertension"
    }
    response = client.post("/api/ai/explain-risk", json=payload, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "Ramesh Kumar" in data["summary"]
    assert len(data["contributing_factors"]) == 3
    assert len(data["recommended_actions"]) > 0

def test_classify_reason():
    payload = {
        "selected_reason": "I cannot travel to the healthcare facility",
        "note": "Flooded road, cannot reach clinic.",
        "condition_name": "Hypertension"
    }
    response = client.post("/api/ai/classify-reason", json=payload, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["normalized_category"] == "I cannot travel to the healthcare facility"
    assert data["recommended_intervention_category"] == "doorstep_refill"
    assert data["requires_human_review"] is True

def test_recommend_intervention():
    payload = {
        "patient_id": "PAT-1001",
        "reported_reason": "I cannot travel to the healthcare facility",
        "condition_name": "Hypertension",
        "risk_score": 75
    }
    response = client.post("/api/ai/recommend-intervention", json=payload, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "primary_recommendation" in data
    assert "doorstep refill" in data["primary_recommendation"]["action"].lower()
    assert len(data["safety_guardrails"]) > 0

def test_worker_assistant():
    payload = {
        "query": "What should I do for a patient who cannot travel?",
        "context": {"patientName": "Ramesh Kumar"}
    }
    response = client.post("/api/ai/worker-assistant", json=payload, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert len(data["answer"]) > 20
