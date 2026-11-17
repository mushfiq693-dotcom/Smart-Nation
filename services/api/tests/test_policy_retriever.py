import sys
from pathlib import Path
import pytest

# Add services/api to python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.engines.policy_retriever import policy_retriever


def test_policy_retriever_indexing():
    """Verify official policy guidelines are loaded and indexed"""
    assert len(policy_retriever.chunks) >= 8, f"Expected >= 8 chunks, got {len(policy_retriever.chunks)}"
    doc_slugs = {c.doc_slug for c in policy_retriever.chunks}
    assert "01_mujib_climate_prosperity_plan_2030" in doc_slugs
    assert "02_national_adaptation_plan_bangladesh_nap" in doc_slugs
    assert "03_dhaka_urban_cooling_drainage_guidelines" in doc_slugs
    assert "04_who_air_quality_guidelines_south_asia" in doc_slugs


def test_search_urban_cooling_guideline():
    """Verify BM25 search accurately matches urban heat and cool roof policies"""
    results = policy_retriever.search("urban heat island cool roof mandates albedo", top_k=2)
    assert len(results) >= 1
    top = results[0]
    assert "03_dhaka_urban_cooling_drainage_guidelines" in top["document_slug"]
    assert "Cool Roof" in top["section"] or "Heat" in top["section"]
    assert top["bm25_score"] > 0
    assert top["retrieval_latency_ms"] < 15.0


def test_search_flood_hydrology_guideline():
    """Verify search matches flood discharge and embankment guidelines"""
    results = policy_retriever.search("river discharge flood embankment danger level", top_k=2)
    assert len(results) >= 1
    top = results[0]
    assert any(slug in top["document_slug"] for slug in ["01_mujib_climate_prosperity_plan_2030", "02_national_adaptation_plan_bangladesh_nap"])
    assert "Disaster" in top["section"] or "Flood" in top["section"] or "Vulnerability" in top["section"]


def test_search_air_quality_threshold():
    """Verify search matches PM2.5 standards and sensor scarcity directives"""
    results = policy_retriever.search("pm2.5 air quality limit sensor scarcity unmonitored", top_k=2)
    assert len(results) >= 1
    top = results[0]
    assert "04_who_air_quality_guidelines_south_asia" in top["document_slug"]
    assert "Sensor" in top["section"] or "Guidelines" in top["section"] or "Interventions" in top["section"]
