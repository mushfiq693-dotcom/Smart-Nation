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


# Global singleton
equity_optimizer = EquityOptimizer()
