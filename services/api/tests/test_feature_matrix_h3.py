import json
import sys
from pathlib import Path
import pytest
import pyarrow.parquet as pq

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent


def test_ml_feature_matrix_parquet():
    file_path = BASE_DIR / "data" / "curated" / "ml_feature_matrix.parquet"
    assert file_path.exists(), "ml_feature_matrix.parquet not found"

    table = pq.read_table(file_path)
    assert table.num_rows == 64, f"Expected 64 districts, found {table.num_rows}"

    cols_to_check = [
        "norm_heat_anomaly",
        "norm_flood_discharge",
        "norm_low_elevation",
        "coastal_lowland_ratio",
        "norm_poverty_rate",
        "norm_population_density",
        "built_up_ratio",
        "green_water_ratio",
        "sensor_scarcity_flag",
        "composite_hazard_target",
    ]

    for col in cols_to_check:
        values = table[col].to_pylist()
        assert len(values) == 64
        for val in values:
            assert val is not None
            assert 0.0 <= val <= 1.0, f"Value {val} in column {col} outside [0, 1]"


def test_h3_hexagons_parquet_and_geojson():
    parquet_path = BASE_DIR / "data" / "curated" / "bgd_h3_res7_hexagons.parquet"
    geojson_path = BASE_DIR / "data" / "curated" / "bgd_h3_res7_hexagons.geojson"

    assert parquet_path.exists()
    assert geojson_path.exists()

    table = pq.read_table(parquet_path)
    assert table.num_rows >= 400, f"Expected at least 400 H3 cells, found {table.num_rows}"

    with open(geojson_path, "r", encoding="utf-8") as f:
        fc = json.load(f)

    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) == table.num_rows

    sample_feat = fc["features"][0]
    assert sample_feat["geometry"]["type"] == "Polygon"
    assert len(sample_feat["geometry"]["coordinates"][0]) >= 6
    assert "h3_index" in sample_feat["properties"]
    assert "hazard_score" in sample_feat["properties"]
    assert sample_feat["properties"]["parent_adm2_pcode"].startswith("BD")
