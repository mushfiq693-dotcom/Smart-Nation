import sys
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Add services/api to python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.db.session import SessionLocal
from app.db.models import PolicyScenario, PolicyOutcome
from app.engines.brief_generator import policy_brief_generator
from app.engines.equity_optimizer import equity_optimizer

client = TestClient(app)


def test_brief_generator_engine_structure_en():
    """Verify that policy_brief_generator produces all 6 sections and markdown memo in English"""
    sim_data = equity_optimizer.run_simulation(budget_usd=600000.0, alpha_equity=0.45)
    brief = policy_brief_generator.generate_brief(
        scenario_data=sim_data,
        scenario_id="unit-test-scenario-en",
        lang="en",
        custom_notes="Urgent cabinet directive for pre-monsoon preparedness.",
    )

    assert brief["brief_id"] is not None
    assert brief["language"] == "en"
    assert "CLIMATE RESILIENCE" in brief["title"].upper()
    assert brief["classification"].startswith("CONFIDENTIAL_CABINET_BRIEF")
    assert len(brief["sections"]) == 6

    # Verify each of the 6 canonical sections
    sec_titles = [s["title"] for s in brief["sections"]]
    assert any("Executive Summary" in t for t in sec_titles)
    assert any("Quantitative Spatial Evidence" in t for t in sec_titles)
    assert any("Compared Scenarios" in t for t in sec_titles)
    assert any("Model Assumptions" in t for t in sec_titles)
    assert any("Implementation Timeline" in t for t in sec_titles)
    assert any("Evaluation Metrics" in t for t in sec_titles)

    # Verify citations from policy corpus
    assert len(brief["citations"]) >= 1
    assert any("National Adaptation Plan" in c["document_title"] or "Mujib" in c["document_title"] for c in brief["citations"])

    # Verify KPIs
    assert len(brief["kpis"]) >= 5
    for kpi in brief["kpis"]:
        assert "target_pcode" in kpi
        assert "responsible_agency" in kpi
        assert "indicator_code" in kpi
        assert kpi["baseline_value"] is not None
        assert kpi["target_value"] is not None
        assert kpi["status"] == "Planned"

    # Verify Markdown Memo
    md = brief["markdown_memo"]
    assert "# GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH" in md
    assert "## ClimAct Twin Policy Decision Intelligence Platform" in md
    assert "| Rank | District | Population (2022) |" in md
    assert "## 7. Official Policy Framework & Statutory References" in md
    assert "### Sign-off & Institutional Endorsement" in md


def test_brief_generator_engine_structure_bn():
    """Verify bilingual administrative Bengali generation"""
    sim_data = equity_optimizer.run_simulation(budget_usd=500000.0, alpha_equity=0.60)
    brief = policy_brief_generator.generate_brief(
        scenario_data=sim_data,
        scenario_id="unit-test-scenario-bn",
        lang="bn",
    )

    assert brief["language"] == "bn"
    assert "দাপ্তরিক নীতি স্মারক" in brief["title"]
    assert len(brief["sections"]) == 6

    # Check Bengali section headers
    sec1 = brief["sections"][0]
    assert "১. নির্বাহী সারসংক্ষেপ" in sec1["title"]
    assert "বরাদ্দকৃত মোট বাজেট" in sec1["content_markdown"]

    sec2 = brief["sections"][1]
    assert "২. পরিমাণগত স্থানিক প্রমাণ" in sec2["title"]
    assert "| র‍্যাংক | জেলা |" in sec2["content_markdown"]

    # Check Bengali markdown memo
    md = brief["markdown_memo"]
    assert "# গণপ্রজাতন্ত্রী বাংলাদেশ সরকার" in md
    assert "স্মারক আইডি:" in md
    assert "স্বাক্ষর ও দাপ্তরিক অনুমোদন" in md


def test_brief_api_generate_and_save_outcomes():
    """Verify POST /api/v1/briefs/generate creates brief and saves KPIs into policy_outcomes"""
    # 1. First run a simulation to create a scenario in the database
    sim_res = client.post(
        "/api/v1/simulate",
        json={"budget_usd": 800000.0, "alpha_equity": 0.55, "w_risk": 1.2},
    )
    assert sim_res.status_code == 200
    scenario_id = sim_res.json()["scenario_id"]

    # 2. Call briefs generate with save_as_outcomes=True
    gen_payload = {
        "scenario_id": scenario_id,
        "lang": "en",
        "custom_notes": "Planning Commission Priority Review",
        "save_as_outcomes": True,
    }
    brief_res = client.post("/api/v1/briefs/generate", json=gen_payload)
    assert brief_res.status_code == 200
    brief_data = brief_res.json()

    assert brief_data["scenario_id"] == scenario_id
    assert brief_data["language"] == "en"
    assert brief_data["saved_outcomes_count"] >= 5
    assert len(brief_data["kpis"]) >= 5
    assert "markdown_memo" in brief_data

    # 3. Verify outcomes are actually in DB
    with SessionLocal() as db:
        outcomes = db.query(PolicyOutcome).filter(PolicyOutcome.scenario_id == scenario_id).all()
        assert len(outcomes) >= 5
        for out in outcomes:
            assert out.scenario_id == scenario_id
            assert out.responsible_agency is not None
            assert out.indicator_code is not None
            assert out.status == "Planned"


def test_brief_api_get_by_scenario_id():
    """Verify GET /api/v1/briefs/{scenario_id} returns brief in requested language"""
    # Run a quick simulation
    sim_res = client.post("/api/v1/simulate", json={"budget_usd": 450000.0, "alpha_equity": 0.3})
    scenario_id = sim_res.json()["scenario_id"]

    # Retrieve brief in Bengali
    get_res = client.get(f"/api/v1/briefs/{scenario_id}?lang=bn")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["language"] == "bn"
    assert "দাপ্তরিক নীতি স্মারক" in data["title"]
    assert len(data["sections"]) == 6


def test_brief_api_download_markdown_memo():
    """Verify GET /api/v1/briefs/{scenario_id}/markdown returns direct text/markdown attachment"""
    sim_res = client.post("/api/v1/simulate", json={"budget_usd": 500000.0, "alpha_equity": 0.5})
    scenario_id = sim_res.json()["scenario_id"]

    md_res = client.get(f"/api/v1/briefs/{scenario_id}/markdown?lang=en")
    assert md_res.status_code == 200
    assert "text/markdown" in md_res.headers.get("content-type", "")
    assert "attachment" in md_res.headers.get("content-disposition", "")
    assert md_res.text.startswith("# GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH")


def test_brief_api_404_on_invalid_scenario():
    """Verify appropriate 404 response on unknown scenario UUID"""
    res = client.get("/api/v1/briefs/non-existent-uuid-99999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()
