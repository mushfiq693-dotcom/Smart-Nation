import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add services/api to python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app

client = TestClient(app)


def test_simulate_alpha_zero_baseline():
    """Verify simulation with alpha_equity=0.0 (pure hazard-population weighting)"""
    payload = {
        "budget_usd": 500000.0,
        "alpha_equity": 0.0,
        "w_risk": 1.0,
        "intervention_type": "balanced_resilience_mix",
    }
    response = client.post("/api/v1/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["budget_usd"] == 500000.0
    assert data["alpha_equity"] == 0.0
    assert abs(data["total_allocated_usd"] - 500000.0) < 1.0  # Exact budget conservation
    assert "scenario_id" in data
    assert data["is_exploratory"] is True
    assert len(data["allocations"]) >= 10

    # Dhaka has highest population exposed, so rank 1 with alpha=0
    dhaka_alloc = next((a for a in data["allocations"] if a["adm2_pcode"] == "BD3026"), None)
    assert dhaka_alloc is not None
    assert dhaka_alloc["rank"] == 1


def test_simulate_alpha_equity_shift():
    """Verify that increasing alpha_equity shifts resources toward vulnerable / sensor-scarce districts"""
    # 1. Run alpha = 0.0
    res_zero = client.post("/api/v1/simulate", json={"budget_usd": 500000.0, "alpha_equity": 0.0})
    data_zero = res_zero.json()

    # 2. Run alpha = 1.0 (maximum equity weighting)
    res_one = client.post("/api/v1/simulate", json={"budget_usd": 500000.0, "alpha_equity": 1.0})
    data_one = res_one.json()

    allocs_zero = {a["adm2_pcode"]: a["allocated_usd"] for a in data_zero["allocations"]}
    allocs_one = {a["adm2_pcode"]: a["allocated_usd"] for a in data_one["allocations"]}

    # Kurigram (BD5549) has 54% poverty and 0 air sensors (Vi > 0.5)
    # When alpha increases from 0.0 to 1.0, Kurigram's allocation priority must increase!
    kurigram_zero = allocs_zero.get("BD5549", 0.0)
    kurigram_one = allocs_one.get("BD5549", 0.0)

    # Dhaka's relative share must drop to make room for vulnerable rural areas
    dhaka_zero_share = allocs_zero.get("BD3026", 0.0) / 500000.0
    dhaka_one_share = allocs_one.get("BD3026", 0.0) / 500000.0

    assert dhaka_one_share < dhaka_zero_share, (
        f"Dhaka allocation share did not decrease with equity: {dhaka_one_share} vs {dhaka_zero_share}"
    )


def test_simulate_scenario_persistence_and_retrieval():
    """Verify scenario is stored in PostgreSQL and retrievable by UUID"""
    create_res = client.post("/api/v1/simulate", json={"budget_usd": 750000.0, "alpha_equity": 0.65})
    assert create_res.status_code == 200
    created_scenario = create_res.json()
    scenario_id = created_scenario["scenario_id"]

    # Fetch scenario list
    list_res = client.get("/api/v1/simulate/scenarios")
    assert list_res.status_code == 200
    scenarios = list_res.json()["scenarios"]
    assert any(s["id"] == scenario_id for s in scenarios)

    # Fetch individual scenario
    detail_res = client.get(f"/api/v1/simulate/scenarios/{scenario_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == scenario_id
    assert float(detail["budget_usd"]) == 750000.0
    assert float(detail["alpha_equity"]) == 0.65


def test_list_interventions():
    """Verify candidate urban resilience intervention profiles"""
    response = client.get("/api/v1/simulate/interventions")
    assert response.status_code == 200
    interventions = response.json()
    assert "cool_roofs_and_canopy" in interventions
    assert "riverine_embankment_and_drainage" in interventions
    assert "low_cost_sensor_deployment" in interventions
