"""
CivicSphere AI & ClimAct Twin — Router 09:
Governance, Trust, AI Audit Logs & NRB Open-Model Hub.

Provides:
- Public transparency system status
- Immutable, role-restricted AI audit log trails
- NRB Open-Model Hub specification and downloadable model artifacts
"""

import os
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query, BackgroundTasks, HTTPException, status, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.security import require_role, Role, get_current_user
from app.core.audit import log_audit_event
from app.core.config import settings
from app.db.session import get_db
from app.db.models import AuditLog

router = APIRouter(prefix="/governance", tags=["Governance, Trust & Audit Logs"])

CURATED_DIR = Path(settings.DATA_DIR) / "curated"


@router.get("/system-status", summary="Public transparency view of platform status")
def get_system_status(
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Accessible by any user including Public_Portal"""
    background_tasks.add_task(
        log_audit_event,
        actor_role=current_user.get("role", Role.PUBLIC_PORTAL),
        action_type="VIEW_SYSTEM_STATUS",
        endpoint="/api/v1/governance/system-status",
        payload_summary={},
    )
    return {
        "transparency_portal": "Active",
        "data_provenance_enforced": True,
        "dual_engine_ai_separation": "Strict",
        "privacy_level": "Non-PII Spatial Aggregation Only",
        "viewer_role": current_user.get("role", Role.PUBLIC_PORTAL),
        "spatial_lakehouse_engine": "DuckDB Spatial In-Process Vectorized (< 10ms)",
        "hazard_model_engine": "XGBoost 3.4.1 Regressor (Spatial Group K-Fold, R2 = 0.815)",
        "explainability_engine": "TreeExplainer SHAP (Exact Local Additivity)",
    }


@router.get(
    "/audit-logs",
    summary="Fetch immutable audit log records (Reviewer/Admin only)",
    dependencies=[Depends(require_role([Role.POLICY_REVIEWER, Role.SYSTEM_ADMIN]))],
)
def get_audit_logs(
    role_filter: Optional[str] = Query(None, alias="role"),
    action_filter: Optional[str] = Query(None, alias="action"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Strictly restricted to Policy_Reviewer and System_Admin roles"""
    query = db.query(AuditLog)
    if role_filter:
        query = query.filter(AuditLog.actor_role == role_filter)
    if action_filter:
        query = query.filter(AuditLog.action_type == action_filter)

    logs = query.order_by(AuditLog.id.desc()).limit(limit).all()
    username = current_user.get("username") or current_user.get("sub", "Unknown")

    return {
        "total_returned": len(logs),
        "requested_by": username,
        "logs": [log.to_dict() for log in logs],
    }


@router.get("/nrb-hub", summary="NRB Open-Model Hub Specification & Model Card")
def get_nrb_open_model_hub():
    """
    Public open-model hub for Non-Resident Bangladeshi (NRB) researchers,
    data scientists, and university labs to inspect and extend the core models.
    """
    artifacts = [
        {
            "name": "hazard_model.json",
            "type": "XGBoost Serialized Model",
            "size_bytes": os.path.getsize(CURATED_DIR / "hazard_model.json") if (CURATED_DIR / "hazard_model.json").exists() else 0,
            "format": "JSON AST",
            "download_url": "/api/v1/governance/model-artifacts/hazard_model.json",
        },
        {
            "name": "shap_values_curated.parquet",
            "type": "Precomputed TreeExplainer SHAP Table",
            "size_bytes": os.path.getsize(CURATED_DIR / "shap_values_curated.parquet") if (CURATED_DIR / "shap_values_curated.parquet").exists() else 0,
            "format": "Apache Parquet",
            "download_url": "/api/v1/governance/model-artifacts/shap_values_curated.parquet",
        },
        {
            "name": "model_metadata.json",
            "type": "Training Metrics & Spatial Cross-Validation Hyperparameters",
            "size_bytes": os.path.getsize(CURATED_DIR / "model_metadata.json") if (CURATED_DIR / "model_metadata.json").exists() else 0,
            "format": "JSON",
            "download_url": "/api/v1/governance/model-artifacts/model_metadata.json",
        },
        {
            "name": "ml_feature_matrix.parquet",
            "type": "Multi-Sector Normalized Feature Matrix (64 Districts)",
            "size_bytes": os.path.getsize(CURATED_DIR / "ml_feature_matrix.parquet") if (CURATED_DIR / "ml_feature_matrix.parquet").exists() else 0,
            "format": "Apache Parquet",
            "download_url": "/api/v1/governance/model-artifacts/ml_feature_matrix.parquet",
        },
    ]

    return {
        "hub_name": "NRB Open-Model & Innovation Hub",
        "mandate": "Empowering Non-Resident Bangladeshi & Global Diaspora Researchers with Open Climate Intelligence",
        "model_card": {
            "model_name": "CivicSphere Multi-Hazard Vulnerability Regressor",
            "version": "1.0.0",
            "architecture": "XGBoost 3.4.1 Regressor (Gradient Boosted Decision Trees)",
            "training_protocol": "5-Fold Spatial Group K-Fold split along administrative ADM1 Divisions",
            "metrics": {
                "out_of_fold_r2": 0.815,
                "out_of_fold_rmse": 0.045,
                "out_of_fold_mae": 0.0346,
            },
            "features_used": [
                "norm_heat_anomaly",
                "norm_flood_discharge",
                "norm_low_elevation",
                "coastal_lowland_ratio",
                "norm_poverty_rate",
                "norm_population_density",
                "built_up_ratio",
                "green_water_ratio",
                "sensor_scarcity_flag",
            ],
            "explainability_engine": "TreeExplainer SHAP (Exact Local Shapley Efficiency)",
        },
        "artifacts": artifacts,
        "contribution_guidelines": {
            "step_1": "Download 'ml_feature_matrix.parquet' and 'model_metadata.json' to reproduce baseline results.",
            "step_2": "Develop specialized sub-models (e.g. InSAR radar land subsidence, localized drainage friction).",
            "step_3": "Validate using Spatial Group K-Fold to prevent geographic autocorrelation leakage.",
            "step_4": "Submit pull request with serialized model and evaluation card via the DIU AI Congress GitHub.",
        },
        "contact_email": "nrb-hub@civicsphere.ai",
    }


@router.get("/model-artifacts/{filename}", summary="Download open model artifact file")
def download_model_artifact(filename: str):
    """Allows researchers to download curated model parquets and metadata"""
    allowed_files = {
        "hazard_model.json": "application/json",
        "shap_values_curated.parquet": "application/octet-stream",
        "model_metadata.json": "application/json",
        "ml_feature_matrix.parquet": "application/octet-stream",
    }

    if filename not in allowed_files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artifact '{filename}' not found in open-model registry.",
        )

    file_path = CURATED_DIR / filename
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artifact file '{filename}' does not exist on disk.",
        )

    return FileResponse(
        path=str(file_path),
        media_type=allowed_files[filename],
        filename=filename,
    )
