import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add services/api to python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app

client = TestClient(app)


def test_get_explain_dhaka():
    """Verify SHAP explainability endpoint for Dhaka (BD3026) in English"""
    response = client.get("/api/v1/regions/BD3026/explain?lang=en")
    assert response.status_code == 200
    data = response.json()

    assert data["adm2_pcode"] == "BD3026"
    assert data["district_name"] == "Dhaka"
    assert data["explanation_method"] == "TreeExplainer (Exact Shapley Values)"
    assert len(data["top_positive_risk_drivers"]) >= 1
    assert "In Dhaka" in data["plain_language_summary"]

    # Verify Shapley additivity: sum(SHAP) + base approx equals predicted risk
    base_val = data["base_expected_value"]
    predicted_risk = data["predicted_hazard_risk_r_hat"]
    sum_shap = sum(a["shap_value"] for a in data["all_attributions"])
    reconstructed_pred = base_val + sum_shap

    assert abs(reconstructed_pred - predicted_risk) < 0.05, (
        f"Shapley sum mismatch: {reconstructed_pred} vs {predicted_risk}"
    )


def test_get_explain_bangla_localization():
    """Verify bilingual Bangla output for Sunamganj (BD6090)"""
    response = client.get("/api/v1/regions/BD6090/explain?lang=bn")
    assert response.status_code == 200
    data = response.json()

    assert data["adm2_pcode"] == "BD6090"
    assert "জেলায় দুর্যোগ ঝুঁকি বৃদ্ধির মূল কারণসমূহ" in data["plain_language_summary"]
    first_driver = data["top_positive_risk_drivers"][0]
    # Check that Bengali friendly name is returned
    assert any(char in first_driver["feature_name"] for char in ["নদী", "প্লাবন", "ভূমি", "উচ্চতা", "তাপদাহ"])


def test_get_explain_invalid_district():
    """Verify 404 for non-existent district"""
    response = client.get("/api/v1/regions/BD9999/explain")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
