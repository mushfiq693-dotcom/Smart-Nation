import json
import sys
from pathlib import Path
import pytest
import pyarrow.parquet as pq

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(BASE_DIR / "services" / "api"))

from app.db.session import SessionLocal
from app.db.models import Dataset


def test_socioeconomic_summary_parquet():
    file_path = BASE_DIR / "data" / "curated" / "socioeconomic_summary.parquet"
    assert file_path.exists(), "socioeconomic_summary.parquet not found"

    table = pq.read_table(file_path)
    assert table.num_rows == 64, f"Expected 64 districts, got {table.num_rows}"

    pcode_col = table["adm2_pcode"].to_pylist()
    poverty_col = table["poverty_headcount_pct"].to_pylist()
    vi_col = table["vulnerability_index_vi"].to_pylist()

    socio_map = dict(zip(pcode_col, zip(poverty_col, vi_col)))

    # Kurigram (BD5549) has high poverty (>50%) and high vulnerability Vi
    assert socio_map["BD5549"][0] > 50.0
    assert socio_map["BD5549"][1] > 0.50

    # Dhaka (BD3026) has lower poverty (<20%)
    assert socio_map["BD3026"][0] < 20.0


def test_dataset_manifest_json():
    manifest_path = BASE_DIR / "data" / "catalog" / "dataset_manifest.json"
    assert manifest_path.exists(), "dataset_manifest.json not found"

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    assert len(manifest) == 6
    slugs = {entry["slug"] for entry in manifest}
    expected_slugs = {
        "hdx-cod-ab-bgd",
        "copernicus-dem-glo30",
        "open-meteo-era5",
        "open-meteo-glofas-v4",
        "openaq-v3-bgd",
        "worldbank-indicators-v2",
    }
    assert slugs == expected_slugs

    for entry in manifest:
        assert entry["quality_score"] >= 80.0
        assert entry["missing_pct"] < 5.0
        assert entry["provenance_class"] in ["Official", "Reanalysis_Estimate"]


def test_quality_reports_gate_status():
    reports_path = BASE_DIR / "data" / "catalog" / "quality_reports.json"
    assert reports_path.exists(), "quality_reports.json not found"

    with open(reports_path, "r", encoding="utf-8") as f:
        reports = json.load(f)

    assert reports["gate_status"] == "PASSED"
    assert reports["checks_passed"] == 6
    assert reports["checks_failed"] == 0


def test_database_datasets_sync():
    db = SessionLocal()
    datasets = db.query(Dataset).all()
    assert len(datasets) >= 6
    for ds in datasets:
        assert ds.quality_score is not None
        assert float(ds.quality_score) >= 80.0
        assert ds.reporting_period is not None
    db.close()
