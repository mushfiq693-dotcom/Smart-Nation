import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engines.equity_optimizer import equity_optimizer, DHAKA_INTERVENTIONS

client = TestClient(app)


def test_dhaka_simulation_engine():
    """Verify in-process Dhaka Megacity simulation runs over 8 micro-zones"""
    result = equity_optimizer.run_dhaka_simulation(
        budget_usd=300000.0,
        alpha_equity=0.60,
        intervention_type="dhaka_cool_roofs",
    )
    assert result["scope"] == "dhaka_megacity"
    assert result["total_districts_funded"] == 8
    assert len(result["allocations"]) == 8
    assert result["total_allocated_usd"] == 300000.0
    assert result["total_estimated_protected_population"] > 0
    assert 0.0 <= result["equity_gini_coefficient"] <= 1.0

    # Ensure allocations are sorted by priority score
    scores = [a["priority_score"] for a in result["allocations"]]
    assert scores == sorted(scores, reverse=True)


def test_dhaka_simulation_api_endpoint():
    """Verify POST /api/v1/simulate with scope='dhaka' returns 200 OK and persists"""
    payload = {
        "budget_usd": 250000.0,
        "alpha_equity": 0.50,
        "w_risk": 1.0,
        "scope": "dhaka",
        "intervention_type": "dhaka_balanced_package",
    }
    response = client.post("/api/v1/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scope"] == "dhaka_megacity"
    assert data["total_districts_funded"] == 8
    assert len(data["allocations"]) == 8
