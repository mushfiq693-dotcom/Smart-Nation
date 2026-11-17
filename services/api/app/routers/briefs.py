"""
CivicSphere AI & ClimAct Twin — Router 07:
AI Institutional Policy Brief Generator & Markdown Memo Exporter.

Exposes endpoints to generate, inspect, and download 6-section evidence-backed
policy briefs grounded in DuckDB Spatial, XGBoost SHAP, and Equity Optimizer simulation runs.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.security import get_current_user, Role
from app.core.audit import log_audit_event
from app.db.session import get_db
from app.db.models import PolicyScenario, PolicyOutcome
from app.engines.brief_generator import policy_brief_generator
from app.engines.equity_optimizer import equity_optimizer

router = APIRouter(prefix="/briefs", tags=["AI Institutional Policy Brief Generator"])


class BriefGenerationRequest(BaseModel):
    scenario_id: Optional[str] = Field(None, description="UUID of existing PolicyScenario. If omitted, uses latest scenario.")
    lang: str = Field("en", pattern="^(en|bn)$", description="Language code: 'en' for English, 'bn' for Bengali")
    custom_notes: Optional[str] = Field(None, description="Optional ministerial directives or stakeholder mandate")
    save_as_outcomes: bool = Field(False, description="Whether to automatically register the generated KPIs into policy_outcomes")


class PolicyBriefResponse(BaseModel):
    brief_id: str
    scenario_id: str
    generated_at: str
    language: str
    title: str
    classification: str
    scenario_summary: Dict[str, Any]
    sections: List[Dict[str, Any]]
    kpis: List[Dict[str, Any]]
    citations: List[Dict[str, Any]]
    markdown_memo: str
    compliance_statement: str
    saved_outcomes_count: int = 0


@router.post("/generate", summary="Generate a 6-section evidence-grounded AI Policy Brief", response_model=PolicyBriefResponse)
def generate_policy_brief(
    request: BriefGenerationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Synthesizes an institutional policy memorandum from a simulated scenario.
    Extracts deterministic data from DuckDB Spatial, XGBoost SHAP attributions,
    and cross-referenced NAP 2023 / Mujib Climate Prosperity Plan guidelines.
    """
    scenario = None
    if request.scenario_id:
        scenario = db.query(PolicyScenario).filter(PolicyScenario.id == request.scenario_id).first()
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Policy scenario '{request.scenario_id}' not found.",
            )
    else:
        # Fetch the most recent scenario
        scenario = db.query(PolicyScenario).order_by(PolicyScenario.created_at.desc()).first()

    if scenario:
        scenario_data = scenario.to_dict()
        scenario_id_val = scenario.id
    else:
        # Fallback to in-process default simulation
        scenario_data = equity_optimizer.run_simulation(budget_usd=500000.0, alpha_equity=0.50)
        scenario_id_val = "sim-fallback-baseline"

    # Synthesize Brief
    brief_result = policy_brief_generator.generate_brief(
        scenario_data=scenario_data,
        scenario_id=scenario_id_val,
        lang=request.lang,
        custom_notes=request.custom_notes,
    )

    saved_outcomes_count = 0
    # Optional persistence into Closed-Loop Outcomes Tracker
    if request.save_as_outcomes and scenario:
        for kpi in brief_result.get("kpis", []):
            try:
                review_dt = datetime.strptime(kpi["review_date"], "%Y-%m-%d").date()
                outcome = PolicyOutcome(
                    scenario_id=scenario.id,
                    title=kpi["title"],
                    target_pcode=kpi["target_pcode"],
                    responsible_agency=kpi["responsible_agency"],
                    indicator_code=kpi["indicator_code"],
                    baseline_value=kpi["baseline_value"],
                    target_value=kpi["target_value"],
                    observed_value=None,
                    status=kpi.get("status", "Planned"),
                    review_date=review_dt,
                    evidence_url=f"/api/v1/briefs/{scenario.id}",
                )
                db.add(outcome)
                saved_outcomes_count += 1
            except Exception as e:
                print(f"[Warning] Failed to save outcome: {e}")
        if saved_outcomes_count > 0:
            db.commit()

    brief_result["saved_outcomes_count"] = saved_outcomes_count

    # Audit logging
    background_tasks.add_task(
        log_audit_event,
        actor_role=current_user.get("role", Role.PUBLIC_PORTAL),
        action_type="BRIEF_GENERATE",
        endpoint="/api/v1/briefs/generate",
        payload_summary={
            "brief_id": brief_result["brief_id"],
            "scenario_id": scenario_id_val,
            "language": request.lang,
            "saved_outcomes": saved_outcomes_count,
        },
    )

    return brief_result


@router.get("/{scenario_id}", summary="Retrieve or generate policy brief for a scenario")
def get_policy_brief_by_scenario_id(
    scenario_id: str,
    lang: str = Query("en", pattern="^(en|bn)$", description="Language: 'en' or 'bn'"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Returns structured JSON policy brief for a given scenario UUID"""
    scenario = db.query(PolicyScenario).filter(PolicyScenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy scenario '{scenario_id}' not found.",
        )

    brief_result = policy_brief_generator.generate_brief(
        scenario_data=scenario.to_dict(),
        scenario_id=scenario.id,
        lang=lang,
    )
    return brief_result


@router.get("/{scenario_id}/markdown", summary="Download full Markdown policy memorandum")
def download_markdown_memo(
    scenario_id: str,
    lang: str = Query("en", pattern="^(en|bn)$", description="Language: 'en' or 'bn'"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Returns plain text / markdown file for executive review and printing"""
    scenario = db.query(PolicyScenario).filter(PolicyScenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy scenario '{scenario_id}' not found.",
        )

    brief_result = policy_brief_generator.generate_brief(
        scenario_data=scenario.to_dict(),
        scenario_id=scenario.id,
        lang=lang,
    )

    filename = f"policy_memo_{scenario_id[:8]}_{lang}.md"
    return Response(
        content=brief_result["markdown_memo"],
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
