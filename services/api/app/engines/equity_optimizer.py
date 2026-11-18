"""
CivicSphere AI & ClimAct Twin — Engine 03:
Equity-Weighted Policy Simulation & Budget Allocation Optimizer.

Implements the mathematical priority ranking algorithm:
P_i(alpha_equity) = w_risk * R_hat_i * (1 + alpha_equity * V_i) * PopNorm_i
"""

from typing import Dict, Any, List, Optional
import math
from app.engines.spatial_duckdb import duckdb_engine
from app.engines.ml_risk_shap import ml_risk_engine

INTERVENTION_PROFILES = {
    "cool_roofs_and_canopy": {
        "title_en": "Urban Tree Canopy & Cool Roof Mandates",
        "title_bn": "নগর বনায়ন ও শীতল ছাদ ব্যবস্থা",
        "primary_sector": "heat",
        "target_hazard": "apparent_temp_anomaly_c",
        "unit_cost_usd": 25000.0,
        "max_risk_reduction_pct": 22.0,
    },
    "riverine_embankment_and_drainage": {
        "title_en": "Sluice Gates, Embankments & Permeable Drainage",
        "title_bn": "স্লুইস গেট, বাঁধ ও পানি নিষ্কাশন ব্যবস্থা",
        "primary_sector": "flood",
        "target_hazard": "glofas_p75_discharge",
        "unit_cost_usd": 35000.0,
        "max_risk_reduction_pct": 28.0,
    },
    "low_cost_sensor_deployment": {
        "title_en": "IoT Weather & Hyperlocal Air Quality Sensors",
        "title_bn": "আইওটি আবহাওয়া ও বায়ুমান সেন্সর স্থাপন",
        "primary_sector": "air",
        "target_hazard": "sensor_scarcity_flag",
        "unit_cost_usd": 15000.0,
        "max_risk_reduction_pct": 15.0,
    },
    "balanced_resilience_mix": {
        "title_en": "Comprehensive Urban Climate Resilience Package",
        "title_bn": "সমন্বিত নগর জলবায়ু সহনশীলতা প্যাকেজ",
        "primary_sector": "all",
        "target_hazard": "composite_hazard",
        "unit_cost_usd": 30000.0,
        "max_risk_reduction_pct": 25.0,
    },
}

DHAKA_INTERVENTIONS = {
    "dhaka_cool_roofs": {
        "title_en": "DNCC Slum Cool Roofs & Thermal Paint Initiative",
        "title_bn": "বস্তির টিনের চালে কুল রুফ ও থার্মাল কোটিং উদ্যোগ",
        "primary_sector": "heat",
        "target_hazard": "uhi_anomaly_c",
        "unit_cost_usd": 20000.0,
        "max_risk_reduction_pct": 26.0,
    },
    "dhaka_drainage_sluice": {
        "title_en": "Hatirjheel & Kallyanpur Basin Smart Sluice Gates & Desilting",
        "title_bn": "হাতিরঝিল ও কল্যাণপুর খালে স্মার্ট স্লুইস গেট ও পলি অপসারণ",
        "primary_sector": "flood",
        "target_hazard": "waterlogging_risk_pct",
        "unit_cost_usd": 35000.0,
        "max_risk_reduction_pct": 32.0,
    },
    "dhaka_urban_forestry": {
        "title_en": "Miyawaki Micro-Forestry & Green Corridor Network",
        "title_bn": "মিয়াওয়াকি ক্ষুদ্র নগর বনায়ন ও সবুজ করিডোর নেটওয়ার্ক",
        "primary_sector": "heat",
        "target_hazard": "green_canopy_ratio",
        "unit_cost_usd": 25000.0,
        "max_risk_reduction_pct": 22.0,
    },
    "dhaka_iot_sensors": {
        "title_en": "129 Wards Micro IoT Air & Drainage Sensor Mesh",
        "title_bn": "১২৯টি ওয়ার্ডে হাইপারলোকাল আইওটি বায়ু ও বন্যা সেন্সর গ্রিড",
        "primary_sector": "air",
        "target_hazard": "pm25_exposure_ug_m3",
        "unit_cost_usd": 15000.0,
        "max_risk_reduction_pct": 18.0,
    },
    "dhaka_balanced_package": {
        "title_en": "Dhaka Megacity Integrated Climate Resilience Package",
        "title_bn": "ঢাকা মেগাসিটি সমন্বিত জলবায়ু সহনশীলতা প্যাকেজ",
        "primary_sector": "all",
        "target_hazard": "composite_hazard",
        "unit_cost_usd": 30000.0,
        "max_risk_reduction_pct": 28.0,
    },
}


class EquityOptimizer:
    def __init__(self):
        pass

    def run_simulation(
        self,
        budget_usd: float = 500000.0,
        alpha_equity: float = 0.50,
        w_risk: float = 1.0,
        sector_weights: Optional[Dict[str, float]] = None,
        intervention_type: str = "balanced_resilience_mix",
        min_allocation_usd: float = 15000.0,
    ) -> Dict[str, Any]:
        """
        Executes constrained budget allocation under varying equity weighting factors.
        """
        if sector_weights is None:
            sector_weights = {"heat": 0.35, "flood": 0.35, "air": 0.15, "elevation": 0.15}

        # Normalize sector weights to sum to 1.0
        weight_sum = sum(sector_weights.values()) or 1.0
        norm_sector_weights = {k: v / weight_sum for k, v in sector_weights.items()}

        # 1. Fetch live district matrix from DuckDB Spatial
        districts = duckdb_engine.get_unified_district_matrix()
        max_pop = max(d["population_2022"] for d in districts) or 1.0

        intervention = INTERVENTION_PROFILES.get(
            intervention_type, INTERVENTION_PROFILES["balanced_resilience_mix"]
        )

        # 2. Compute Priority Score P_i(alpha_equity) for each district
        district_scores = []
        for d in districts:
            pcode = d["adm2_pcode"]
            name = d["adm2_en"]
            pop = d["population_2022"]
            pop_norm = pop / max_pop
            v_i = d["vulnerability_index_vi"]  # in [0, 1]

            # Ingest features into ML risk model to get R_hat
            feat_vec = {
                "norm_heat_anomaly": min(1.0, d["apparent_temp_anomaly_c"] / 4.0),
                "norm_flood_discharge": d["glofas_p75_discharge"],
                "norm_low_elevation": min(1.0, max(0.0, 1.0 - (d["elevation_mean_m"] / 45.0))),
                "coastal_lowland_ratio": d["coastal_lowland_ratio"],
                "norm_poverty_rate": d["poverty_headcount_pct"] / 60.0,
                "norm_population_density": min(1.0, d["pop_density_per_sqkm"] / 4000.0),
                "built_up_ratio": d["built_up_ratio"],
                "green_water_ratio": d["green_water_ratio"],
                "sensor_scarcity_flag": 0.0 if d["has_ground_aq_station"] else 0.50,
            }
            r_hat = ml_risk_engine.predict_hazard_risk(feat_vec)

            # Mathematical Formula:
            # P_i(alpha) = w_risk * R_hat * (1 + alpha * V_i) * PopNorm_i
            p_score = w_risk * r_hat * (1.0 + alpha_equity * v_i) * (pop_norm ** 0.65)

            district_scores.append({
                "adm2_pcode": pcode,
                "adm2_en": name,
                "adm2_bn": d["adm2_bn"],
                "adm1_pcode": d["adm1_pcode"],
                "population": pop,
                "r_hat": r_hat,
                "v_i": v_i,
                "p_score": p_score,
                "has_ground_aq_station": d["has_ground_aq_station"],
            })

        # 3. Constrained Budget Allocation (Proportional to P_score)
        total_p_score = sum(d["p_score"] for d in district_scores) or 1.0
        for d in district_scores:
            d["weight_share"] = d["p_score"] / total_p_score

        # Sort descending by priority score
        district_scores.sort(key=lambda x: x["weight_share"], reverse=True)

        # Allocate budget across top candidates with min_allocation_usd floor
        allocations = []
        allocated_so_far = 0.0
        remaining_budget = budget_usd

        # Top 15 districts receive primary intervention packages
        eligible_districts = district_scores[:15]
        sub_total_weight = sum(d["weight_share"] for d in eligible_districts) or 1.0

        for rank, d in enumerate(eligible_districts, start=1):
            raw_alloc = (d["weight_share"] / sub_total_weight) * budget_usd
            # Ensure round numbers and respect min allocation
            alloc_usd = round(max(min_allocation_usd, raw_alloc), 2)
            if rank == len(eligible_districts):
                # Ensure exact budget conservation
                alloc_usd = round(budget_usd - allocated_so_far, 2)

            allocated_so_far += alloc_usd

            # Estimated impact
            mitigation_pct = min(
                intervention["max_risk_reduction_pct"],
                (alloc_usd / 50000.0) * intervention["max_risk_reduction_pct"]
            )
            r_hat_after = round(max(0.0, d["r_hat"] * (1.0 - (mitigation_pct / 100.0))), 4)
            protected_pop = int(round(d["population"] * (mitigation_pct / 100.0)))

            allocations.append({
                "rank": rank,
                "adm2_pcode": d["adm2_pcode"],
                "adm2_en": d["adm2_en"],
                "adm2_bn": d["adm2_bn"],
                "adm1_pcode": d["adm1_pcode"],
                "population": d["population"],
                "baseline_risk_score": d["r_hat"],
                "vulnerability_index_vi": d["v_i"],
                "priority_score": round(d["p_score"], 4),
                "allocated_usd": alloc_usd,
                "allocation_pct": round((alloc_usd / budget_usd) * 100.0, 2),
                "estimated_risk_reduction_pct": round(mitigation_pct, 2),
                "simulated_risk_score_after": r_hat_after,
                "estimated_protected_population": protected_pop,
                "sensor_gap_addressed": not d["has_ground_aq_station"],
            })

        # Calculate Gini coefficient of allocations
        alloc_values = [a["allocated_usd"] for a in allocations]
        gini = self._calculate_gini(alloc_values)

        total_protected = sum(a["estimated_protected_population"] for a in allocations)
        mean_reduction = round(sum(a["estimated_risk_reduction_pct"] for a in allocations) / len(allocations), 2)

        return {
            "budget_usd": budget_usd,
            "alpha_equity": alpha_equity,
            "w_risk": w_risk,
            "sector_weights": norm_sector_weights,
            "intervention": intervention,
            "total_districts_funded": len(allocations),
            "total_allocated_usd": round(sum(a["allocated_usd"] for a in allocations), 2),
            "total_estimated_protected_population": total_protected,
            "mean_risk_mitigation_pct": mean_reduction,
            "equity_gini_coefficient": round(gini, 3),
            "allocations": allocations,
            "is_exploratory": True,
            "disclaimer": "Scenario estimate based on mathematical priority modeling. Not a causal policy forecast.",
        }

    def _calculate_gini(self, values: List[float]) -> float:
        if not values or len(values) <= 1:
            return 0.0
        sorted_vals = sorted(values)
        n = len(values)
        total = sum(sorted_vals)
        if total == 0:
            return 0.0
        diff_sum = sum(abs(x - y) for x in sorted_vals for y in sorted_vals)
        return diff_sum / (2.0 * n * total)

    def run_dhaka_simulation(
        self,
        budget_usd: float = 250000.0,
        alpha_equity: float = 0.50,
        w_risk: float = 1.0,
        sector_weights: Optional[Dict[str, float]] = None,
        intervention_type: str = "dhaka_balanced_package",
        min_allocation_usd: float = 10000.0,
    ) -> Dict[str, Any]:
        """
        Executes municipal budget allocation across Dhaka City's 8 micro-zones (DNCC & DSCC).
        """
        import pandas as pd
        from pathlib import Path
        from app.core.config import settings

        if sector_weights is None:
            sector_weights = {"heat": 0.35, "flood": 0.35, "air": 0.15, "elevation": 0.15}

        weight_sum = sum(sector_weights.values()) or 1.0
        norm_sector_weights = {k: v / weight_sum for k, v in sector_weights.items()}

        dhaka_p = Path(settings.DATA_DIR) / "curated" / "dhaka_zones.parquet"
        if not dhaka_p.exists():
            raise FileNotFoundError("Dhaka curated zones parquet missing.")

        df = pd.read_parquet(dhaka_p)
        zones = df.to_dict(orient="records")
        max_pop = max(z["population"] for z in zones) or 1.0

        intervention = DHAKA_INTERVENTIONS.get(
            intervention_type, DHAKA_INTERVENTIONS["dhaka_balanced_package"]
        )

        zone_scores = []
        for z in zones:
            pop = z["population"]
            pop_norm = pop / max_pop
            v_i = z["v_i"]

            norm_heat = min(1.0, z["uhi_anomaly_c"] / 4.5)
            norm_waterlogging = z["waterlogging_risk_pct"] / 100.0
            norm_air = min(1.0, max(0.0, (z["pm25_exposure_ug_m3"] - 60.0) / 40.0))
            norm_poverty = z["poverty_headcount_pct"] / 35.0

            r_hat = (
                0.30 * norm_heat * norm_sector_weights.get("heat", 0.35) * 2.8 +
                0.35 * norm_waterlogging * norm_sector_weights.get("flood", 0.35) * 2.8 +
                0.20 * norm_air * norm_sector_weights.get("air", 0.15) * 6.5 +
                0.15 * norm_poverty
            )
            r_hat_clamped = min(0.99, max(0.20, r_hat))

            p_score = w_risk * r_hat_clamped * (1.0 + alpha_equity * v_i) * (pop_norm ** 0.65)

            zone_scores.append({
                "adm2_pcode": z["zone_id"],
                "adm2_en": z["name_en"],
                "adm2_bn": z["name_bn"],
                "corporation": z["corporation"],
                "adm1_pcode": "BD30",
                "population": pop,
                "r_hat": round(r_hat_clamped, 4),
                "v_i": v_i,
                "p_score": p_score,
                "key_hazards": z.get("key_hazards", "").split(", "),
            })

        total_p_score = sum(z["p_score"] for z in zone_scores) or 1.0
        for z in zone_scores:
            z["weight_share"] = z["p_score"] / total_p_score

        zone_scores.sort(key=lambda x: x["weight_share"], reverse=True)

        allocations = []
        allocated_so_far = 0.0

        for rank, z in enumerate(zone_scores, start=1):
            raw_alloc = (z["weight_share"] / 1.0) * budget_usd
            alloc_usd = round(max(min_allocation_usd, raw_alloc), 2)
            if rank == len(zone_scores):
                alloc_usd = round(budget_usd - allocated_so_far, 2)
            allocated_so_far += alloc_usd

            mitigation_pct = min(
                intervention["max_risk_reduction_pct"],
                (alloc_usd / 40000.0) * intervention["max_risk_reduction_pct"]
            )
            r_hat_after = round(max(0.0, z["r_hat"] * (1.0 - (mitigation_pct / 100.0))), 4)
            protected_pop = int(round(z["population"] * (mitigation_pct / 100.0)))

            allocations.append({
                "rank": rank,
                "adm2_pcode": z["adm2_pcode"],
                "adm2_en": z["adm2_en"],
                "adm2_bn": z["adm2_bn"],
                "corporation": z["corporation"],
                "adm1_pcode": "BD30",
                "population": z["population"],
                "baseline_risk_score": z["r_hat"],
                "vulnerability_index_vi": z["v_i"],
                "priority_score": round(z["p_score"], 4),
                "allocated_usd": alloc_usd,
                "allocation_pct": round((alloc_usd / budget_usd) * 100.0, 2),
                "estimated_risk_reduction_pct": round(mitigation_pct, 2),
                "simulated_risk_score_after": r_hat_after,
                "estimated_protected_population": protected_pop,
                "sensor_gap_addressed": True,
                "key_hazards": z["key_hazards"],
            })

        alloc_values = [a["allocated_usd"] for a in allocations]
        gini = self._calculate_gini(alloc_values)
        total_protected = sum(a["estimated_protected_population"] for a in allocations)
        mean_reduction = round(sum(a["estimated_risk_reduction_pct"] for a in allocations) / len(allocations), 2)

        return {
            "budget_usd": budget_usd,
            "alpha_equity": alpha_equity,
            "w_risk": w_risk,
            "sector_weights": norm_sector_weights,
            "intervention": intervention,
            "total_districts_funded": len(allocations),
            "total_allocated_usd": round(sum(a["allocated_usd"] for a in allocations), 2),
            "total_estimated_protected_population": total_protected,
            "mean_risk_mitigation_pct": mean_reduction,
            "equity_gini_coefficient": round(gini, 3),
            "allocations": allocations,
            "is_exploratory": True,
            "scope": "dhaka_megacity",
            "disclaimer": "Scenario estimate for Dhaka Megacity (DNCC & DSCC).",
        }


# Global singleton
equity_optimizer = EquityOptimizer()
