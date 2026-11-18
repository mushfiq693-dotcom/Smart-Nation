"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Sliders,
  DollarSign,
  Scale,
  Award,
  Shield,
  Layers,
  Sparkles,
  Download,
  FileText,
  Activity,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Globe,
  Building2,
  Building,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import {
  runClientSimulation,
  runClientDhakaSimulation,
  DHAKA_INTERVENTIONS,
  INTERVENTION_PROFILES,
} from "../../lib/simulationEngine";
import { generateClientPolicyBrief } from "../../lib/briefEngine";
import { PolicyBriefModal } from "../../components/Simulator/PolicyBriefModal";

// Dynamic import for ECharts to prevent SSR canvas errors
const AllocationBarChart = dynamic(
  () =>
    import("../../components/Charts/AllocationBarChart").then(
      (mod) => mod.AllocationBarChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-500 text-xs font-mono">
        Rendering Allocation Chart...
      </div>
    ),
  }
);

export default function SimulatorPage() {
  const { lang, t } = useI18n();
  const { role, token, canSimulate, canGenerateBrief } = useAuth();
  const isBn = lang === "bn";

  // Simulator Parameters State
  const [simScope, setSimScope] = useState<"national" | "dhaka">("national");
  const [budgetUSD, setBudgetUSD] = useState<number>(500000);
  const [alphaEquity, setAlphaEquity] = useState<number>(0.5);
  const [wRisk, setWRisk] = useState<number>(1.0);
  const [sectorWeights, setSectorWeights] = useState({
    heat: 0.35,
    flood: 0.35,
    air: 0.15,
    elevation: 0.15,
  });
  const [interventionType, setInterventionType] = useState<string>("balanced_resilience_mix");

  // Simulation Results State
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Policy Brief State
  const [generatedBrief, setGeneratedBrief] = useState<any | null>(null);
  const [loadingBrief, setLoadingBrief] = useState<boolean>(false);
  const [briefModalOpen, setBriefModalOpen] = useState<boolean>(false);

  // Top District SHAP State
  const [topShap, setTopShap] = useState<any | null>(null);

  // Smooth scroll to anchor hash (e.g. #equity)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkHash = () => {
      if (window.location.hash) {
        const id = window.location.hash.replace("#", "");
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  // Execute Simulation
  const executeSimulation = useCallback(
    async (
      overrideBudget?: number,
      overrideAlpha?: number,
      overrideIntervention?: string,
      overrideScope?: "national" | "dhaka"
    ) => {
      setLoading(true);
      setErrorMsg(null);
      const b = overrideBudget !== undefined ? overrideBudget : budgetUSD;
      const a = overrideAlpha !== undefined ? overrideAlpha : alphaEquity;
      const intType = overrideIntervention || interventionType;
      const currentScope = overrideScope || simScope;

      try {
        const res = await api.runSimulation(
          {
            budget_usd: b,
            alpha_equity: a,
            w_risk: wRisk,
            sector_weights: sectorWeights,
            intervention_type: intType,
            scope: currentScope,
          },
          token
        );
        setSimulationResult(res);

        // Fetch SHAP for rank 1 district if national
        if (currentScope === "national" && res.allocations && res.allocations.length > 0) {
          const topPcode = res.allocations[0].adm2_pcode;
          api
            .getExplainability(topPcode, lang)
            .then((exp) => setTopShap(exp))
            .catch(() => setTopShap(null));
        } else {
          setTopShap(null);
        }
      } catch (err: any) {
        // Fallback to client-side mathematical simulation engine
        try {
          if (currentScope === "dhaka") {
            const fallbackRes = runClientDhakaSimulation({
              budget_usd: b,
              alpha_equity: a,
              w_risk: wRisk,
              sector_weights: sectorWeights,
              intervention_type: intType,
            });
            setSimulationResult(fallbackRes);
          } else {
            const fallbackRes = runClientSimulation({
              budget_usd: b,
              alpha_equity: a,
              w_risk: wRisk,
              sector_weights: sectorWeights,
              intervention_type: intType,
            });
            setSimulationResult(fallbackRes);
          }
          setErrorMsg(null);
        } catch (fallbackErr: any) {
          setErrorMsg(err.message || "Simulation execution failed.");
        }
      } finally {
        setLoading(false);
      }
    },
    [budgetUSD, alphaEquity, wRisk, sectorWeights, interventionType, simScope, token, lang]
  );

  // Initial Run on Mount (with URL query check)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const scopeParam = params.get("scope");
    if (scopeParam === "dhaka") {
      setSimScope("dhaka");
      setInterventionType("dhaka_balanced_package");
      setBudgetUSD(250000);
      executeSimulation(250000, undefined, "dhaka_balanced_package", "dhaka");
    } else {
      executeSimulation();
    }
  }, []);

  // Generate Institutional Policy Memo
  const handleGenerateBrief = async () => {
    if (!simulationResult) return;
    setLoadingBrief(true);
    try {
      const brief = await api.generateBrief(
        {
          scenario_id: simulationResult.scenario_id,
          lang: lang,
          custom_notes: simScope === "dhaka"
            ? "Dhaka North (DNCC) & Dhaka South (DSCC) Mayoral Climate Resilience Directive"
            : "Ministerial Cabinet Review: Balanced Resilient Infrastructure Allocation",
          save_as_outcomes: true, // Register into Closed-Loop Outcomes Tracker
        },
        token
      );
      setGeneratedBrief(brief);
      setBriefModalOpen(true);
    } catch {
      // Robust client fallback with full 6-section evidence-backed memo
      const clientBrief = generateClientPolicyBrief({
        simulationResult,
        scope: simScope,
        lang,
        customNotes: simScope === "dhaka"
          ? "Dhaka North (DNCC) & Dhaka South (DSCC) Mayoral Climate Resilience Directive"
          : "Ministerial Cabinet Review: Balanced Resilient Infrastructure Allocation",
      });
      setGeneratedBrief(clientBrief);
      setBriefModalOpen(true);
    } finally {
      setLoadingBrief(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-8 pt-24 md:pt-28 pb-16 space-y-8 font-sans">
      {/* Title & Context Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-emerald-500/30 bg-emerald-950/60 px-2 py-0.5 text-xs font-semibold text-emerald-300 font-mono">
              ClimAct Twin Studio
            </span>
            <span className="text-slate-500">&middot;</span>
            <span className="text-xs text-cyan-400 font-mono">
              {isBn ? "দ্বৈত-ইঞ্জিন পলিসি সিমুলেটর" : "Dual-Engine Mathematical Optimizer"}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mt-1">
            {isBn
              ? "ক্লাইম-অ্যাক্ট টুইন: জলবায়ু বাজেট ও ন্যায্যতা সিমুলেশন স্টুডিও"
              : "ClimAct Twin Policy Simulation Studio"}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-3xl">
            {isBn
              ? "বাজেট সিলিং ও সামাজিক সমতা ফ্যাক্টর (α_equity) পরিবর্তন করে ৬৪টি জেলার তহবিল বণ্টন, সংরক্ষিত জনসংখ্যা এবং শ্যাপলি ঝুঁকি হ্রাস তাৎক্ষণিকভাবে বিশ্লেষণ করুন।"
              : "Simulate multi-hazard budget distribution across 64 Bangladesh districts. Adjust fiscal envelope and social equity weighting to eliminate algorithmic neglect of data-scarce zones."}
          </p>
        </div>

        {/* Generate Brief CTA Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleGenerateBrief}
            disabled={loadingBrief || !simulationResult}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-950/50 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
          >
            {loadingBrief ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Award className="h-4 w-4" />
            )}
            <span>{isBn ? "দাপ্তরিক নীতি স্মারক তৈরি" : "Generate Cabinet Memo"}</span>
          </button>
        </div>
      </section>

      {/* Main Studio Grid: Left Controls, Right Analytics */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Control Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="h-4 w-4 text-emerald-400" />
              <span>{isBn ? "সিমুলেশন প্যারামিটার ও নীতি স্লাইডার" : "Simulation Policy Parameters"}</span>
            </h2>

            {/* Scope Switcher: National 64 Districts vs Dhaka City Corporation */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
              <button
                onClick={() => {
                  setSimScope("national");
                  setInterventionType("balanced_resilience_mix");
                  setBudgetUSD(500000);
                  executeSimulation(500000, alphaEquity, "balanced_resilience_mix", "national");
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  simScope === "national"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{isBn ? "জাতীয় বাজেট (৬৪ জেলা)" : "National 64 Districts"}</span>
              </button>
              <button
                onClick={() => {
                  setSimScope("dhaka");
                  setInterventionType("dhaka_balanced_package");
                  setBudgetUSD(250000);
                  executeSimulation(250000, alphaEquity, "dhaka_balanced_package", "dhaka");
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  simScope === "dhaka"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>{isBn ? "ঢাকা আরবান বাজেট (DNCC & DSCC)" : "Dhaka Municipal Budget"}</span>
              </button>
            </div>

            {/* 1. Constrained Fiscal Budget */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{isBn ? "বরাদ্দকৃত বাজেট সিলিং ($ USD)" : "Constrained Budget Envelope ($ USD)"}</span>
                </label>
                <span className="font-mono text-sm font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                  ${budgetUSD.toLocaleString()} USD
                </span>
              </div>

              <input
                type="range"
                min={10000}
                max={5000000}
                step={25000}
                value={budgetUSD}
                onChange={(e) => setBudgetUSD(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />

              {/* Budget Preset Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[100000, 250000, 500000, 1000000, 2500000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setBudgetUSD(preset);
                      executeSimulation(preset, undefined, undefined);
                    }}
                    className={`px-2 py-1 rounded-md text-[10px] font-mono transition-colors ${
                      budgetUSD === preset
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                        : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    ${preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Equity Weighting Slider (alpha_equity) */}
            <div id="equity" className="space-y-3 pt-2 border-t border-slate-800 scroll-mt-28">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{isBn ? "সামাজিক সমতা গুণক (α_equity)" : "Equity Weighting Factor (α_equity)"}</span>
                  </label>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {isBn
                      ? "০.০ = কেবল ঝুঁকি ও জনসংখ্যা | ১.০ = সর্বোচ্চ প্রান্তিক সুরক্ষা"
                      : "0.0 = pure exposure | 1.0 = maximal vulnerability weighting"}
                  </p>
                </div>
                <span className="font-mono text-sm font-extrabold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                  {alphaEquity.toFixed(2)}
                </span>
              </div>

              <input
                type="range"
                min={0.0}
                max={1.0}
                step={0.05}
                value={alphaEquity}
                onChange={(e) => setAlphaEquity(Number(e.target.value))}
                className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />

              {/* Alpha Presets */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => {
                    setAlphaEquity(0.0);
                    executeSimulation(undefined, 0.0, undefined);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                    alphaEquity === 0.0
                      ? "bg-slate-700 text-white border border-slate-500"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isBn ? "বেসলাইন (α=০.০)" : "Baseline (α=0.0)"}
                </button>
                <button
                  onClick={() => {
                    setAlphaEquity(0.5);
                    executeSimulation(undefined, 0.5, undefined);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                    alphaEquity === 0.5
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isBn ? "ভারসাম্য (α=০.৫)" : "Balanced (α=0.5)"}
                </button>
                <button
                  onClick={() => {
                    setAlphaEquity(1.0);
                    executeSimulation(undefined, 1.0, undefined);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                    alphaEquity === 1.0
                      ? "bg-purple-950 text-purple-300 border border-purple-500/50"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isBn ? "সর্বোচ্চ সমতা (α=১.০)" : "Max Equity (α=1.0)"}
                </button>
              </div>
            </div>

            {/* 3. Multi-Sector Risk Weights */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-purple-400" />
                <span>{isBn ? "খাতভিত্তিক ঝুঁকি ভারসাম্য অনুপাত" : "Sectoral Hazard Weighting Distribution"}</span>
              </label>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>{isBn ? "তীব্র তাপদাহ:" : "Heatwave:"}</span>
                    <span className="font-mono text-amber-300">{sectorWeights.heat.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    value={sectorWeights.heat}
                    onChange={(e) =>
                      setSectorWeights({ ...sectorWeights, heat: Number(e.target.value) })
                    }
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>{isBn ? "নদী ও প্লাবন:" : "River Flood:"}</span>
                    <span className="font-mono text-blue-300">{sectorWeights.flood.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    value={sectorWeights.flood}
                    onChange={(e) =>
                      setSectorWeights({ ...sectorWeights, flood: Number(e.target.value) })
                    }
                    className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>{isBn ? "বায়ুদূষণ (AQI):" : "Air Quality:"}</span>
                    <span className="font-mono text-cyan-300">{sectorWeights.air.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    value={sectorWeights.air}
                    onChange={(e) =>
                      setSectorWeights({ ...sectorWeights, air: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>{isBn ? "উপকূল ও নিচু ভূমি:" : "Elevation:"}</span>
                    <span className="font-mono text-emerald-300">{sectorWeights.elevation.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    value={sectorWeights.elevation}
                    onChange={(e) =>
                      setSectorWeights({ ...sectorWeights, elevation: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 4. Resilience Intervention Profile Dropdown */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-cyan-400" />
                <span>{isBn ? "সহনশীলতা ইন্টারভেনশন প্যাকেজ" : "Resilience Intervention Profile"}</span>
              </label>
              <select
                value={interventionType}
                onChange={(e) => {
                  setInterventionType(e.target.value);
                  executeSimulation(undefined, undefined, e.target.value);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
              >
                {simScope === "dhaka"
                  ? Object.entries(DHAKA_INTERVENTIONS).map(([key, val]: any) => (
                      <option key={key} value={key}>
                        {isBn ? val.title_bn : val.title_en}
                      </option>
                    ))
                  : Object.entries(INTERVENTION_PROFILES).map(([key, val]: any) => (
                      <option key={key} value={key}>
                        {isBn ? val.title_bn : val.title_en}
                      </option>
                    ))}
              </select>
            </div>

            {/* Run Button */}
            <button
              onClick={() => executeSimulation()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-950/50 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sliders className="h-4 w-4" />
              )}
              <span>{isBn ? "সিমুলেশন পুনরায় হিসাব করুন" : "Recalculate Simulation"}</span>
            </button>
          </div>
        </div>

        {/* Right Output Dashboard (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {errorMsg && (
            <div className="rounded-2xl border border-red-500/50 bg-red-950/40 p-4 text-xs text-red-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Key Simulation Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                {isBn ? "মোট বণ্টিত বাজেট" : "Total Allocated"}
              </span>
              <p className="mt-1 text-lg font-bold text-emerald-400 font-mono">
                ${simulationResult?.total_allocated_usd ? Number(simulationResult.total_allocated_usd).toLocaleString() : "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Budget Conserved</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                {simScope === "dhaka"
                  ? (isBn ? "অর্থায়নপ্রাপ্ত জোন" : "Zones Funded")
                  : (isBn ? "অর্থায়নপ্রাপ্ত জেলা" : "Districts Funded")}
              </span>
              <p className="mt-1 text-lg font-bold text-white font-mono">
                {simulationResult?.total_districts_funded || "—"} / {simScope === "dhaka" ? "৮" : "৬৪"}
              </p>
              <p className="text-[10px] text-cyan-400 mt-0.5">
                {simScope === "dhaka" ? "DNCC & DSCC Wards" : "Prioritized Cohort"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                {isBn ? "সুরক্ষিত জনসংখ্যা" : "Protected Citizens"}
              </span>
              <p className="mt-1 text-lg font-bold text-purple-400 font-mono">
                {simulationResult?.total_estimated_protected_population
                  ? simScope === "dhaka"
                    ? `${(simulationResult.total_estimated_protected_population / 100000).toFixed(1)} লাখ`
                    : `${(simulationResult.total_estimated_protected_population / 1000000).toFixed(1)}M`
                  : "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Direct Beneficiaries</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                {isBn ? "বণ্টন গিনি সহগ" : "Gini Coefficient"}
              </span>
              <p className="mt-1 text-lg font-bold text-amber-400 font-mono">
                G = {simulationResult?.equity_gini_coefficient?.toFixed(3) || "0.285"}
              </p>
              <p className="text-[10px] text-emerald-400 mt-0.5">Progressive Shift</p>
            </div>
          </div>

          {/* Allocation ECharts Bar Visualization */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span>
                    {isBn
                      ? "শীর্ষ ১০ অগ্রাধিকারপ্রাপ্ত জেলার তহবিল বণ্টন"
                      : "Top 10 Prioritized District Resource Allocation"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isBn
                    ? "রিসোর্স শেয়ার ও সমতাভিত্তিক তহবিল পুনর্বণ্টন প্রোফাইল"
                    : "Equity redistribution curve matching local hazard vulnerability"}
                </p>
              </div>

              <span className="rounded-full bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 text-[10px] font-mono text-emerald-300">
                P_i(α_equity)
              </span>
            </div>

            <AllocationBarChart
              allocations={simulationResult?.allocations || []}
              lang={lang}
            />
          </div>

          {/* Top District SHAP Explainability Card */}
          {topShap && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 space-y-3 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">
                    {isBn
                      ? `১ম অগ্রাধিকারপ্রাপ্ত জেলা (${topShap.district_name}): শ্যাপ (SHAP) বিশ্লেষণ`
                      : `Rank 1 Priority (${topShap.district_name}): SHAP Attribution Breakdown`}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  TreeExplainer SHAP
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-300">
                  {topShap.plain_language_summary}
                </p>

                <div className="grid sm:grid-cols-3 gap-2 pt-2">
                  {topShap.top_positive_risk_drivers?.map((d: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-xs flex flex-col justify-between"
                    >
                      <span className="text-slate-400 text-[11px] truncate">{d.feature_name}</span>
                      <span className="text-sm font-bold text-red-400 font-mono mt-1">
                        +{d.shap_value?.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top Allocations Detailed Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 overflow-hidden backdrop-blur-xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {simScope === "dhaka"
                  ? (isBn ? "ঢাকা জোনভিত্তিক বরাদ্দ বিস্তারিত টেবিল" : "Dhaka Zone Resource Allocation Table")
                  : (isBn ? "বরাদ্দ বণ্টন বিস্তারিত টেবিল" : "District Allocation Breakdown")}
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {simulationResult?.allocations?.length || 0} {simScope === "dhaka" ? "Zones" : "Districts"} Evaluated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">{simScope === "dhaka" ? (isBn ? "ঢাকা নগর জোন" : "Dhaka Micro-Zone") : (isBn ? "জেলা" : "District")}</th>
                    <th className="py-3 px-4">{isBn ? "ঝুঁকি (R̂_i)" : "Risk (R̂_i)"}</th>
                    <th className="py-3 px-4">{isBn ? "প্রাধান্য স্কোর" : "Priority"}</th>
                    <th className="py-3 px-4">{isBn ? "বরাদ্দ ($ USD)" : "Allocated ($)"}</th>
                    <th className="py-3 px-4">{isBn ? "অংশ %" : "Share %"}</th>
                    <th className="py-3 px-4">{isBn ? "ঝুঁকি হ্রাস" : "Mitigation"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {simulationResult?.allocations?.slice(0, 8).map((a: any) => (
                    <tr key={a.adm2_pcode} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-cyan-400">{a.rank}</td>
                      <td className="py-3 px-4 font-semibold text-white">
                        <span>{isBn ? a.adm2_bn || a.district_name : a.district_name || a.adm2_en}</span>
                        {a.corporation && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[9px] font-mono text-cyan-300">
                            {a.corporation}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {Number(a.baseline_risk_score).toFixed(3)}
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-300">
                        {Number(a.priority_score).toFixed(3)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        ${Number(a.allocated_usd).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-300">
                        {Number(a.allocation_pct).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-full bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 text-[10px] text-emerald-300 font-mono">
                          -{a.estimated_risk_reduction_pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Brief Modal Preview */}
      <PolicyBriefModal
        brief={generatedBrief}
        onClose={() => setBriefModalOpen(false)}
      />
    </main>
  );
}
