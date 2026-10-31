"""
Integration Tests for Flask Web API Endpoints
"""

import json
from src.api.app import app


def test_health_endpoint():
    client = app.test_client()
    resp = client.get("/health")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["status"] == "ok"
    assert "version" in data


def test_normalize_input_endpoint():
    client = app.test_client()
    resp = client.post("/normalize-input", json={"text": "mujhe tez bukhar hai"})
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert "normalized_text" in data
    assert "fever" in data["normalized_text"]


def test_predict_endpoint_contract():
    client = app.test_client()
    payload = {
        "text": "high fever, severe headache, stiff neck. Age 28",
        "gender": "male",
    }
    resp = client.post("/predict", json=payload)
    assert resp.status_code == 200
    data = json.loads(resp.data)

    # Verify critical contracts expected by frontend & backend
    assert "predictions" in data
    assert isinstance(data["predictions"], list)
    assert len(data["predictions"]) > 0
    assert "triage" in data
    assert "detected_symptoms" in data
    assert "doctor_recommendations" in data
    assert "follow_up" in data
    assert "session_id" in data


def test_predict_endpoint_gibberish_guardrail():
    client = app.test_client()
    resp = client.post("/predict", json={"text": "asdf qwer zxcv 12345"})
    assert resp.status_code in (400, 422)
    data = json.loads(resp.data)
    assert "error" in data
