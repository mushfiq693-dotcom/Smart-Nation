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
  const name = isBn ? district.adm2_bn || district.adm2_en : district.adm2_en;
  const isSensorScarce = district.air_station_count === 0;

  return (
    <div className="w-full rounded-3xl border border-white/15 bg-slate-950/80 backdrop-blur-2xl shadow-2xl flex flex-col justify-between overflow-hidden max-h-[700px] overflow-y-auto">
      {/* Dossier Header */}
      <div>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{name}</h3>
                <span className="font-mono text-xs text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  {district.adm2_pcode}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isBn ? "প্রশাসনিক জেলা বিশ্লেষণ ডসিয়ার" : "Administrative District Dossier"}
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
          {/* Sensor Scarcity Alert Card */}
          {isSensorScarce ? (
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
                <span>{isBn ? "জনসংখ্যা (২০২২)" : "Population (2022)"}</span>
              </div>
              <p className="mt-1 text-base font-bold text-white font-mono">
                {district.population_2022 ? district.population_2022.toLocaleString() : "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {district.pop_density_per_sqkm
                  ? `${Math.round(district.pop_density_per_sqkm)}/km²`
                  : district.area_sqkm
                  ? `${district.area_sqkm} km²`
                  : ""}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                <span>{isBn ? "তাপদাহ অসঙ্গতি" : "Heat Anomaly"}</span>
              </div>
              <p className="mt-1 text-base font-bold text-amber-300 font-mono">
                +{district.apparent_temp_anomaly_c ? Number(district.apparent_temp_anomaly_c).toFixed(2) : "0.00"}°C
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">ERA5 Reanalysis</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Waves className="h-3.5 w-3.5 text-blue-400" />
                <span>{isBn ? "নদী প্রবাহ পিক" : "River Discharge"}</span>
              </div>
              <p className="mt-1 text-base font-bold text-blue-300 font-mono">
                {district.mean_river_discharge_m3s
                  ? `${Number(district.mean_river_discharge_m3s).toFixed(1)} m³/s`
                  : "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">GloFAS v4 Monsoon</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Mountain className="h-3.5 w-3.5 text-emerald-400" />
                <span>{isBn ? "গড় উচ্চতা" : "Mean Elevation"}</span>
              </div>
              <p className="mt-1 text-base font-bold text-emerald-300 font-mono">
                {district.elevation_mean_m ? `${Number(district.elevation_mean_m).toFixed(1)} m` : "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Copernicus GLO-30</p>
            </div>
          </div>

          {/* SHAP Explainability Card */}
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
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t border-slate-800 bg-slate-900/90 p-4 space-y-2 backdrop-blur-md">
        <Link
          href={`/simulator?focus=${district.adm2_pcode}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 hover:from-emerald-400 hover:to-teal-500 transition-all"
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>{isBn ? "এই জেলার জন্য সিমুলেশন চালান" : "Simulate Budget For This District"}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <Link
          href={`/copilot?pcode=${district.adm2_pcode}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
        >
          <Bot className="h-3.5 w-3.5 text-cyan-400" />
          <span>{isBn ? "কোপাইলটকে জেলা বিষয়ে প্রশ্ন করুন" : "Ask AI Copilot About This District"}</span>
        </Link>
      </div>
    </div>
  );
}
