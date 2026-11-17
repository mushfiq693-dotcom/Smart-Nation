import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add services/api to python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.core.security import Role, create_access_token
from app.core.audit import sanitize_payload

client = TestClient(app)


def test_public_system_status_endpoint():
    """Verify that unauthenticated/public users can access transparency status"""
    response = client.get("/api/v1/governance/system-status")
    assert response.status_code == 200
    data = response.json()
    assert data["transparency_portal"] == "Active"
    assert data["viewer_role"] == Role.PUBLIC_PORTAL


def test_rbac_audit_logs_forbidden_for_public():
    """Verify that Public_Portal is blocked from sensitive audit logs (403)"""
    token = create_access_token({"sub": "guest", "role": Role.PUBLIC_PORTAL})
    response = client.get(
        "/api/v1/governance/audit-logs",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


def test_rbac_audit_logs_forbidden_for_analyst():
    """Verify that Municipal_Analyst cannot view admin/reviewer audit logs (403)"""
    token = create_access_token({"sub": "dhaka_analyst", "role": Role.MUNICIPAL_ANALYST})
    response = client.get(
        "/api/v1/governance/audit-logs",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403


def test_rbac_audit_logs_allowed_for_reviewer():
    """Verify that Policy_Reviewer CAN access audit logs (200)"""
    token = create_access_token({"sub": "planning_reviewer", "role": Role.POLICY_REVIEWER})
    response = client.get(
        "/api/v1/governance/audit-logs",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "logs" in data
    assert data["requested_by"] == "planning_reviewer"


def test_rbac_audit_logs_allowed_for_admin():
    """Verify that System_Admin CAN access audit logs (200)"""
    token = create_access_token({"sub": "admin_master", "role": Role.SYSTEM_ADMIN})
    response = client.get(
        "/api/v1/governance/audit-logs",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "logs" in data
    assert data["requested_by"] == "admin_master"


def test_payload_sanitization():
    """Verify that sensitive authentication credentials are scrubbed before logging"""
    raw_payload = {
        "username": "test_user",
        "password": "super_secret_password_123",
        "api_key": "secret_gemini_api_key",
        "safe_query": {"budget": 500000, "alpha_equity": 0.5},
    }
    sanitized = sanitize_payload(raw_payload)
    assert sanitized["password"] == "[REDACTED]"
    assert sanitized["api_key"] == "[REDACTED]"
    assert sanitized["safe_query"]["budget"] == 500000


def test_nrb_open_model_hub_metadata():
    """Verify that the NRB Open-Model Hub exposes model card and artifact references"""
    res = client.get("/api/v1/governance/nrb-hub")
    assert res.status_code == 200
    data = res.json()
    assert "hub_name" in data
    assert "model_card" in data
    assert data["model_card"]["metrics"]["out_of_fold_r2"] == 0.815
    assert len(data["artifacts"]) >= 4
    assert "contribution_guidelines" in data


def test_download_model_artifact_hazard_model():
    """Verify direct download of open model artifact"""
    res = client.get("/api/v1/governance/model-artifacts/hazard_model.json")
    assert res.status_code == 200
    assert "application/json" in res.headers.get("content-type", "")


def test_download_model_artifact_invalid_filename():
    """Verify 404 for unapproved artifact request"""
    res = client.get("/api/v1/governance/model-artifacts/unauthorized_file.txt")
    assert res.status_code == 404
