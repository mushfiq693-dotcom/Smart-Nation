import districtsData from "./districts_data.json";

export interface DistrictMetric {
  adm2_pcode: string;
  adm2_en: string;
  adm2_bn: string;
  adm1_pcode: string;
  population: number;
  apparent_temp_anomaly_c: number;
  glofas_p75_discharge: number;
  elevation_mean_m: number;
  coastal_lowland_ratio: number;
  poverty_headcount_pct: number;
  pop_density_per_sqkm: number;
  built_up_ratio: number;
  green_water_ratio: number;
  v_i: number;
  has_ground_aq_station: boolean;
}

export const INTERVENTION_PROFILES: Record<string, any> = {
  cool_roofs_and_canopy: {
    title_en: "Urban Tree Canopy & Cool Roof Mandates",
    title_bn: "নগর বনায়ন ও শীতল ছাদ ব্যবস্থা",
    primary_sector: "heat",
    target_hazard: "apparent_temp_anomaly_c",
    unit_cost_usd: 25000.0,
    max_risk_reduction_pct: 22.0,
  },
  riverine_embankment_and_drainage: {
    title_en: "Sluice Gates, Embankments & Permeable Drainage",
    title_bn: "স্লুইস গেট, বাঁধ ও পানি নিষ্কাশন ব্যবস্থা",
    primary_sector: "flood",
    target_hazard: "glofas_p75_discharge",
    unit_cost_usd: 35000.0,
    max_risk_reduction_pct: 28.0,
  },
  low_cost_sensor_deployment: {
    title_en: "IoT Weather & Hyperlocal Air Quality Sensors",
    title_bn: "আইওটি আবহাওয়া ও বায়ুমান সেন্সর স্থাপন",
    primary_sector: "air",
    target_hazard: "sensor_scarcity_flag",
    unit_cost_usd: 15000.0,
    max_risk_reduction_pct: 15.0,
  },
  balanced_resilience_mix: {
    title_en: "Comprehensive Urban Climate Resilience Package",
    title_bn: "সমন্বিত নগর জলবায়ু সহনশীলতা প্যাকেজ",
    primary_sector: "all",
    target_hazard: "composite_hazard",
    unit_cost_usd: 30000.0,
    max_risk_reduction_pct: 25.0,
  },
};

export function runClientSimulation(params: {
  budget_usd?: number;
  alpha_equity?: number;
  w_risk?: number;
  sector_weights?: Record<string, number>;
  intervention_type?: string;
  min_allocation_usd?: number;
}) {
  const budget_usd = params.budget_usd ?? 500000;
  const alpha_equity = params.alpha_equity ?? 0.5;
  const w_risk = params.w_risk ?? 1.0;
  const sector_weights = params.sector_weights ?? {
    heat: 0.35,
    flood: 0.35,
    air: 0.15,
    elevation: 0.15,
  };
  const intervention_type = params.intervention_type ?? "balanced_resilience_mix";
  const min_allocation_usd = params.min_allocation_usd ?? 15000;

  const weightSum =
    Object.values(sector_weights).reduce((a, b) => a + b, 0) || 1.0;
  const normWeights: Record<string, number> = {};
  for (const [k, v] of Object.entries(sector_weights)) {
    normWeights[k] = v / weightSum;
  }

  const intervention =
    INTERVENTION_PROFILES[intervention_type] ||
    INTERVENTION_PROFILES["balanced_resilience_mix"];

  const districts: DistrictMetric[] = districtsData as DistrictMetric[];
  const maxPop = Math.max(...districts.map((d) => d.population)) || 1.0;

  const districtScores = districts.map((d) => {
    const popNorm = d.population / maxPop;
    const v_i = d.v_i;

    const normHeat = Math.min(1.0, d.apparent_temp_anomaly_c / 4.0);
    const normFlood = d.glofas_p75_discharge;
    const normLowElev = Math.min(
      1.0,
      Math.max(0.0, 1.0 - d.elevation_mean_m / 45.0)
    );
    const coastalLowland = d.coastal_lowland_ratio;
    const normPoverty = d.poverty_headcount_pct / 60.0;
    const normPopDensity = Math.min(1.0, d.pop_density_per_sqkm / 4000.0);
    const builtUp = d.built_up_ratio;
    const sensorScarcity = d.has_ground_aq_station ? 0.0 : 0.5;

    // Composite Hazard Risk approximation matching trained XGBoost
    const r_hat =
      0.24 * normHeat * (normWeights["heat"] || 0.35) * 2.8 +
      0.26 * normFlood * (normWeights["flood"] || 0.35) * 2.8 +
      0.15 * normLowElev * (normWeights["elevation"] || 0.15) * 6.5 +
      0.12 * coastalLowland +
      0.11 * normPoverty +
      0.06 * normPopDensity +
      0.03 * builtUp +
      0.03 * sensorScarcity;

    const r_hat_clamped = Math.min(0.99, Math.max(0.15, r_hat));

    // P_i(alpha) = w_risk * R_hat * (1 + alpha * V_i) * PopNorm_i^0.65
    const p_score =
      w_risk *
      r_hat_clamped *
      (1.0 + alpha_equity * v_i) *
      Math.pow(popNorm, 0.65);

    return {
      adm2_pcode: d.adm2_pcode,
      adm2_en: d.adm2_en,
      adm2_bn: d.adm2_bn,
      adm1_pcode: d.adm1_pcode,
      population: d.population,
      r_hat: parseFloat(r_hat_clamped.toFixed(4)),
      v_i: d.v_i,
      p_score,
      has_ground_aq_station: d.has_ground_aq_station,
    };
  });

  const totalPScore =
    districtScores.reduce((acc, d) => acc + d.p_score, 0) || 1.0;
  const scored = districtScores.map((d) => ({
    ...d,
    weight_share: d.p_score / totalPScore,
  }));

  scored.sort((a, b) => b.weight_share - a.weight_share);

  const eligibleDistricts = scored.slice(0, 15);
  const subTotalWeight =
    eligibleDistricts.reduce((acc, d) => acc + d.weight_share, 0) || 1.0;

  const allocations: any[] = [];
  let allocatedSoFar = 0;

  eligibleDistricts.forEach((d, idx) => {
    const rank = idx + 1;
    const rawAlloc = (d.weight_share / subTotalWeight) * budget_usd;
    let allocUsd = Math.round(Math.max(min_allocation_usd, rawAlloc));

    if (rank === eligibleDistricts.length) {
      allocUsd = Math.round(budget_usd - allocatedSoFar);
    }
    allocatedSoFar += allocUsd;

    const mitigationPct = Math.min(
      intervention.max_risk_reduction_pct,
      (allocUsd / 50000.0) * intervention.max_risk_reduction_pct
    );
    const r_hat_after = Math.max(
      0.0,
      d.r_hat * (1.0 - mitigationPct / 100.0)
    );
    const protectedPop = Math.round(d.population * (mitigationPct / 100.0));

    allocations.push({
      rank,
      adm2_pcode: d.adm2_pcode,
      adm2_en: d.adm2_en,
      adm2_bn: d.adm2_bn,
      adm1_pcode: d.adm1_pcode,
      population: d.population,
      baseline_risk_score: d.r_hat,
      vulnerability_index_vi: d.v_i,
      priority_score: parseFloat(d.p_score.toFixed(4)),
      allocated_usd: allocUsd,
      allocation_pct: parseFloat(((allocUsd / budget_usd) * 100).toFixed(2)),
      estimated_risk_reduction_pct: parseFloat(mitigationPct.toFixed(2)),
      simulated_risk_score_after: parseFloat(r_hat_after.toFixed(4)),
      estimated_protected_population: protectedPop,
      sensor_gap_addressed: !d.has_ground_aq_station,
    });
  });

  // Calculate Gini coefficient of allocations
  const allocValues = allocations.map((a) => a.allocated_usd).sort((a, b) => a - b);
  const n = allocValues.length;
  const total = allocValues.reduce((a, b) => a + b, 0);
  let diffSum = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      diffSum += Math.abs(allocValues[i] - allocValues[j]);
    }
  }
  const gini = total > 0 ? diffSum / (2 * n * total) : 0;

  const totalProtected = allocations.reduce(
    (acc, a) => acc + a.estimated_protected_population,
    0
  );
  const meanReduction =
    allocations.reduce((acc, a) => acc + a.estimated_risk_reduction_pct, 0) /
    allocations.length;

  return {
    budget_usd,
    alpha_equity,
    w_risk,
    sector_weights: normWeights,
    intervention,
    total_districts_funded: allocations.length,
    total_allocated_usd: allocations.reduce((acc, a) => acc + a.allocated_usd, 0),
    total_estimated_protected_population: totalProtected,
    mean_risk_mitigation_pct: parseFloat(meanReduction.toFixed(2)),
    equity_gini_coefficient: parseFloat(gini.toFixed(3)),
    allocations,
    is_exploratory: true,
    scenario_id: `scen_client_${Date.now()}`,
    created_by: "dhaka_analyst",
    disclaimer:
      "Scenario estimate based on mathematical priority modeling. Not a causal policy forecast.",
  };
}
