import sys
from pathlib import Path
from datetime import date

# Add services/api to python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal, Base, engine
from app.db.models import Dataset, PolicyScenario, PolicyOutcome, AuditLog, User


def setup_module():
    Base.metadata.create_all(bind=engine)


def test_dataset_model():
    db = SessionLocal()
    dataset = db.query(Dataset).filter(Dataset.slug == "hdx-cod-ab-bgd").first()
    assert dataset is not None
    assert dataset.provenance_class == "Official"
    assert dataset.quality_report["validation_status"] == "PASSED"
    db.close()


def test_policy_scenario_and_outcome():
    db = SessionLocal()
    # Create scenario
    scenario = PolicyScenario(
        created_by="dhaka_analyst",
        admin_level="adm2",
        budget_usd=500000.00,
        alpha_equity=0.50,
        sector_weights={"heat": 0.4, "flood": 0.4, "air": 0.2},
        allocations=[
            {"pcode": "BD3026", "district": "Dhaka", "allocated_usd": 150000, "rank": 1},
            {"pcode": "BD4047", "district": "Khulna", "allocated_usd": 120000, "rank": 2},
        ],
        is_exploratory=True,
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)

    assert scenario.id is not None
    assert float(scenario.alpha_equity) == 0.50

    # Create associated outcome
    outcome = PolicyOutcome(
        scenario_id=scenario.id,
        title="Urban Tree Canopy & Cooling Center Deployment",
        target_pcode="BD3026",
        responsible_agency="Dhaka North City Corporation (DNCC)",
        indicator_code="apparent_temp_anomaly_c",
        baseline_value=38.5,
        target_value=35.0,
        status="Planned",
        review_date=date(2027, 6, 30),
    )
    db.add(outcome)
    db.commit()
    db.refresh(outcome)

    assert outcome.id is not None
    assert outcome.scenario_id == scenario.id
    assert outcome.status == "Planned"

    # Query back via relationship
    reloaded_scenario = db.query(PolicyScenario).filter(PolicyScenario.id == scenario.id).first()
    assert len(reloaded_scenario.outcomes) >= 1
    assert reloaded_scenario.outcomes[0].target_pcode == "BD3026"
    db.close()


def test_audit_log_model():
    db = SessionLocal()
    log_entry = AuditLog(
        actor_role="Municipal_Analyst",
        action_type="SIMULATION_RUN",
        endpoint="/api/v1/simulate",
        payload_summary={"budget_usd": 500000, "alpha_equity": 0.5},
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    assert log_entry.id is not None
    assert log_entry.actor_role == "Municipal_Analyst"
    assert log_entry.payload_summary["alpha_equity"] == 0.5
    db.close()


def test_user_rbac():
    db = SessionLocal()
    users = db.query(User).all()
    roles = {u.role for u in users}
    assert "Public_Portal" in roles
    assert "Municipal_Analyst" in roles
    assert "Policy_Reviewer" in roles
    assert "System_Admin" in roles
    db.close()
