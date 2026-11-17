import sys
from pathlib import Path
from fastapi.testclient import TestClient
from datetime import date

# Add services/api to python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.core.security import Role, create_access_token

client = TestClient(app)


def get_token(role: str = Role.POLICY_REVIEWER) -> str:
    return create_access_token({
        "sub": f"test_{role.lower()}",
        "username": f"test_{role.lower()}",
        "role": role,
    })


def test_list_outcomes_endpoint():
    """Verify GET /api/v1/outcomes returns structured summary and list"""
    res = client.get("/api/v1/outcomes")
    assert res.status_code == 200
    data = res.json()

    assert "total_count" in data
    assert "summary" in data
    assert "outcomes" in data

    summary = data["summary"]
    assert "total_outcomes" in summary
    assert "planned" in summary
    assert "active" in summary
    assert "under_review" in summary
    assert "completed" in summary


def test_filter_outcomes_by_status():
    """Verify status query filtering"""
    res = client.get("/api/v1/outcomes?status=Planned")
    assert res.status_code == 200
    data = res.json()
    for o in data["outcomes"]:
        assert o["status"] == "Planned"


def test_create_outcome_rbac_restrictions():
    """Verify that unauthenticated / public portal cannot create outcomes, but reviewer can"""
    payload = {
        "title": "Gaibandha Solar AQ Sensor Deployment",
        "target_pcode": "BD5532",
        "responsible_agency": "Department of Environment (DoE)",
        "indicator_code": "ACTIVE_AIR_SENSORS_COUNT",
        "baseline_value": 0.0,
        "target_value": 3.0,
        "review_date": str(date.today()),
        "evidence_url": "https://doe.gov.bd/reports/gaibandha_aq_2026.pdf",
    }

    # 1. Public Portal (unauthenticated) -> 403 Forbidden
    res_public = client.post("/api/v1/outcomes", json=payload)
    assert res_public.status_code == 403

    # 2. Policy Reviewer -> 201 Created
    reviewer_token = get_token(Role.POLICY_REVIEWER)
    res_reviewer = client.post(
        "/api/v1/outcomes",
        json=payload,
        headers={"Authorization": f"Bearer {reviewer_token}"},
    )
    assert res_reviewer.status_code == 201
    created_data = res_reviewer.json()
    assert created_data["title"] == payload["title"]
    assert created_data["target_pcode"] == "BD5532"
    assert created_data["status"] == "Planned"
    assert float(created_data["target_value"]) == 3.0


def test_update_outcome_lifecycle():
    """Verify that Policy Reviewer can update observed value and status"""
    # Create an outcome first
    reviewer_token = get_token(Role.POLICY_REVIEWER)
    create_payload = {
        "title": "Sylhet Canal Desiltation Milestone",
        "target_pcode": "BD6090",
        "responsible_agency": "MoDMR / LGED",
        "indicator_code": "DRAINAGE_DESILTATION_PCT",
        "baseline_value": 15.0,
        "target_value": 85.0,
        "review_date": str(date.today()),
    }
    create_res = client.post(
        "/api/v1/outcomes",
        json=create_payload,
        headers={"Authorization": f"Bearer {reviewer_token}"},
    )
    assert create_res.status_code == 201
    outcome_id = create_res.json()["id"]

    # Update with empirical field observation
    update_payload = {
        "observed_value": 72.5,
        "status": "Under_Review",
        "evidence_url": "https://lged.gov.bd/field-audit/sylhet-q2.pdf",
    }
    update_res = client.patch(
        f"/api/v1/outcomes/{outcome_id}",
        json=update_payload,
        headers={"Authorization": f"Bearer {reviewer_token}"},
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()

    assert float(updated_data["observed_value"]) == 72.5
    assert updated_data["status"] == "Under_Review"
    assert updated_data["evidence_url"] == update_payload["evidence_url"]


def test_update_outcome_not_found():
    """Verify 404 when updating non-existent outcome ID"""
    reviewer_token = get_token(Role.POLICY_REVIEWER)
    res = client.patch(
        "/api/v1/outcomes/non-existent-uuid-9999",
        json={"status": "Completed"},
        headers={"Authorization": f"Bearer {reviewer_token}"},
    )
    assert res.status_code == 404
