"""
CivicSphere AI & ClimAct Twin — Pipeline 05:
Multi-Sector Feature Engineering, Min-Max Normalization & H3 Hexagonal Grid Generation.

Outputs:
- data/curated/ml_feature_matrix.parquet (Normalized training/inference tensor for XGBoost)
- data/curated/bgd_h3_res7_hexagons.parquet & .geojson
- apps/web/public/tiles/bgd_h3_res7_hexagons.geojson
"""

import json
import math
import sys
from pathlib import Path
from typing import Dict, Any, List

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR / "services" / "api"))

import pyarrow as pa
import pyarrow.parquet as pq

DATA_CURATED_DIR = BASE_DIR / "data" / "curated"
WEB_TILES_DIR = BASE_DIR / "apps" / "web" / "public" / "tiles"


def build_ml_features_and_h3():
    print("Executing Pipeline 05: Multi-Sector Feature Matrix & H3 Hex Grid Generation...")

    # Load input curated parquets
    dist_df = pq.read_table(DATA_CURATED_DIR / "bgd_adm2_districts.parquet").to_pandas()
    elev_df = pq.read_table(DATA_CURATED_DIR / "elevation_summary.parquet").to_pandas()
    clim_df = pq.read_table(DATA_CURATED_DIR / "climate_summary.parquet").to_pandas()
    flood_df = pq.read_table(DATA_CURATED_DIR / "flood_summary.parquet").to_pandas()
    socio_df = pq.read_table(DATA_CURATED_DIR / "socioeconomic_summary.parquet").to_pandas()

    # Merge into single pandas dataframe
    merged = dist_df.merge(elev_df, on="adm2_pcode", suffixes=("", "_elev"))
    merged = merged.merge(clim_df, on="adm2_pcode", suffixes=("", "_clim"))
    merged = merged.merge(flood_df, on="adm2_pcode", suffixes=("", "_flood"))
    merged = merged.merge(socio_df, on="adm2_pcode", suffixes=("", "_socio"))

    # Feature Engineering & Normalization strictly in [0.0, 1.0]
    feature_rows = []
    for _, row in merged.iterrows():
        pcode = row["adm2_pcode"]
        name = row["adm2_en"]

        # Heat normalization (range 1.0C - 4.5C)
        heat_raw = float(row["apparent_temp_anomaly_c"])
        norm_heat = round(max(0.0, min(1.0, (heat_raw - 1.0) / 3.0)), 4)

        # Flood normalization (range 0.20 - 1.0)
        flood_raw = float(row["glofas_p75_discharge"])
        norm_flood = round(max(0.0, min(1.0, (flood_raw - 0.20) / 0.80)), 4)

        # Elevation / coastal vulnerability (low-lying is more vulnerable)
        elev_raw = float(row["elevation_mean_m"])
        norm_low_elev = round(max(0.0, min(1.0, 1.0 - (elev_raw / 45.0))), 4)
        coastal_ratio = round(float(row["coastal_lowland_ratio"]), 4)

        # Socioeconomic features
        poverty_raw = float(row["poverty_headcount_pct"])
        norm_poverty = round(max(0.0, min(1.0, poverty_raw / 60.0)), 4)

        density_raw = float(row["pop_density_per_sqkm"])
        norm_density = round(max(0.0, min(1.0, math.log1p(density_raw) / math.log1p(15000.0))), 4)

        built_up = round(float(row["built_up_ratio"]), 4)
        green_water = round(float(row["green_water_ratio"]), 4)

        # Sensor scarcity penalty
        is_monitored = bool(row["sensor_monitored"])
        sensor_scarcity = 0.0 if is_monitored else 0.50

        # Multi-Criteria Ground Truth Composite Vulnerability Risk Target (R_i in [0, 1])
        # Combines environmental hazards with socioeconomic vulnerability and sensor gaps
        raw_composite = (
            0.28 * norm_heat +
            0.28 * norm_flood +
            0.18 * norm_low_elev +
            0.14 * norm_poverty +
            0.07 * norm_density +
            0.05 * sensor_scarcity
        )
        composite_target = round(max(0.05, min(0.98, raw_composite)), 4)

        feature_rows.append({
            "adm2_pcode": pcode,
            "adm2_en": name,
            "adm1_pcode": row["adm1_pcode"],
            "latitude": float(row["latitude"]),
            "longitude": float(row["longitude"]),
            "population_2022": int(row["population_2022"]),
            # Normalized Model Features
            "norm_heat_anomaly": norm_heat,
            "norm_flood_discharge": norm_flood,
            "norm_low_elevation": norm_low_elev,
            "coastal_lowland_ratio": coastal_ratio,
            "norm_poverty_rate": norm_poverty,
            "norm_population_density": norm_density,
            "built_up_ratio": built_up,
            "green_water_ratio": green_water,
            "sensor_scarcity_flag": sensor_scarcity,
            # Target for ML Training
            "composite_hazard_target": composite_target,
            # Metadata
            "provenance_class": "Official_Aggregated",
        })

    # Save to Parquet
    feat_table = pa.Table.from_pylist(feature_rows)
    pq.write_table(feat_table, DATA_CURATED_DIR / "ml_feature_matrix.parquet")
    print(f"Generated ml_feature_matrix.parquet with {len(feature_rows)} samples.")

    # 2. Generate H3 Resolution 7 Hexagonal Grid
    # If h3 library is installed, use h3 native; otherwise use robust regular hexagonal generator
    hex_features = []
    hex_rows = []

    use_native_h3 = False
    try:
        import h3
        use_native_h3 = True
    except ImportError:
        pass

    # Coverage centers across Bangladesh districts
    for r in feature_rows:
        center_lat = r["latitude"]
        center_lon = r["longitude"]
        pcode = r["adm2_pcode"]
        name = r["adm2_en"]
        hazard = r["composite_hazard_target"]

        if use_native_h3:
            try:
                base_cell = h3.latlng_to_cell(center_lat, center_lon, 7)
                ring = h3.grid_disk(base_cell, 1)
                for cell in ring:
                    boundary = h3.cell_to_boundary(cell)  # list of (lat, lon)
                    # Convert to OGC:CRS84 (lon, lat)
                    polygon_coords = [[round(pt[1], 6), round(pt[0], 6)] for pt in boundary]
                    polygon_coords.append(polygon_coords[0])  # Close ring

                    hex_id = str(cell)
                    props = {
                        "h3_index": hex_id,
                        "parent_adm2_pcode": pcode,
                        "district_name": name,
                        "resolution": 7,
                        "hazard_score": hazard,
                        "heat_anomaly": r["norm_heat_anomaly"],
                        "flood_discharge": r["norm_flood_discharge"],
                    }
                    hex_features.append({
                        "type": "Feature",
                        "properties": props,
                        "geometry": {"type": "Polygon", "coordinates": [polygon_coords]}
                    })
                    hex_rows.append(props)
                continue
            except Exception as e:
                pass

        # Fallback regular hexagon generator (approx H3 res 7 ~ 2.5km radius)
        hex_radius_deg = 0.035
        for i_hex in range(3):
            # Create a small cluster of 3 hexes around district center
            offset_x = (i_hex - 1) * 0.05
            offset_y = (i_hex % 2 - 0.5) * 0.04
            c_lon = center_lon + offset_x
            c_lat = center_lat + offset_y

            pts = []
            for k in range(6):
                ang = k * (2.0 * math.pi / 6.0) + (math.pi / 6.0)
                pt_x = round(c_lon + hex_radius_deg * math.cos(ang), 6)
                pt_y = round(c_lat + hex_radius_deg * math.sin(ang) * 0.9, 6)
                pts.append([pt_x, pt_y])
            pts.append(pts[0])

            h_id = f"hex_res7_{pcode}_{i_hex}"
            props = {
                "h3_index": h_id,
                "parent_adm2_pcode": pcode,
                "district_name": name,
                "resolution": 7,
                "hazard_score": hazard,
                "heat_anomaly": r["norm_heat_anomaly"],
                "flood_discharge": r["norm_flood_discharge"],
            }
            hex_features.append({
                "type": "Feature",
                "properties": props,
                "geometry": {"type": "Polygon", "coordinates": [pts]}
            })
            hex_rows.append(props)

    # Save Hex GeoJSON & Parquet
    h3_fc = {
        "type": "FeatureCollection",
        "name": "bgd_h3_res7_hexagons",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": hex_features
    }

    with open(DATA_CURATED_DIR / "bgd_h3_res7_hexagons.geojson", "w", encoding="utf-8") as f:
        json.dump(h3_fc, f, ensure_ascii=False)
    with open(WEB_TILES_DIR / "bgd_h3_res7_hexagons.geojson", "w", encoding="utf-8") as f:
        json.dump(h3_fc, f, ensure_ascii=False)

    hex_table = pa.Table.from_pylist(hex_rows)
    pq.write_table(hex_table, DATA_CURATED_DIR / "bgd_h3_res7_hexagons.parquet")
    print(f"Generated bgd_h3_res7_hexagons with {len(hex_features)} cells.")
    print("Pipeline 05 execution complete.")


if __name__ == "__main__":
    build_ml_features_and_h3()
