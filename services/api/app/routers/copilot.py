from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field
from app.core.security import get_current_user, Role
from app.core.audit import log_audit_event
from app.engines.rag_copilot import rag_copilot

router = APIRouter(prefix="/copilot", tags=["AI Policy Copilot & Grounded RAG"])


class CopilotQueryRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=1000, description="Natural language planning query")
    lang: str = Field("en", description="Preferred response language: 'en' or 'bn'")


@router.post("/query", summary="Ask a grounded analytical question to the AI Policy Copilot")
def query_copilot(
    request: CopilotQueryRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Executes grounded tool calling over DuckDB Spatial and official policy corpus.
    Never hallucinates unverified numbers and attaches explicit citation badges.
    """
    response = rag_copilot.answer_query(
        query=request.query,
        lang=request.lang,
        current_user=current_user,
    )

    background_tasks.add_task(
        log_audit_event,
        actor_role=current_user.get("role", Role.PUBLIC_PORTAL),
        action_type="COPILOT_QUERY",
        endpoint="/api/v1/copilot/query",
        payload_summary={
            "query": request.query[:100],
            "lang": request.lang,
            "status": response.get("status"),
            "tool_calls_count": len(response.get("tools_executed", [])),
        },
    )

    return response


@router.get("/tools", summary="List whitelisted Pydantic analytical tools available to the Copilot")
def list_copilot_tools():
    """Returns tool schemas demonstrating Dual-Engine deterministic separation"""
    return {
        "engine": "CivicSphere Grounded Tool-Calling Dispatcher",
        "whitelisted_tools": [
            {
                "name": "get_top_risk_regions",
                "description": "Queries DuckDB Spatial for districts with highest risk in a selected sector",
                "parameters": {"sector": "heat | flood | elevation | poverty | all", "limit": "integer"},
            },
            {
                "name": "get_region_shap_drivers",
                "description": "Extracts TreeExplainer local SHAP feature drivers for a district",
                "parameters": {"adm2_pcode": "string (e.g. BD3026)", "lang": "en | bn"},
            },
            {
                "name": "run_budget_simulation",
                "description": "Executes equity-weighted resource allocation under budget constraint B",
                "parameters": {"budget_usd": "float", "alpha_equity": "float in [0, 1]", "intervention_type": "string"},
            },
            {
                "name": "get_sensor_scarcity_report",
                "description": "Audits national ground air-quality monitoring coverage and flags unmonitored districts",
                "parameters": {},
            },
            {
                "name": "search_policy_corpus",
                "description": "Executes in-process BM25 retrieval over official Bangladesh climate & urban guidelines",
                "parameters": {"query": "string", "top_k": "integer"},
            },
        ]
    }
