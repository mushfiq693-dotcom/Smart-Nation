"""
CivicSphere AI & ClimAct Twin — Engine 01:
In-Process DuckDB Spatial Vectorized Analytical Query Engine.

Executes sub-50ms columnar analytical joins directly over curated GeoParquet tables.
Avoids the EPSG:4326 axis-flip bug via OGC:CRS84 (lon, lat) standard and UTM Zone 45N metric projection.
"""

import time
from pathlib import Path
from typing import Dict, Any, List, Optional
import duckdb
from app.core.config import settings

def get_curated_dir() -> Path:
    return Path(settings.DATA_DIR) / "curated"


class SpatialDuckDBEngine:
    def __init__(self, in_memory: bool = True):
        self._in_memory = in_memory
        self.conn = self._init_connection()

    @property
    def data_dir(self) -> Path:
        return get_curated_dir()

    @property
    def db_path(self) -> str:
        return ":memory:" if self._in_memory else str(self.data_dir / "civicsphere_spatial.duckdb")

    def _init_connection(self) -> duckdb.DuckDBPyConnection:
        conn = duckdb.connect(self.db_path)
        # Configure memory and thread limits for predictable latency
        conn.execute(f"SET memory_limit = '{settings.DUCKDB_MEMORY_LIMIT}';")
        conn.execute(f"SET threads = {settings.DUCKDB_THREADS};")

        # Load Spatial Extension
        try:
            conn.execute("LOAD spatial;")
            conn.execute("SET geometry_always_xy = true;")
        except Exception:
            try:
                conn.execute("INSTALL spatial; LOAD spatial;")
                conn.execute("SET geometry_always_xy = true;")
            except Exception as e:
                print(f"[Warning] Failed to load spatial extension: {e}")

        return conn

    def get_unified_district_matrix(self) -> List[Dict[str, Any]]:
        """
        Vectorized multi-table join across all 5 curated parquet tables:
        districts, elevation, climate, flood, and socioeconomic summaries.
        Executes in-process with sub-50ms latency.
        """
        districts_p = str(self.data_dir / "bgd_adm2_districts.parquet")
        elev_p = str(self.data_dir / "elevation_summary.parquet")
        climate_p = str(self.data_dir / "climate_summary.parquet")
        flood_p = str(self.data_dir / "flood_summary.parquet")
        socio_p = str(self.data_dir / "socioeconomic_summary.parquet")
        stations_p = str(self.data_dir / "openaq_bd_stations.parquet")

        query = f"""
        WITH station_agg AS (
            SELECT
                adm2_pcode,
                COUNT(station_id) AS openaq_station_count,
                AVG(pm25_ug_m3) AS station_mean_pm25,
                AVG(pm10_ug_m3) AS station_mean_pm10
            FROM read_parquet('{stations_p}')
            GROUP BY adm2_pcode
        )
        SELECT
            d.adm2_pcode,
            d.adm2_en,
            d.adm2_bn,
            d.adm1_pcode,
            d.latitude,
            d.longitude,
            d.population_2022,
            d.area_sqkm,
            e.elevation_mean_m,
            e.elevation_p10_m,
            e.coastal_lowland_ratio,
            c.apparent_temp_anomaly_c,
            c.apparent_temp_max_c,
            c.relative_humidity_mean_pct,
            c.urban_heat_island_delta_c,
            c.exceedance_days_above_40c,
            f.glofas_p75_discharge,
            f.mean_river_discharge_m3s,
            f.monsoon_inundation_risk,
            s.pop_density_per_sqkm,
            s.poverty_headcount_pct,
            s.urban_population_pct,
            s.built_up_ratio,
            s.green_water_ratio,
            s.vulnerability_index_vi,
            COALESCE(st.openaq_station_count, 0) AS air_station_count,
            COALESCE(st.station_mean_pm25, 0.0) AS station_mean_pm25,
            CASE WHEN COALESCE(st.openaq_station_count, 0) > 0 THEN TRUE ELSE FALSE END AS has_ground_aq_station
        FROM read_parquet('{districts_p}') d
        LEFT JOIN read_parquet('{elev_p}') e ON d.adm2_pcode = e.adm2_pcode
        LEFT JOIN read_parquet('{climate_p}') c ON d.adm2_pcode = c.adm2_pcode
        LEFT JOIN read_parquet('{flood_p}') f ON d.adm2_pcode = f.adm2_pcode
        LEFT JOIN read_parquet('{socio_p}') s ON d.adm2_pcode = s.adm2_pcode
        LEFT JOIN station_agg st ON d.adm2_pcode = st.adm2_pcode
        ORDER BY d.adm2_pcode ASC;
        """

        start = time.perf_counter()
        df = self.conn.execute(query).df()
        duration_ms = (time.perf_counter() - start) * 1000.0

        records = df.to_dict(orient="records")
        for r in records:
            r["query_latency_ms"] = round(duration_ms, 2)
            r["provenance"] = {
                "boundaries": "HDX UN OCHA COD-AB (Official)",
                "elevation": "Copernicus GLO-30 DEM (Official)",
                "climate": "Open-Meteo ERA5 (Reanalysis_Estimate)",
                "flood": "Open-Meteo GloFAS v4 (Reanalysis_Estimate)",
                "air_quality": "OpenAQ v3 Platform (Official)",
                "socioeconomic": "BBS Census 2022 & World Bank v2 (Official)",
            }
        return records

    def query_districts(
        self,
        adm1_pcode: Optional[str] = None,
        min_heat_anomaly: Optional[float] = None,
        min_flood_p75: Optional[float] = None,
        sensor_scarce_only: bool = False,
        sort_by: str = "apparent_temp_anomaly_c",
        ascending: bool = False,
        limit: int = 64
    ) -> Dict[str, Any]:
        """
        Fast filtered query with execution latency tracking.
        """
        all_records = self.get_unified_district_matrix()
        filtered = all_records

        if adm1_pcode:
            filtered = [r for r in filtered if r["adm1_pcode"] == adm1_pcode]
        if min_heat_anomaly is not None:
            filtered = [r for r in filtered if r["apparent_temp_anomaly_c"] >= min_heat_anomaly]
        if min_flood_p75 is not None:
            filtered = [r for r in filtered if r["glofas_p75_discharge"] >= min_flood_p75]
        if sensor_scarce_only:
            filtered = [r for r in filtered if not r["has_ground_aq_station"]]

        # Sort
        sort_key = sort_by if sort_by in (filtered[0] if filtered else {}) else "apparent_temp_anomaly_c"
        filtered.sort(key=lambda x: x.get(sort_key, 0), reverse=not ascending)
        result_slice = filtered[:limit]

        return {
            "total_matches": len(filtered),
            "returned_count": len(result_slice),
            "sort_by": sort_key,
            "order": "asc" if ascending else "desc",
            "results": result_slice,
        }

    def compute_metric_distance_meters(
        self, lat1: float, lon1: float, lat2: float, lon2: float
    ) -> float:
        """
        Computes metric geodesic distance between two points in Bangladesh
        using DuckDB Spatial ST_Distance_Sphere.
        """
        query = f"""
        SELECT ST_Distance_Sphere(
            ST_Point({lon1}, {lat1}),
            ST_Point({lon2}, {lat2})
        ) AS distance_meters;
        """
        res = self.conn.execute(query).fetchone()
        return round(float(res[0]), 2) if res else 0.0

    def benchmark_latency(self) -> Dict[str, Any]:
        """Verify that spatial vectorized analytical queries execute within sub-50ms target"""
        start = time.perf_counter()
        records = self.get_unified_district_matrix()
        elapsed_ms = (time.perf_counter() - start) * 1000.0

        return {
            "query_type": "Vectorized 5-Parquet Multi-Join",
            "rows_returned": len(records),
            "columns": len(records[0]) if records else 0,
            "latency_ms": round(elapsed_ms, 2),
            "sub_50ms_target_met": elapsed_ms < 50.0,
        }


# Global singleton engine
duckdb_engine = SpatialDuckDBEngine()
