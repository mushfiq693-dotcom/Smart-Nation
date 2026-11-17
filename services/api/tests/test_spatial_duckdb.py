import sys
from pathlib import Path
import pytest

# Add services/api to python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.engines.spatial_duckdb import duckdb_engine


def test_unified_district_matrix_duckdb():
    """Verify DuckDB Spatial performs 5-table vectorized join over GeoParquet"""
    records = duckdb_engine.get_unified_district_matrix()
    assert len(records) == 64, f"Expected 64 districts, got {len(records)}"

    first = records[0]
    required_cols = [
        "adm2_pcode",
        "adm2_en",
        "adm1_pcode",
        "elevation_mean_m",
        "apparent_temp_anomaly_c",
        "glofas_p75_discharge",
        "poverty_headcount_pct",
        "vulnerability_index_vi",
        "air_station_count",
        "has_ground_aq_station",
        "provenance",
    ]
    for col in required_cols:
        assert col in first, f"Missing expected column '{col}' in unified matrix"


def test_duckdb_sub_50ms_latency_target():
    """Verify in-process DuckDB query execution meets sub-50ms target"""
    # Warm run
    benchmark = duckdb_engine.benchmark_latency()
    assert benchmark["sub_50ms_target_met"] is True, (
        f"Query latency was {benchmark['latency_ms']} ms, exceeding 50ms target"
    )
    assert benchmark["rows_returned"] == 64


def test_duckdb_spatial_st_distance_sphere():
    """Verify metric geodesic distance calculation in OGC:CRS84 (meters)"""
    # Dhaka (23.8103 N, 90.4125 E) to Chattogram (22.3569 N, 91.7832 E)
    dist_meters = duckdb_engine.compute_metric_distance_meters(
        lat1=23.8103, lon1=90.4125, lat2=22.3569, lon2=91.7832
    )
    dist_km = dist_meters / 1000.0
    # True geodesic distance is ~214 km
    assert 200.0 <= dist_km <= 230.0, f"Distance out of expected range: {dist_km} km"


def test_query_districts_filtering_and_sensor_scarcity():
    """Verify filtering by division, heat, flood, and sensor scarcity"""
    # Filter sensor-scarce districts only
    scarce_res = duckdb_engine.query_districts(sensor_scarce_only=True)
    assert scarce_res["total_matches"] == 52
    for r in scarce_res["results"]:
        assert r["has_ground_aq_station"] is False
        assert r["air_station_count"] == 0

    # Filter high flood districts (discharge >= 0.85)
    flood_res = duckdb_engine.query_districts(min_flood_p75=0.85)
    assert flood_res["total_matches"] >= 10
    for r in flood_res["results"]:
        assert r["glofas_p75_discharge"] >= 0.85
