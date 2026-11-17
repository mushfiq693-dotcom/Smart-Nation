from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.security import get_current_user, Role
from app.core.audit import log_audit_event
from app.db.session import get_db
from app.db.models import PolicyScenario
from app.engines.equity_optimizer import equity_optimizer, INTERVENTION_PROFILES

router = APIRouter(prefix="/simulate", tags=["ClimAct Twin Policy Simulation Studio"])


class SimulationRequest(BaseModel):
    budget_usd: float = Field(500000.0, ge=10000.0, le=50000000.0, description="Constrained budget in USD")
    alpha_equity: float = Field(0.50, ge=0.0, le=1.0, description="Equity Weighting Factor slider (0.0 to 1.0)")
    w_risk: float = Field(1.0, ge=0.1, le=5.0, description="Sector risk weight multiplier")
    sector_weights: Optional[Dict[str, float]] = Field(
        default_factory=lambda: {"heat": 0.35, "flood": 0.35, "air": 0.15, "elevation": 0.15}
    )
    intervention_type: str = Field("balanced_resilience_mix", description="Intervention package type")


@router.post("", summary="Run ClimAct Twin 'What-If' policy simulation & equity allocation")
def run_policy_simulation(
    request: SimulationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Executes prescriptive budget allocation across Bangladesh districts
    using the equity-weighted mathematical formula and saves the scenario.
    """
    sim_result = equity_optimizer.run_simulation(
        budget_usd=request.budget_usd,
        alpha_equity=request.alpha_equity,
        w_risk=request.w_risk,
        sector_weights=request.sector_weights,
        intervention_type=request.intervention_type,
    )

    # Persist in PostgreSQL 'policy_scenarios' table
    author = current_user.get("username") or current_user.get("sub", "analyst")
    scenario_record = PolicyScenario(
        created_by=author,
        admin_level="adm2",
        budget_usd=sim_result["budget_usd"],
        alpha_equity=sim_result["alpha_equity"],
        sector_weights=sim_result["sector_weights"],
        allocations=sim_result["allocations"],
        is_exploratory=True,
        approved_by_human=False,
    )

    try:
        db.add(scenario_record)
        db.commit()
        db.refresh(scenario_record)
        scenario_id = scenario_record.id
    except Exception as e:
        db.rollback()
        print(f"[Warning] Failed to persist scenario to database: {e}")
        scenario_id = "ephemeral_demo_uuid"

    sim_result["scenario_id"] = scenario_id
    sim_result["created_by"] = author

    background_tasks.add_task(
        log_audit_event,
        actor_role=current_user.get("role", Role.PUBLIC_PORTAL),
        action_type="SIMULATION_RUN",
        endpoint="/api/v1/simulate",
        payload_summary={
            "scenario_id": scenario_id,
            "budget_usd": request.budget_usd,
            "alpha_equity": request.alpha_equity,
            "intervention_type": request.intervention_type,
        },
    )

    return sim_result


@router.get("/interventions", summary="List candidate urban resilience intervention profiles")
def list_interventions():
    """Returns available intervention packages with cost parameters"""
    return INTERVENTION_PROFILES


@router.get("/scenarios", summary="List recent simulated policy scenarios")
def list_scenarios(
    db: Session = Depends(get_db),
    limit: int = 20,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Fetches saved scenarios from PostgreSQL database"""
    scenarios = db.query(PolicyScenario).order_by(PolicyScenario.created_at.desc()).limit(limit).all()
    return {
        "total_returned": len(scenarios),
        "scenarios": [s.to_dict() for s in scenarios],
    }


@router.get("/scenarios/{scenario_id}", summary="Get detailed scenario by UUID")
def get_scenario_by_id(
    scenario_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Retrieves full scenario details and district allocations"""
    scenario = db.query(PolicyScenario).filter(PolicyScenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy scenario '{scenario_id}' not found.",
        )
    return scenario.to_dict()
