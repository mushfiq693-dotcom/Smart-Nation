from typing import Dict, Any, List, Optional
from pathlib import Path
import json
from fastapi import APIRouter, Depends, Query, HTTPException, status, BackgroundTasks
import pyarrow.parquet as pq
from app.core.config import settings
from app.core.security import get_current_user, Role
from app.core.audit import log_audit_event
from app.engines.spatial_duckdb import duckdb_engine
from app.engines.ml_risk_shap import ml_risk_engine

router = APIRouter(prefix="/regions", tags=["Geospatial & Regional Analytics"])

def get_curated_dir() -> Path:
    return Path(settings.DATA_DIR) / "curated"


@router.get("", summary="Fetch regional indicators across ADM1, ADM2 or H3 Hexagons")
def get_regions(
    level: str = Query("adm2", description="Spatial level: adm1 (8 Divisions), adm2 (64 Districts), or h3 (Hexagons)"),
    adm1_pcode: Optional[str] = Query(None, description="Filter by division pcode, e.g. BD30 (Dhaka)"),
    sensor_scarce_only: bool = Query(False, description="Filter districts lacking ground air-quality stations"),
    min_heat_anomaly: Optional[float] = Query(None, description="Filter by minimum heat anomaly (°C)"),
    min_flood_p75: Optional[float] = Query(None, description="Filter by minimum flood discharge percentile"),
    sort_by: str = Query("apparent_temp_anomaly_c", description="Metric to sort by"),
    ascending: bool = Query(False, description="Sort order"),
    limit: int = Query(64, ge=1, le=500, description="Max records to return"),
    background_tasks: BackgroundTasks = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns full multi-sector indicators, coordinates, bilingual (EN/BN) labels,
    and provenance badges powered by in-process DuckDB Spatial.
    """
    if background_tasks:
        background_tasks.add_task(
            log_audit_event,
            actor_role=current_user.get("role", Role.PUBLIC_PORTAL),
            action_type="REGIONAL_ANALYTICS_QUERY",
            endpoint="/api/v1/regions",
            payload_summary={"level": level, "adm1_pcode": adm1_pcode, "sensor_scarce_only": sensor_scarce_only},
        )

    if level == "adm2":
        # Vectorized query via DuckDB Spatial over curated Parquet
        return duckdb_engine.query_districts(
            adm1_pcode=adm1_pcode,
            min_heat_anomaly=min_heat_anomaly,
            min_flood_p75=min_flood_p75,
            sensor_scarce_only=sensor_scarce_only,
            sort_by=sort_by,
            ascending=ascending,
            limit=limit,
        )

    elif level == "adm1":
        file_path = get_curated_dir() / "bgd_adm1_divisions.parquet"
        if not file_path.exists():
            raise HTTPException(status_code=500, detail="ADM1 division data not found.")
        table = pq.read_table(file_path)
        records = table.to_pylist()
        return {
            "level": "adm1",
            "total_matches": len(records),
            "results": records,
        }

    elif level == "h3":
        file_path = get_curated_dir() / "bgd_h3_res7_hexagons.parquet"
        if not file_path.exists():
            raise HTTPException(status_code=500, detail="H3 hexagonal grid data not found.")
        table = pq.read_table(file_path)
        records = table.to_pylist()
        if adm1_pcode:
            # Map through parent_adm2_pcode if needed
            records = [r for r in records if r["parent_adm2_pcode"].startswith(adm1_pcode[:3])]
        slice_records = records[:limit]
        return {
            "level": "h3",
            "resolution": 7,
            "total_matches": len(records),
            "returned_count": len(slice_records),
            "results": slice_records,
        }

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid spatial level '{level}'. Must be 'adm1', 'adm2', or 'h3'."
        )


@router.get("/{pcode}", summary="Fetch single region dossier by P-code")
def get_region_by_pcode(
    pcode: str,
    background_tasks: BackgroundTasks = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns granular environmental, hazard, and demographic profile for a target district.
    """
    pcode_upper = pcode.upper().strip()
    all_districts = duckdb_engine.get_unified_district_matrix()
    target = next((d for d in all_districts if d["adm2_pcode"] == pcode_upper), None)

    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Region with P-code '{pcode_upper}' not found in Bangladesh master registry.",
        )

    if background_tasks:
        background_tasks.add_task(
            log_audit_event,
            actor_role=current_user.get("role", Role.PUBLIC_PORTAL),
            action_type="VIEW_REGION_DOSSIER",
            endpoint=f"/api/v1/regions/{pcode_upper}",
            payload_summary={"target_pcode": pcode_upper},
        )

    return target


@router.get("/{pcode}/explain", summary="Get TreeExplainer SHAP feature attributions for a district")
def explain_region_risk(
    pcode: str,
    lang: str = Query("en", description="Output language: 'en' or 'bn'"),
    background_tasks: BackgroundTasks = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns local Shapley feature attribution decomposition explaining
    why this district was assigned its hazard risk score.
    """
    pcode_upper = pcode.upper().strip()
    try:
        explanation = ml_risk_engine.get_district_explanation(pcode_upper, lang=lang)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"District P-code '{pcode_upper}' not found in model explainability database.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SHAP explanation engine error: {str(e)}",
        )

    if background_tasks:
        background_tasks.add_task(
            log_audit_event,
            actor_role=current_user.get("role", Role.PUBLIC_PORTAL),
            action_type="EXPLAIN_DISTRICT_SHAP",
            endpoint=f"/api/v1/regions/{pcode_upper}/explain",
            payload_summary={"target_pcode": pcode_upper, "lang": lang},
        )

    return explanation
