"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Shield,
  AlertTriangle,
  Thermometer,
  Waves,
  Mountain,
  Users,
  Activity,
  ArrowRight,
  Bot,
  Sliders,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { api } from "../../lib/api";

interface DistrictDossierProps {
  district: any | null;
  onClose?: () => void;
}

// In-memory cache to prevent redundant network fetches
const shapCache = new Map<string, any>();

export function DistrictDossier({ district, onClose }: DistrictDossierProps) {
  const { lang, t } = useI18n();
  const [shapData, setShapData] = useState<any | null>(null);
  const [loadingShap, setLoadingShap] = useState(false);

  const pcode = district?.adm2_pcode;

  useEffect(() => {
    if (!pcode) return;

    const cacheKey = `${pcode}_${lang}`;
    if (shapCache.has(cacheKey)) {
      setShapData(shapCache.get(cacheKey));
      setLoadingShap(false);
      return;
    }

    let isMounted = true;
    setLoadingShap(true);
    api
      .getExplainability(pcode, lang)
      .then((data) => {
        shapCache.set(cacheKey, data);
        if (isMounted) {
          setShapData(data);
          setLoadingShap(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setShapData(null);
          setLoadingShap(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [pcode, lang]);

  if (!district) return null;

  const isBn = lang === "bn";
  const isDhakaZone = Boolean(district.zone_id);
  const name = isDhakaZone
    ? (isBn ? district.name_bn || district.name_en : district.name_en)
    : (isBn ? district.adm2_bn || district.adm2_en : district.adm2_en);
  const code = isDhakaZone
    ? `${district.zone_id} (${district.corporation})`
    : district.adm2_pcode;
  const isSensorScarce = isDhakaZone ? false : district.air_station_count === 0;

  return (
    <div className="w-full rounded-3xl border border-white/15 bg-slate-950/80 backdrop-blur-2xl shadow-2xl flex flex-col justify-between overflow-hidden max-h-[700px] overflow-y-auto">
      {/* Dossier Header */}
      <div>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${isDhakaZone ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}`}>
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{name}</h3>
                <span className="font-mono text-xs text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  {code}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isDhakaZone
                  ? (isBn ? "ঢাকা মেগাসিটি আরবান ক্লাইমেট ডসিয়ার" : "Dhaka Megacity Urban Climate Dossier")
                  : (isBn ? "প্রশাসনিক জেলা বিশ্লেষণ ডসিয়ার" : "Administrative District Dossier")}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dossier Content Body */}
        <div className="p-6 space-y-6">
          {/* Status Alert Card */}
          {isDhakaZone ? (
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/30 p-3.5 text-xs text-cyan-200 flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-cyan-300">
                  {isBn ? `${district.corporation} আরবান ক্লাইমেট রেজিলিয়েন্স জোন` : `${district.corporation} Urban Resilience Priority Zone`}
                </p>
                <p className="text-[11px] text-cyan-200/80 mt-0.5 leading-relaxed">
                  {isBn
                    ? `প্রস্তাবিত পদক্ষেপ: ${district.recommended_intervention || "সমন্বিত নগর জলবায়ু সহনশীলতা প্যাকেজ"}`
                    : `Recommended: ${district.recommended_intervention || "Urban Climate Resilience Package"}`}
                </p>
              </div>
            </div>
          ) : isSensorScarce ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3.5 text-xs text-amber-200 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">
                  {isBn ? "সেন্সর তথ্য ঘাটতি সতর্কতা (V_i = ১.০)" : "Ground Sensor Scarcity Flag (V_i = 1.0)"}
                </p>
                <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                  {isBn
                    ? "এই জেলায় কোনো সক্রিয় সরকারি বায়ুমান পর্যবেক্ষণ কেন্দ্র নেই। ক্লাইম-অ্যাক্ট টুইন ন্যায্যতা মডেলে এটিকে অগ্রাধিকার সুবিধা দেওয়া হয়েছে।"
                    : "No active regulatory ground air quality monitoring stations. The equity optimizer applies a scarcity penalty to prevent data invisibility."}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 text-xs text-emerald-200 flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-300">
                  {isBn ? "সক্রিয় পর্যবেক্ষণ কেন্দ্র বিদ্যমান" : "Active Regulatory Air Stations"}
                </p>
                <p className="text-[11px] text-emerald-200/80 mt-0.5">
                  {isBn
                    ? `${district.air_station_count}টি ওপেনএকিউ (OpenAQ v3) স্টেশন সক্রিয় রয়েছে।`
                    : `${district.air_station_count} OpenAQ v3 ground sensor stations active.`}
                </p>
              </div>
            </div>
          )}

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Users className="h-3.5 w-3.5 text-cyan-400" />
                <span>{isBn ? "জনসংখ্যা" : "Population"}</span>
              </div>
              <p className="mt-1 text-base font-bold text-white font-mono">
                {district.population
                  ? Number(district.population).toLocaleString()
                  : district.population_2022
                  ? Number(district.population_2022).toLocaleString()
                  : "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {isDhakaZone
                  ? (isBn ? "বিবিএস আদমশুমারি ২০২২" : "BBS Census 2022")
                  : district.pop_density_per_sqkm
                  ? `${Math.round(district.pop_density_per_sqkm)}/km²`
                  : district.area_sqkm
                  ? `${district.area_sqkm} km²`
                  : ""}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                <span>{isDhakaZone ? (isBn ? "নগর তাপদ্বীপ (UHI)" : "Heat Island (UHI)") : (isBn ? "তাপদাহ অসঙ্গতি" : "Heat Anomaly")}</span>
              </div>
              <p className="mt-1 text-base font-bold text-amber-300 font-mono">
                +{isDhakaZone
                  ? `${Number(district.uhi_anomaly_c || 3.2).toFixed(1)}°C`
                  : district.apparent_temp_anomaly_c
                  ? Number(district.apparent_temp_anomaly_c).toFixed(2) + "°C"
                  : "0.00°C"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {isDhakaZone ? (isBn ? "স্যাটেলাইট থার্মাল অ্যানোমালি" : "Satellite Thermal Band") : "ERA5 Reanalysis"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Waves className="h-3.5 w-3.5 text-blue-400" />
                <span>{isDhakaZone ? (isBn ? "জলাবদ্ধতা ঝুঁকি" : "Waterlogging Risk") : (isBn ? "নদী প্রবাহ পিক" : "River Discharge")}</span>
              </div>
              <p className="mt-1 text-base font-bold text-blue-300 font-mono">
                {isDhakaZone
                  ? `${district.waterlogging_risk_pct}%`
                  : district.mean_river_discharge_m3s
                  ? `${Number(district.mean_river_discharge_m3s).toFixed(1)} m³/s`
                  : "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {isDhakaZone ? (isBn ? "খাল ড্রেনেজ বেসিন" : "Canal Catchment") : "GloFAS v4 Monsoon"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Mountain className="h-3.5 w-3.5 text-emerald-400" />
                <span>{isDhakaZone ? (isBn ? "বায়ুমান (PM2.5)" : "AQI (PM2.5)") : (isBn ? "গড় উচ্চতা" : "Mean Elevation")}</span>
              </div>
              <p className="mt-1 text-base font-bold text-emerald-300 font-mono">
                {isDhakaZone
                  ? `${district.pm25_exposure_ug_m3} µg/m³`
                  : district.elevation_mean_m
                  ? `${Number(district.elevation_mean_m).toFixed(1)} m`
                  : "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {isDhakaZone ? "OpenAQ Ground Mesh" : "Copernicus GLO-30"}
              </p>
            </div>
          </div>

          {/* Key Hazards or SHAP Card */}
          {isDhakaZone ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-slate-200">
                    {isBn ? "প্রধান পরিবেশগত ঝুঁকি ও দুর্বলতা" : "Key Environmental Vulnerabilities"}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-500/30 px-1.5 py-0.5 rounded">
                  V_i = {district.v_i}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(district.key_hazards) ? district.key_hazards : String(district.key_hazards || "").split(", ")).map((h: string, idx: number) => (
                  <span key={idx} className="rounded-lg bg-red-950/40 border border-red-500/30 px-2.5 py-1 text-xs text-red-300 font-medium">
                    ⚠️ {h}
                  </span>
                ))}
              </div>
              <div className="rounded-lg bg-slate-950/80 p-2.5 border border-slate-800 text-[11px] text-slate-300 italic leading-relaxed">
                {isBn
                  ? `দারিদ্র্যের হার ${district.poverty_headcount_pct}% এবং কংক্রিট আচ্ছাদিত পাকা পৃষ্ঠ ${Math.round((district.built_up_ratio || 0.8) * 100)}%।`
                  : `Poverty headcount ${district.poverty_headcount_pct}% with ${Math.round((district.built_up_ratio || 0.8) * 100)}% impervious concrete surface.`}
              </div>
            </div>
          ) : (
            /* Standard District SHAP Attribution Card */
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-slate-200">
                    {isBn ? "শ্যাপ (TreeExplainer SHAP) ঝুঁকি প্রভাবক" : "SHAP Hazard Attribution Breakdown"}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-500/30 px-1.5 py-0.5 rounded">
                  Exact Additive
                </span>
              </div>

              {loadingShap ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  Computing local Shapley values...
                </p>
              ) : shapData ? (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">
                      {isBn ? "অনুমানকৃত ঝুঁকি স্কোর (R̂_i):" : "Predicted Hazard Risk (R̂_i):"}
                    </span>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {shapData.predicted_hazard_risk_r_hat?.toFixed(4)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-300">
                      {isBn ? "শীর্ষ ঝুঁকি বৃদ্ধিকারী প্রভাবকসমূহ (+ϕ):" : "Top Positive Risk Drivers (+ϕ):"}
                    </p>
                    {shapData.top_positive_risk_drivers?.map((d: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-slate-300 truncate max-w-[200px]">{d.feature_name}</span>
                        <span className="font-mono text-red-400 font-semibold shrink-0">
                          +{d.shap_value?.toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg bg-slate-950/80 p-2.5 border border-slate-800 text-[11px] text-slate-300 italic leading-relaxed">
                    "{shapData.plain_language_summary}"
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-2">
                  SHAP drivers available for this district.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t border-slate-800 bg-slate-900/90 p-4 space-y-2 backdrop-blur-md">
        <Link
          href={isDhakaZone ? `/simulator?scope=dhaka&zone=${district.zone_id}` : `/simulator?focus=${district.adm2_pcode}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 hover:from-emerald-400 hover:to-teal-500 transition-all"
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>{isDhakaZone ? (isBn ? "ঢাকা সিটি কর্পোরেশন বাজেটে সিমুলেশন করুন" : "Simulate Dhaka Municipal Budget") : (isBn ? "এই জেলার জন্য সিমুলেশন চালান" : "Simulate Budget For This District")}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <Link
          href={isDhakaZone ? `/copilot?query=${encodeURIComponent(district.name_en + " climate vulnerabilities and heat island")}` : `/copilot?pcode=${district.adm2_pcode}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
        >
          <Bot className="h-3.5 w-3.5 text-cyan-400" />
          <span>{isBn ? "কোপাইলটকে এই এলাকা বিষয়ে প্রশ্ন করুন" : "Ask AI Copilot About This Area"}</span>
        </Link>
      </div>
    </div>
  );
}
