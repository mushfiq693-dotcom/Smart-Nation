from typing import Dict, Any, List, Optional
from pathlib import Path
import json
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_current_user, Role
from app.core.audit import log_audit_event
from app.db.session import get_db
from app.db.models import Dataset

router = APIRouter(prefix="/data-hub", tags=["Integrated Public Data Hub & Catalogue"])

DATA_CATALOG_DIR = Path(settings.DATA_DIR) / "catalog"


@router.get("/datasets", summary="List verified public datasets in the data catalogue")
def list_datasets(
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Database-first query from PostgreSQL 'datasets' table with graceful fallback
    to local 'dataset_manifest.json' ensuring 100% demo uptime and resilience.
    """
    if background_tasks:
        background_tasks.add_task(
            log_audit_event,
            actor_role=current_user.get("role", Role.PUBLIC_PORTAL),
            action_type="VIEW_DATA_CATALOGUE",
            endpoint="/api/v1/data-hub/datasets",
            payload_summary={},
        )

    # 1. Attempt database fetch
    try:
        db_datasets = db.query(Dataset).all()
        if db_datasets and len(db_datasets) > 0:
            return {
                "source_engine": "PostgreSQL / SQLite Database State",
                "total_datasets": len(db_datasets),
                "datasets": [d.to_dict() for d in db_datasets],
            }
    except Exception as e:
        print(f"[Data Hub Warning] Database query failed, using local manifest fallback: {e}")

    # 2. Graceful fallback to verified manifest JSON
    manifest_path = DATA_CATALOG_DIR / "dataset_manifest.json"
    if manifest_path.exists():
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest_data = json.load(f)
        return {
            "source_engine": "Local Manifest Fallback Cache",
            "total_datasets": len(manifest_data),
            "datasets": manifest_data,
        }

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Dataset catalogue could not be loaded from database or manifest cache.",
    )


@router.get("/quality-report", summary="Fetch latest automated data quality gate audit report")
def get_quality_report(
    background_tasks: BackgroundTasks = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns automated validation report (schema, null %, P-code integrity, sensor scarcity rate).
    """
    report_path = DATA_CATALOG_DIR / "quality_reports.json"
    if not report_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quality gate audit report not found. Please run the quality gate pipeline.",
        )

    with open(report_path, "r", encoding="utf-8") as f:
        report = json.load(f)

    if background_tasks:
        background_tasks.add_task(
            log_audit_event,
            actor_role=current_user.get("role", Role.PUBLIC_PORTAL),
            action_type="VIEW_QUALITY_REPORT",
            endpoint="/api/v1/data-hub/quality-report",
            payload_summary={"gate_status": report.get("gate_status")},
        )

    return report
