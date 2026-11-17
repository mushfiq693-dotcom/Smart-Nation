import json
import sys
from pathlib import Path
import pytest
import pyarrow.parquet as pq

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent


def test_climate_summary_parquet():
    file_path = BASE_DIR / "data" / "curated" / "climate_summary.parquet"
    assert file_path.exists(), "climate_summary.parquet not found"

    table = pq.read_table(file_path)
    assert table.num_rows == 64, f"Expected 64 districts in climate summary, found {table.num_rows}"

    pcode_col = table["adm2_pcode"].to_pylist()
    temp_anomaly_col = table["apparent_temp_anomaly_c"].to_pylist()
    temp_max_col = table["apparent_temp_max_c"].to_pylist()

    climate_map = dict(zip(pcode_col, zip(temp_anomaly_col, temp_max_col)))

    # Chapai Nawabganj (BD5076) and Rajshahi (BD5081) in Barind tract must have highest heat anomaly
    assert climate_map["BD5076"][0] >= 3.5, f"Expected high heat anomaly in Chapai Nawabganj, got {climate_map['BD5076'][0]}"
    assert climate_map["BD5081"][0] >= 3.5, f"Expected high heat anomaly in Rajshahi, got {climate_map['BD5081'][0]}"

    # Dhaka (BD3026) has high apparent temperature due to urban heat island
    assert climate_map["BD3026"][1] >= 42.0


def test_flood_summary_parquet():
    file_path = BASE_DIR / "data" / "curated" / "flood_summary.parquet"
    assert file_path.exists(), "flood_summary.parquet not found"

    table = pq.read_table(file_path)
    assert table.num_rows == 64, f"Expected 64 districts in flood summary, found {table.num_rows}"

    pcode_col = table["adm2_pcode"].to_pylist()
    flood_p75_col = table["glofas_p75_discharge"].to_pylist()
    risk_col = table["monsoon_inundation_risk"].to_pylist()

    flood_map = dict(zip(pcode_col, zip(flood_p75_col, risk_col)))

    # Sunamganj (BD6090), Sirajganj (BD5088), Kurigram (BD5549) must be Critical flood zones
    for flood_pcode in ["BD6090", "BD5088", "BD5549"]:
        assert flood_map[flood_pcode][0] >= 0.90, f"Expected {flood_pcode} discharge >= 0.90, got {flood_map[flood_pcode][0]}"
        assert flood_map[flood_pcode][1] == "Critical"


def test_openaq_stations_and_scarcity():
    file_path = BASE_DIR / "data" / "curated" / "openaq_bd_stations.parquet"
    assert file_path.exists(), "openaq_bd_stations.parquet not found"

    table = pq.read_table(file_path)
    assert table.num_rows == 15, f"Expected 15 active ground stations, found {table.num_rows}"

    # Verify GeoJSON version exists
    geojson_path = BASE_DIR / "data" / "curated" / "openaq_bd_stations.geojson"
    assert geojson_path.exists()

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert len(data["features"]) == 15
    for feat in data["features"]:
        coords = feat["geometry"]["coordinates"]
        lon, lat = coords[0], coords[1]
        assert 88.01 <= lon <= 92.68
        assert 20.74 <= lat <= 26.63
        assert feat["properties"]["pm25_ug_m3"] > 0


def test_quality_reports_scarcity_flag():
    report_path = BASE_DIR / "data" / "catalog" / "quality_reports.json"
    with open(report_path, "r", encoding="utf-8") as f:
        report = json.load(f)

    env_report = report.get("pipeline_02_environmental")
    assert env_report is not None
    assert env_report["districts_with_air_sensors"] == 12
    assert env_report["districts_sensor_scarce_unmonitored"] == 52
    assert env_report["ethical_equity_penalty_active"] is True
