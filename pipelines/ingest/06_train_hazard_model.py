"""
CivicSphere AI & ClimAct Twin — Pipeline 06:
Train Composite Climate Hazard Risk Model (XGBoost Regressor)
with Spatial Group K-Fold Cross Validation by Division and TreeExplainer SHAP.

Outputs:
- data/curated/hazard_model.json (Trained XGBoost model artifact)
- data/curated/model_metadata.json (Metrics: RMSE, MAE, R^2, Feature Importances)
- data/curated/shap_values_curated.parquet (Precomputed SHAP attributions per district)
"""

import json
import sys
from pathlib import Path
from typing import Dict, Any, List
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR / "services" / "api"))

import pyarrow as pa
import pyarrow.parquet as pq

DATA_CURATED_DIR = BASE_DIR / "data" / "curated"
DATA_CATALOG_DIR = BASE_DIR / "data" / "catalog"

FEATURE_COLS = [
    "norm_heat_anomaly",
    "norm_flood_discharge",
    "norm_low_elevation",
    "coastal_lowland_ratio",
    "norm_poverty_rate",
    "norm_population_density",
    "built_up_ratio",
    "green_water_ratio",
    "sensor_scarcity_flag",
]

TARGET_COL = "composite_hazard_target"
GROUP_COL = "adm1_pcode"


def train_hazard_model():
    print("Executing Pipeline 06: XGBoost Hazard Model Training & SHAP Attribution...")

    try:
        import xgboost as xgb
        from sklearn.model_selection import GroupKFold
        from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
        import shap
    except ImportError as e:
        print(f"[Error] Required ML package missing: {e}")
        return

    # 1. Load ML Feature Matrix
    feat_matrix_path = DATA_CURATED_DIR / "ml_feature_matrix.parquet"
    if not feat_matrix_path.exists():
        raise FileNotFoundError(f"ml_feature_matrix.parquet not found. Run pipeline 05 first.")

    df = pq.read_table(feat_matrix_path).to_pandas()
    X = df[FEATURE_COLS]
    y = df[TARGET_COL]
    groups = df[GROUP_COL]

    print(f"Loaded {len(df)} samples across {len(FEATURE_COLS)} features and {len(groups.unique())} divisions.")

    # 2. Spatial Group K-Fold Cross Validation (by Division)
    # Prevents spatial autocorrelation leakage across neighboring districts
    gkf = GroupKFold(n_splits=5)
    cv_rmse_scores = []
    cv_mae_scores = []
    cv_r2_scores = []

    for fold, (train_idx, val_idx) in enumerate(gkf.split(X, y, groups=groups)):
        X_train, y_train = X.iloc[train_idx], y.iloc[train_idx]
        X_val, y_val = X.iloc[val_idx], y.iloc[val_idx]

        fold_model = xgb.XGBRegressor(
            n_estimators=120,
            max_depth=3,
            learning_rate=0.07,
            subsample=0.85,
            colsample_bytree=0.85,
            reg_alpha=0.15,
            reg_lambda=1.2,
            random_state=42 + fold,
            objective="reg:squarederror",
        )
        fold_model.fit(X_train, y_train)
        preds = fold_model.predict(X_val)

        rmse = float(np.sqrt(mean_squared_error(y_val, preds)))
        mae = float(mean_absolute_error(y_val, preds))
        r2 = float(r2_score(y_val, preds))

        cv_rmse_scores.append(rmse)
        cv_mae_scores.append(mae)
        cv_r2_scores.append(r2)

    mean_rmse = round(float(np.mean(cv_rmse_scores)), 4)
    mean_mae = round(float(np.mean(cv_mae_scores)), 4)
    mean_r2 = round(float(np.mean(cv_r2_scores)), 4)

    print(f"Spatial Group K-Fold CV Results (5 Folds):")
    print(f"  - Mean RMSE: {mean_rmse}")
    print(f"  - Mean MAE:  {mean_mae}")
    print(f"  - Mean R^2:  {mean_r2}")

    # 3. Train Final Model on All Data
    final_model = xgb.XGBRegressor(
        n_estimators=140,
        max_depth=3,
        learning_rate=0.07,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_alpha=0.15,
        reg_lambda=1.2,
        random_state=42,
        objective="reg:squarederror",
    )
    final_model.fit(X, y)

    # Save Model Artifact
    model_json_path = DATA_CURATED_DIR / "hazard_model.json"
    final_model.save_model(str(model_json_path))
    print(f"Saved trained XGBoost model to {model_json_path}")

    # 4. Feature Importance
    importances = final_model.feature_importances_
    feat_importance_dict = {
        feat: round(float(imp), 4) for feat, imp in zip(FEATURE_COLS, importances)
    }

    # 5. TreeExplainer SHAP Values Computation
    print("Computing TreeExplainer exact SHAP attributions...")
    explainer = shap.TreeExplainer(final_model)
    shap_values = explainer(X)  # Explanation object

    # Extract base value (expected value)
    base_val = float(explainer.expected_value) if hasattr(explainer.expected_value, "__float__") else float(explainer.expected_value[0])

    shap_rows = []
    for i, row in df.iterrows():
        pcode = row["adm2_pcode"]
        name = row["adm2_en"]
        predicted_r = float(final_model.predict(X.iloc[[i]])[0])

        shap_entry = {
            "adm2_pcode": pcode,
            "adm2_en": name,
            "predicted_risk_r_hat": round(max(0.0, min(1.0, predicted_r)), 4),
            "expected_base_value": round(base_val, 4),
        }

        # Add SHAP attribution for each feature
        for j, f_name in enumerate(FEATURE_COLS):
            phi = float(shap_values.values[i, j])
            shap_entry[f"shap_{f_name}"] = round(phi, 4)

        shap_rows.append(shap_entry)

    # Save SHAP Parquet
    shap_table = pa.Table.from_pylist(shap_rows)
    pq.write_table(shap_table, DATA_CURATED_DIR / "shap_values_curated.parquet")
    print(f"Precomputed SHAP values for {len(shap_rows)} districts saved to shap_values_curated.parquet.")

    # 6. Save Model Metadata
    model_metadata = {
        "model_type": "XGBoost Regressor (TreeExplainer Compatible)",
        "features": FEATURE_COLS,
        "target": TARGET_COL,
        "samples_trained": len(df),
        "validation_strategy": "Spatial Group K-Fold by Division (5 Folds)",
        "metrics": {
            "mean_rmse": mean_rmse,
            "mean_mae": mean_mae,
            "mean_r2": mean_r2,
        },
        "feature_importances": feat_importance_dict,
        "base_expected_value": round(base_val, 4),
        "license": "Open Model (CivicSphere & NRB Hub Accessible)",
        "trained_timestamp": "2026-11-18T00:00:00Z",
    }

    with open(DATA_CURATED_DIR / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)

    print("Pipeline 06 execution complete.")


if __name__ == "__main__":
    train_hazard_model()
