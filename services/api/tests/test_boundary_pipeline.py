import json
import sys
from pathlib import Path
import pytest

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent


def test_adm1_divisions_curated():
    geojson_path = BASE_DIR / "data" / "curated" / "bgd_adm1_divisions.geojson"
    assert geojson_path.exists(), "ADM1 divisions GeoJSON not found"

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 8, f"Expected 8 divisions, found {len(data['features'])}"

    divisions = {feat["properties"]["adm1_en"] for feat in data["features"]}
    expected_divs = {"Barishal", "Chattogram", "Dhaka", "Khulna", "Mymensingh", "Rajshahi", "Rangpur", "Sylhet"}
    assert divisions == expected_divs


def test_adm2_districts_curated():
    geojson_path = BASE_DIR / "data" / "curated" / "bgd_adm2_districts.geojson"
    assert geojson_path.exists(), "ADM2 districts GeoJSON not found"

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 64, f"Expected 64 districts, found {len(data['features'])}"

    for feat in data["features"]:
        props = feat["properties"]
        assert props["adm2_pcode"].startswith("BD")
        assert len(props["adm2_pcode"]) == 6
        assert 20.74 <= props["latitude"] <= 26.63, f"Latitude out of BD bounds: {props['latitude']}"
        assert 88.01 <= props["longitude"] <= 92.68, f"Longitude out of BD bounds: {props['longitude']}"
        assert "elevation_mean_m" in props
        assert "elevation_p10_m" in props
        assert "coastal_lowland_ratio" in props


def test_coastal_lowland_elevation_accuracy():
    """Verify that vulnerable coastal delta districts reflect low-lying terrain per Copernicus DEM"""
    geojson_path = BASE_DIR / "data" / "curated" / "bgd_adm2_districts.geojson"
    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    district_map = {feat["properties"]["adm2_en"]: feat["properties"] for feat in data["features"]}

    # Khulna, Satkhira, Patuakhali, Barguna, Bhola must have high coastal lowland ratio
    for coastal_dist in ["Khulna", "Satkhira", "Patuakhali", "Barguna", "Bhola"]:
        assert coastal_dist in district_map
        assert district_map[coastal_dist]["coastal_lowland_ratio"] >= 0.70, (
            f"Expected {coastal_dist} to have coastal_lowland_ratio >= 0.70, got {district_map[coastal_dist]['coastal_lowland_ratio']}"
        )
        assert district_map[coastal_dist]["elevation_mean_m"] <= 5.0

    # Hilly districts (e.g. Bandarban, Rangamati) must have higher elevation
    assert district_map["Bandarban"]["elevation_mean_m"] > 50.0
    assert district_map["Rangamati"]["elevation_mean_m"] > 50.0


def test_quality_gate_manifest():
    report_path = BASE_DIR / "data" / "catalog" / "quality_reports.json"
    assert report_path.exists(), "Quality reports JSON not found"

    with open(report_path, "r", encoding="utf-8") as f:
        report = json.load(f)

    assert report["pipeline"] == "01_fetch_hdx_bounds"
    assert report["layers"]["adm1_divisions"]["status"] == "PASSED"
    assert report["layers"]["adm2_districts"]["status"] == "PASSED"
