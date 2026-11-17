import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add services/api to python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app

client = TestClient(app)


def test_get_regions_adm2_default():
    """Verify GET /api/v1/regions returns 64 districts with full indicators & provenance"""
    response = client.get("/api/v1/regions")
    assert response.status_code == 200
    data = response.json()
    assert data["total_matches"] == 64
    assert len(data["results"]) == 64

    sample = data["results"][0]
    assert sample["adm2_pcode"].startswith("BD")
    assert "adm2_en" in sample
    assert "adm2_bn" in sample
    assert "apparent_temp_anomaly_c" in sample
    assert "glofas_p75_discharge" in sample
    assert "vulnerability_index_vi" in sample
    assert "provenance" in sample
    assert sample["provenance"]["boundaries"] == "HDX UN OCHA COD-AB (Official)"


def test_get_regions_sensor_scarce_filter():
    """Verify sensor_scarce_only returns the 52 unmonitored districts"""
    response = client.get("/api/v1/regions?sensor_scarce_only=true")
    assert response.status_code == 200
    data = response.json()
    assert data["total_matches"] == 52
    for dist in data["results"]:
        assert dist["has_ground_aq_station"] is False
        assert dist["air_station_count"] == 0


def test_get_regions_h3_level():
    """Verify spatial level=h3 returns hexagonal cells"""
    response = client.get("/api/v1/regions?level=h3&limit=50")
    assert response.status_code == 200
    data = response.json()
    assert data["level"] == "h3"
    assert data["resolution"] == 7
    assert len(data["results"]) == 50
    assert "h3_index" in data["results"][0]


def test_get_region_dossier_by_pcode():
    """Verify fetching single region dossier by P-code (Dhaka BD3026)"""
    response = client.get("/api/v1/regions/BD3026")
    assert response.status_code == 200
    data = response.json()
    assert data["adm2_pcode"] == "BD3026"
    assert data["adm2_en"] == "Dhaka"
    assert data["adm2_bn"] == "ঢাকা"
    assert data["population_2022"] > 10000000
    assert data["has_ground_aq_station"] is True


def test_get_region_invalid_pcode():
    """Verify 404 response for invalid P-code"""
    response = client.get("/api/v1/regions/BD9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_data_hub_datasets_list():
    """Verify GET /api/v1/data-hub/datasets returns verified catalogue"""
    response = client.get("/api/v1/data-hub/datasets")
    assert response.status_code == 200
    data = response.json()
    assert data["total_datasets"] >= 6
    assert "datasets" in data

    slugs = {ds["slug"] for ds in data["datasets"]}
    assert "hdx-cod-ab-bgd" in slugs
    assert "copernicus-dem-glo30" in slugs
    assert "open-meteo-era5" in slugs


def test_data_hub_quality_report():
    """Verify GET /api/v1/data-hub/quality-report returns validation results"""
    response = client.get("/api/v1/data-hub/quality-report")
    assert response.status_code == 200
    data = response.json()
    assert data["gate_status"] == "PASSED"
    assert "checks_passed" in data
