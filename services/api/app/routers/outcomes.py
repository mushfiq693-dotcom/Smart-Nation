"""
CivicSphere AI & ClimAct Twin — Router 08:
Closed-Loop Policy Outcomes Tracker API.

Enables multi-agency verification, baseline-to-target tracking,
and field evidence auditing for climate interventions across Bangladesh districts.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.security import get_current_user, require_role, Role
from app.core.audit import log_audit_event
from app.db.session import get_db
from app.db.models import PolicyOutcome, PolicyScenario

router = APIRouter(prefix="/outcomes", tags=["Closed-Loop Policy Outcomes Tracker"])


class OutcomeCreateRequest(BaseModel):
    scenario_id: Optional[str] = Field(None, description="Linked simulation scenario UUID")
    title: str = Field(..., description="Actionable title of policy intervention milestone")
    target_pcode: str = Field(..., description="Target district ADM2 P-code (e.g. BD3026)")
    responsible_agency: str = Field(..., description="Responsible Ministry or Agency (e.g. MoDMR, DoE, LGED)")
    indicator_code: str = Field(..., description="Canonical indicator code (e.g. URBAN_HEAT_ISLAND_DELTA_C)")
    baseline_value: float = Field(..., description="Pre-intervention baseline numerical value")
    target_value: float = Field(..., description="Simulated target commitment value")
    review_date: date = Field(..., description="Formal verification target date (YYYY-MM-DD)")
    evidence_url: Optional[str] = Field(None, description="External verification document or survey URL")


class OutcomeUpdateRequest(BaseModel):
    observed_value: Optional[float] = Field(None, description="Empirical field measurement observed by reviewers")
    status: Optional[str] = Field(None, pattern="^(Planned|Active|Under_Review|Completed)$", description="Milestone lifecycle state")
    evidence_url: Optional[str] = Field(None, description="Updated verification report or official circular URL")


@router.get("", summary="List tracked policy outcomes with status summary")
def list_outcomes(
    status_filter: Optional[str] = Query(None, alias="status", pattern="^(Planned|Active|Under_Review|Completed)$"),
    target_pcode: Optional[str] = None,
    responsible_agency: Optional[str] = None,
    scenario_id: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns closed-loop policy outcomes across Bangladesh districts
    with progress breakdown and agency responsibilities.
    """
    query = db.query(PolicyOutcome)

    if status_filter:
        query = query.filter(PolicyOutcome.status == status_filter)
    if target_pcode:
        query = query.filter(PolicyOutcome.target_pcode == target_pcode.upper())
    if responsible_agency:
        query = query.filter(PolicyOutcome.responsible_agency.ilike(f"%{responsible_agency}%"))
    if scenario_id:
        query = query.filter(PolicyOutcome.scenario_id == scenario_id)

    records = query.order_by(PolicyOutcome.review_date.asc(), PolicyOutcome.created_at.desc()).limit(limit).all()

    # Calculate status counts
    all_outcomes = db.query(PolicyOutcome).all()
    planned_count = sum(1 for o in all_outcomes if o.status == "Planned")
    active_count = sum(1 for o in all_outcomes if o.status == "Active")
    under_review_count = sum(1 for o in all_outcomes if o.status == "Under_Review")
    completed_count = sum(1 for o in all_outcomes if o.status == "Completed")

    return {
        "total_count": len(records),
        "summary": {
            "total_outcomes": len(all_outcomes),
            "planned": planned_count,
            "active": active_count,
            "under_review": under_review_count,
            "completed": completed_count,
        },
        "outcomes": [o.to_dict() for o in records],
    }


@router.post("", summary="Register new policy outcome milestone", status_code=status.HTTP_201_CREATED)
def create_outcome(
    request: OutcomeCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_role([Role.POLICY_REVIEWER, Role.SYSTEM_ADMIN])),
):
    """
    Registers a new quantifiable policy target milestone.
    Restricted to Policy_Reviewer and System_Admin roles.
    """
    outcome = PolicyOutcome(
        scenario_id=request.scenario_id,
        title=request.title,
        target_pcode=request.target_pcode.upper(),
        responsible_agency=request.responsible_agency,
        indicator_code=request.indicator_code.upper(),
        baseline_value=request.baseline_value,
        target_value=request.target_value,
        observed_value=None,
        status="Planned",
        review_date=request.review_date,
        evidence_url=request.evidence_url,
    )
    db.add(outcome)
    db.commit()
    db.refresh(outcome)

    background_tasks.add_task(
        log_audit_event,
        actor_role=current_user.get("role", Role.POLICY_REVIEWER),
        action_type="OUTCOME_CREATED",
        endpoint="/api/v1/outcomes",
        payload_summary={
            "outcome_id": outcome.id,
            "target_pcode": outcome.target_pcode,
            "agency": outcome.responsible_agency,
            "indicator": outcome.indicator_code,
        },
    )

    return outcome.to_dict()


@router.patch("/{outcome_id}", summary="Update observed verification value or milestone status")
def update_outcome(
    outcome_id: str,
    request: OutcomeUpdateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_role([Role.POLICY_REVIEWER, Role.SYSTEM_ADMIN])),
):
    """
    Records empirical field audit observations and updates milestone status.
    """
    outcome = db.query(PolicyOutcome).filter(PolicyOutcome.id == outcome_id).first()
    if not outcome:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy outcome milestone '{outcome_id}' not found.",
        )

    if request.observed_value is not None:
        outcome.observed_value = request.observed_value
    if request.status is not None:
        outcome.status = request.status
    if request.evidence_url is not None:
        outcome.evidence_url = request.evidence_url

    db.commit()
    db.refresh(outcome)

    background_tasks.add_task(
        log_audit_event,
        actor_role=current_user.get("role", Role.POLICY_REVIEWER),
        action_type="OUTCOME_UPDATED",
        endpoint=f"/api/v1/outcomes/{outcome_id}",
        payload_summary={
            "outcome_id": outcome.id,
            "new_status": outcome.status,
            "observed_value": float(outcome.observed_value) if outcome.observed_value else None,
        },
    )

    return outcome.to_dict()
