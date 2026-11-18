"use client";

import React from "react";
import {
  Activity,
  Thermometer,
  Waves,
  Mountain,
  AlertTriangle,
  Moon,
  Satellite,
  Map,
  Eye,
  Layers,
  Sparkles,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { MetricType, BasemapType } from "./MapCanvas";

interface MapControlPanelProps {
  activeMetric: MetricType;
  setActiveMetric: (metric: MetricType) => void;
  activeLayer: "adm2" | "h3";
  setActiveLayer: (layer: "adm2" | "h3") => void;
  basemap: BasemapType;
  setBasemap: (basemap: BasemapType) => void;
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;
}

export function MapControlPanel({
  activeMetric,
  setActiveMetric,
  activeLayer,
  setActiveLayer,
  basemap,
  setBasemap,
  showLabels,
  setShowLabels,
}: MapControlPanelProps) {
  const { lang } = useI18n();
  const isBn = lang === "bn";

  const metricDetails: {
    id: MetricType;
    label: string;
    sublabel: string;
    description: string;
    effectText: string;
    icon: any;
    colorClass: string;
    badgeColor: string;
  }[] = [
    {
      id: "composite_risk",
      label: isBn ? "সম্মিলিত ঝুঁকি (R̂_i)" : "Composite Risk (R̂_i)",
      sublabel: isBn ? "XGBoost + ৯টি ফিচার ভেক্টর" : "XGBoost Multi-Sector Model",
      description: isBn
        ? "তাপপ্রবাহ, বন্যা, নিচু ভূমি, দারিদ্র্য ও জনসংখ্যার সার্বিক ঝুঁকির সমন্বিত স্কোর।"
        : "Weighted multi-hazard vulnerability index normalized strictly across [0.0, 1.0].",
      effectText: isBn
        ? "ম্যাপের রঙ সবুজ (নিম্ন ঝুঁকি) থেকে গাঢ় লাল/বেগুনি (চরম ঝুঁকি) হিসেবে প্রতিফলিত হয়।"
        : "Recolors polygons from low (green) to extreme multi-hazard vulnerability (deep red).",
      icon: Activity,
      colorClass: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    },
    {
      id: "heat_anomaly",
      label: isBn ? "তীব্র তাপদাহ (°C)" : "Heatwave Anomaly (°C)",
      sublabel: isBn ? "Open-Meteo ERA5 Reanalysis" : "ERA5 Land Surface Temp",
      description: isBn
        ? "সারফেস তাপমাত্রা অ্যানোমালি ও তীব্র তাপদাহের প্রভাবে ক্ষতিগ্রস্ত এলাকা।"
        : "Surface thermal anomaly highlighting extreme heatwaves and urban heat island risks.",
      effectText: isBn
        ? "উচ্চ তাপমাত্রার হটস্পটগুলো কমলা থেকে উজ্জ্বল বেগুনি রঙে পরিবর্তিত হয়।"
        : "Highlights thermal hotspots in vivid amber-to-purple thermal gradient.",
      icon: Thermometer,
      colorClass: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    },
    {
      id: "flood_discharge",
      label: isBn ? "নদী প্রবাহ ও প্লাবন" : "River Discharge Peak",
      sublabel: isBn ? "Open-Meteo GloFAS v4" : "GloFAS 75th Percentile Flow",
      description: isBn
        ? "মনসুন নদীপ্রবাহের পিক ডিসচার্জ এবং আকস্মিক প্লাবনঝুঁকি।"
        : "Monsoon river discharge percentiles and upstream drainage volume thresholds.",
      effectText: isBn
        ? "নদীর অববাহিকা ও চর এলাকাগুলোকে গাঢ় নীল রঙে হাইলাইট করে।"
        : "Emphasizes flood basins and riparian corridors in deep cyan-to-indigo tones.",
      icon: Waves,
      colorClass: "from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
    },
    {
      id: "elevation",
      label: isBn ? "নিচু ভূমি উচ্চতা" : "Coastal Lowland (<5m)",
      sublabel: isBn ? "Copernicus DEM (30m)" : "GLO-30 Satellite Elevation",
      description: isBn
        ? "সমুদ্রপৃষ্ঠের ৫ মিটারের নিচের নিচু উপকূল ও প্লাবন সমভূমি এলাকা।"
        : "Digital elevation model isolating low-lying floodplains and coastal surge vulnerability.",
      effectText: isBn
        ? "উপকূলীয় ও প্লাবনভূমি জেলাগুলো সোনালী-বাদামী টোপোগ্রাফিতে ফুটে ওঠে।"
        : "Distinguishes low-lying delta areas (<5m) from elevated highlands.",
      icon: Mountain,
      colorClass: "from-emerald-600/20 to-amber-600/20 text-emerald-200 border-emerald-500/40",
      badgeColor: "bg-teal-500/20 text-teal-300 border-teal-400/30",
    },
    {
      id: "sensor_scarcity",
      label: isBn ? "সেন্সর তথ্য ঘাটতি (V_i)" : "Sensor Scarcity Audit",
      sublabel: isBn ? "OpenAQ v3 Platform" : "OpenAQ Ground Station Gap",
      description: isBn
        ? "বায়ুর মান পর্যবেক্ষণের সেন্সরবিহীন ৫২টি জেলা (ন্যায্য বরাদ্দের পেনাল্টি সক্রিয়)।"
        : "52 unmonitored districts flagged for algorithmic equity correction (α_equity).",
      effectText: isBn
        ? "সেন্সরবিহীন জেলাগুলো সতর্কতা হলুদ এবং সক্রিয়গুলো স্লেট ধূসর রঙে বিভক্ত হয়।"
        : "Splits map into monitored stations (slate) vs. scarce districts (warning amber).",
      icon: AlertTriangle,
      colorClass: "from-amber-600/20 to-red-600/20 text-amber-200 border-amber-500/40",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    },
  ];

  return (
    <div className="w-full rounded-3xl border border-white/15 bg-slate-950/85 backdrop-blur-2xl shadow-2xl p-5 sm:p-6 space-y-6 max-h-[700px] overflow-y-auto">
      {/* Panel Header */}
      <div className="border-b border-slate-800 pb-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
            <SlidersHorizontal className="h-3 w-3 text-emerald-400" />
            <span>{isBn ? "ম্যাপ অ্যানালিটিক্স প্যানেল" : "Map Analytics & Layers"}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Dual-Engine AI</span>
        </div>

        <h3 className="text-base font-bold text-white tracking-tight">
          {isBn ? "লেয়ার নিয়ন্ত্রণ ও প্রভাব নির্দেশিকা" : "Layer Controls & Impact Guide"}
        </h3>

        {/* Short Explainer Message requested by user */}
        <div className="flex items-start gap-2 rounded-2xl bg-emerald-950/30 border border-emerald-500/25 p-3 text-[11px] text-slate-300 leading-relaxed">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            {isBn ? (
              <>
                <strong className="text-emerald-300 font-semibold">ম্যাপে এর প্রভাব:</strong> এখানে যে মেট্রিকটি নির্বাচন করবেন, ম্যাপের ৬৪ জেলা ও হেক্সাগন সেই ডেটার উপর ভিত্তি করে তাৎক্ষণিকভাবে রঙ এবং ঝুঁকি-স্কেল আপডেট করবে।
              </>
            ) : (
              <>
                <strong className="text-emerald-300 font-semibold">Visual Effect on Map:</strong> Selecting any metric below dynamically updates the choropleth color scale and H3 hexagons using real validated evidence.
              </>
            )}
          </p>
        </div>
      </div>

      {/* 1. METRIC SELECTOR CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>{isBn ? "১. জলবায়ু ঝুঁকি মেট্রিক নির্বাচন করুন" : "1. Select Hazard Indicator"}</span>
          <span className="text-[10px] text-slate-500 font-normal">
            {isBn ? "একটি নির্বাচন করুন" : "Single Choice"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {metricDetails.map((metric) => {
            const Icon = metric.icon;
            const isSelected = activeMetric === metric.id;
            return (
              <button
                key={metric.id}
                onClick={() => setActiveMetric(metric.id)}
                className={`w-full text-left rounded-2xl p-3 border transition-all duration-200 relative overflow-hidden ${
                  isSelected
                    ? `bg-gradient-to-r ${metric.colorClass} shadow-lg shadow-black/40 scale-[1.01]`
                    : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-white/15 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h4
                        className={`text-xs font-bold leading-tight ${
                          isSelected ? "text-white" : "text-slate-200"
                        }`}
                      >
                        {metric.label}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {metric.sublabel}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${metric.badgeColor}`}
                    >
                      {isBn ? "সক্রিয়" : "Active"}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 mt-2 leading-snug">
                  {metric.description}
                </p>

                {/* Sub-label showing the exact UI effect on map */}
                <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-emerald-400/90 font-medium">
                  <Info className="h-3 w-3 shrink-0" />
                  <span>{metric.effectText}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. BASEMAP SWITCHER */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>{isBn ? "২. বেসম্যাপ স্টাইল (Basemap)" : "2. Basemap Style"}</span>
          <span className="text-[10px] text-slate-500 font-mono">Retina @2x</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setBasemap("dark")}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
              basemap === "dark"
                ? "bg-slate-800 border-emerald-500/50 text-emerald-300 font-bold shadow-md"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Moon className="h-4 w-4 text-emerald-400" />
            <span className="text-xs">{isBn ? "ডার্ক" : "Dark"}</span>
            <span className="text-[9px] text-slate-500">{isBn ? "ডেটা স্পষ্ট" : "Dataviz"}</span>
          </button>

          <button
            onClick={() => setBasemap("satellite")}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
              basemap === "satellite"
                ? "bg-slate-800 border-cyan-500/50 text-cyan-300 font-bold shadow-md"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Satellite className="h-4 w-4 text-cyan-400" />
            <span className="text-xs">{isBn ? "স্যাটেলাইট" : "Satellite"}</span>
            <span className="text-[9px] text-slate-500">{isBn ? "বাস্তব ছবি" : "ESRI Hybrid"}</span>
          </button>

          <button
            onClick={() => setBasemap("streets")}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
              basemap === "streets"
                ? "bg-slate-800 border-amber-500/50 text-amber-300 font-bold shadow-md"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Map className="h-4 w-4 text-amber-400" />
            <span className="text-xs">{isBn ? "টোপো" : "Terrain"}</span>
            <span className="text-[9px] text-slate-500">{isBn ? "সড়ক ও নদী" : "Topography"}</span>
          </button>
        </div>
      </div>

      {/* 3. GRANULARITY & LABELS */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>{isBn ? "৩. রেজোলিউশন ও লেবেল" : "3. Granularity & Labels"}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* ADM2 vs H3 Hex */}
          <div className="flex rounded-xl border border-slate-800 bg-slate-900/80 p-1 text-xs">
            <button
              onClick={() => setActiveLayer("adm2")}
              className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition-all ${
                activeLayer === "adm2"
                  ? "bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ADM2 (64)
            </button>
            <button
              onClick={() => setActiveLayer("h3")}
              className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition-all ${
                activeLayer === "h3"
                  ? "bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              H3 Hex (448)
            </button>
          </div>

          {/* District Labels Toggle */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border py-1.5 px-3 text-xs font-semibold transition-all ${
              showLabels
                ? "border-emerald-500/40 bg-emerald-950/60 text-emerald-300 shadow-sm"
                : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="h-3.5 w-3.5 text-emerald-400" />
            <span>{isBn ? "জেলার নাম" : "District Labels"}</span>
          </button>
        </div>
      </div>

      {/* Helpful Guidance Footer */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-3 text-[11px] text-slate-400 flex items-start gap-2">
        <span className="text-cyan-400 font-bold">💡</span>
        <p>
          {isBn
            ? "ম্যাপের যেকোনো জেলার উপর ক্লিক করুন—স্থানীয় শ্যাপ (SHAP) ফ্যাক্টর ও বিস্তারিত ডসিয়ার এই প্যানেলে দেখতে পাবেন।"
            : "Click any district on the map to inspect its local SHAP attribution drivers and socioeconomic dossier."}
        </p>
      </div>
    </div>
  );
}
