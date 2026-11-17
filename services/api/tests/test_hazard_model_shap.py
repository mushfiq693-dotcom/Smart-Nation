import json
import sys
from pathlib import Path
import pytest
import pyarrow.parquet as pq

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(BASE_DIR / "services" / "api"))

from app.engines.ml_risk_shap import ml_risk_engine


def test_hazard_model_artifacts_exist():
    model_path = BASE_DIR / "data" / "curated" / "hazard_model.json"
    meta_path = BASE_DIR / "data" / "curated" / "model_metadata.json"
    shap_path = BASE_DIR / "data" / "curated" / "shap_values_curated.parquet"

    assert model_path.exists(), "hazard_model.json not found"
    assert meta_path.exists(), "model_metadata.json not found"
    assert shap_path.exists(), "shap_values_curated.parquet not found"


def test_model_training_metrics_spatial_kfold():
    meta_path = BASE_DIR / "data" / "curated" / "model_metadata.json"
    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)

    assert meta["model_type"] == "XGBoost Regressor (TreeExplainer Compatible)"
    assert "Spatial Group K-Fold" in meta["validation_strategy"]
    assert meta["samples_trained"] == 64

    metrics = meta["metrics"]
    assert metrics["mean_rmse"] < 0.15, f"RMSE too high: {metrics['mean_rmse']}"
    assert metrics["mean_mae"] < 0.10, f"MAE too high: {metrics['mean_mae']}"
    assert metrics["mean_r2"] >= 0.80, f"R^2 too low: {metrics['mean_r2']}"

    # Verify feature importances
    assert len(meta["feature_importances"]) == 9
    assert "norm_heat_anomaly" in meta["feature_importances"]
    assert "norm_flood_discharge" in meta["feature_importances"]


def test_ml_risk_inference():
    # Test novel feature combination
    sample_features = {
        "norm_heat_anomaly": 0.85,
        "norm_flood_discharge": 0.90,
        "norm_low_elevation": 0.75,
        "coastal_lowland_ratio": 0.80,
        "norm_poverty_rate": 0.65,
        "norm_population_density": 0.70,
        "built_up_ratio": 0.45,
        "green_water_ratio": 0.30,
        "sensor_scarcity_flag": 0.50,
    }
    pred = ml_risk_engine.predict_hazard_risk(sample_features)
    assert 0.0 <= pred <= 1.0
    assert pred > 0.60, f"High-hazard vector should yield high risk score, got {pred}"


def test_district_shap_explanation():
    # Sunamganj (BD6090) in haor basin: flood discharge should be top driver
    explanation = ml_risk_engine.get_district_explanation("BD6090")
    assert explanation["adm2_pcode"] == "BD6090"
    assert explanation["district_name"] == "Sunamganj"
    assert explanation["explanation_method"] == "TreeExplainer (Exact Shapley Values)"
    assert len(explanation["top_positive_risk_drivers"]) >= 1

    driver_keys = [d["feature_key"] for d in explanation["top_positive_risk_drivers"]]
    assert "norm_flood_discharge" in driver_keys or "norm_low_elevation" in driver_keys
    assert len(explanation["plain_language_summary"]) > 10


def test_precomputed_shap_table():
    shap_path = BASE_DIR / "data" / "curated" / "shap_values_curated.parquet"
    table = pq.read_table(shap_path)
    assert table.num_rows == 64
    assert "predicted_risk_r_hat" in table.column_names
    assert "expected_base_value" in table.column_names
    assert "shap_norm_heat_anomaly" in table.column_names
    assert "shap_norm_flood_discharge" in table.column_names
