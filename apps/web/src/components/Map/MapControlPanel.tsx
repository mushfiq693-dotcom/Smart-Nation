"use client";

import React from "react";
import {
  Activity,
  Thermometer,
  Waves,
  Mountain,
  AlertTriangle,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { MetricType } from "./MapCanvas";

interface MapControlPanelProps {
  activeMetric: MetricType;
  setActiveMetric: (metric: MetricType) => void;
}

export function MapControlPanel({
  activeMetric,
  setActiveMetric,
}: MapControlPanelProps) {
  const { lang } = useI18n();
  const isBn = lang === "bn";

  const metricDetails: {
    id: MetricType;
    label: string;
    description: string;
    icon: any;
    colorClass: string;
    badgeColor: string;
  }[] = [
    {
      id: "composite_risk",
      label: isBn ? "সম্মিলিত ঝুঁকি (R̂_i)" : "Composite Risk (R̂_i)",
      description: isBn
        ? "তাপপ্রবাহ, বন্যা, নিচু ভূমি, দারিদ্র্য ও জনসংখ্যার সার্বিক ঝুঁকির সমন্বিত স্কোর।"
        : "Weighted multi-hazard vulnerability index normalized strictly across [0.0, 1.0].",
      icon: Activity,
      colorClass: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    },
    {
      id: "heat_anomaly",
      label: isBn ? "তীব্র তাপদাহ (°C)" : "Heatwave Anomaly (°C)",
      description: isBn
        ? "সারফেস তাপমাত্রা অ্যানোমালি ও চরম তাপদাহের প্রভাবে ঝুঁকিপূর্ণ এলাকা।"
        : "Surface thermal anomaly highlighting extreme heatwaves and urban heat island risks.",
      icon: Thermometer,
      colorClass: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    },
    {
      id: "flood_discharge",
      label: isBn ? "নদী প্রবাহ ও প্লাবন" : "River Discharge Peak",
      description: isBn
        ? "মনসুন নদীপ্রবাহের পিক ডিসচার্জ এবং আকস্মিক প্লাবনঝুঁকি এলাকা।"
        : "Monsoon river discharge percentiles and upstream drainage volume thresholds.",
      icon: Waves,
      colorClass: "from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
    },
    {
      id: "elevation",
      label: isBn ? "নিচু ভূমি উচ্চতা" : "Coastal Lowland (<5m)",
      description: isBn
        ? "সমুদ্রপৃষ্ঠ থেকে ৫ মিটারের নিচের নিচু উপকূল ও প্লাবন সমভূমি।"
        : "Digital elevation model isolating low-lying floodplains and coastal surge vulnerability.",
      icon: Mountain,
      colorClass: "from-emerald-600/20 to-amber-600/20 text-emerald-200 border-emerald-500/40",
      badgeColor: "bg-teal-500/20 text-teal-300 border-teal-400/30",
    },
    {
      id: "sensor_scarcity",
      label: isBn ? "সেন্সর তথ্য ঘাটতি (V_i)" : "Sensor Scarcity Audit",
      description: isBn
        ? "বায়ুর মান পর্যবেক্ষণ কেন্দ্রের অনুপস্থিত ৫২টি জেলা (পেনাল্টি সক্রিয়)।"
        : "52 unmonitored districts flagged for algorithmic equity correction (α_equity).",
      icon: AlertTriangle,
      colorClass: "from-amber-600/20 to-red-600/20 text-amber-200 border-amber-500/40",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    },
  ];

  return (
    <div className="w-full h-[580px] lg:h-[650px] rounded-3xl border border-white/15 bg-slate-950/85 backdrop-blur-2xl shadow-2xl p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden">
      {/* Panel Header */}
      <div className="border-b border-slate-800/80 pb-2">
        <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
          {isBn ? "জলবায়ু ঝুঁকি মেট্রিক নির্বাচন করুন" : "Select Climate Hazard Metric"}
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
          {isBn
            ? "ম্যাপে যে ঝুঁকির স্তরটি দেখতে চান তা নির্বাচন করুন"
            : "Choose an indicator layer to update the spatial risk heatmap"}
        </p>
      </div>

      {/* 5 Metric Selection Cards - Scaled & Balanced for Perfect Height */}
      <div className="flex-1 flex flex-col justify-between py-1.5 gap-1.5 sm:gap-2">
        {metricDetails.map((metric) => {
          const Icon = metric.icon;
          const isSelected = activeMetric === metric.id;
          return (
            <button
              key={metric.id}
              onClick={() => setActiveMetric(metric.id)}
              className={`w-full text-left rounded-xl sm:rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 border transition-all duration-150 flex flex-col justify-center flex-1 ${
                isSelected
                  ? `bg-gradient-to-r ${metric.colorClass} shadow-md shadow-black/40 border-emerald-500/50`
                  : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isSelected
                        ? "bg-white/15 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                  <h4
                    className={`text-xs sm:text-[13.5px] font-bold leading-tight ${
                      isSelected ? "text-white" : "text-slate-200"
                    }`}
                  >
                    {metric.label}
                  </h4>
                </div>

                {isSelected && (
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${metric.badgeColor}`}
                  >
                    {isBn ? "সক্রিয়" : "Active"}
                  </span>
                )}
              </div>

              <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-snug pl-9 sm:pl-9.5 line-clamp-2">
                {metric.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Helpful Guidance Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
        <span className="text-cyan-400 font-bold shrink-0">💡</span>
        <p className="truncate">
          {isBn
            ? "ম্যাপের যেকোনো জেলার উপর ক্লিক করে বিস্তারিত ডসিয়ার ও SHAP বিশ্লেষণ দেখুন।"
            : "Click any district on the map to inspect its detailed dossier."}
        </p>
      </div>
    </div>
  );
}
