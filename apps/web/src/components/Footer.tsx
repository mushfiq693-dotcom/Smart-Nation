"use client";

import React from "react";
import { Shield, Sparkles, Terminal, FileText, Database, ArrowUp } from "lucide-react";
import { useI18n } from "../context/I18nContext";

export function Footer() {
  const { lang, t } = useI18n();

  return (
    <footer className="w-full border-t border-slate-900 bg-slate-950 px-6 py-8 text-xs text-slate-400">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Attribution */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1.5">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-lg bg-slate-900 border border-emerald-400/30 overflow-hidden p-0.5 shadow-sm">
              <img src="/delta-emblem-badge.png" alt="Delta AI" className="h-full w-full object-contain" />
            </div>
            <span className="font-bold text-slate-200 text-sm">Delta AI</span>
          </div>
          <p className="text-[11px] text-slate-500 max-w-xl">
            {t("footer.govt_title")}
          </p>
          <p className="text-[10px] text-slate-600">
            {t("footer.open_data")}
          </p>
        </div>

        {/* Technical Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px]">
            <Database className="h-3 w-3 text-cyan-400" />
            <span className="text-slate-300 font-mono">DuckDB Spatial &lt; 10ms</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px]">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span className="text-slate-300 font-mono">XGBoost (R² = 0.815)</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px]">
            <Shield className="h-3 w-3 text-purple-400" />
            <span className="text-slate-300 font-mono">TreeExplainer SHAP</span>
          </div>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300 transition-colors"
          >
            <FileText className="h-3 w-3 text-amber-400" />
            <span className="font-mono">FastAPI Swagger</span>
          </a>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-colors"
            title="Scroll to Top"
          >
            <ArrowUp className="h-3 w-3 text-emerald-400" />
            <span>{lang === "bn" ? "উপরে যান" : "Top"}</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl mt-6 pt-4 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-600">
        <p>{t("footer.copyright")}</p>
        <p className="mt-1 sm:mt-0 font-mono">
          Track: CivicSphere AI, Government, Public Service and Digital Nations
        </p>
      </div>
    </footer>
  );
}
