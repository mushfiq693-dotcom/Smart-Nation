"use client";

import React from "react";
import {
  X,
  FileText,
  Download,
  CheckCircle,
  Shield,
  Layers,
  Calendar,
  Building,
  Activity,
  Award,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { api } from "../../lib/api";

interface PolicyBriefModalProps {
  brief: any | null;
  onClose: () => void;
}

export function PolicyBriefModal({ brief, onClose }: PolicyBriefModalProps) {
  const { lang, t } = useI18n();

  if (!brief) return null;

  const isBn = lang === "bn";
  const downloadUrl = api.getMarkdownMemoUrl(brief.scenario_id, lang);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-purple-400">
                  {brief.classification}
                </span>
                <span className="font-mono text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                  {brief.brief_id.slice(0, 8)}
                </span>
              </div>
              <h2 className="text-base font-bold text-white leading-tight">
                {brief.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:from-emerald-400 hover:to-teal-500 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isBn ? "মার্কডাউন ডাউনলোড" : "Export Markdown"}</span>
            </a>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300 text-xs">
          {/* Compliance & Outcomes Status Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span className="font-semibold">{brief.compliance_statement}</span>
            </div>
            {brief.saved_outcomes_count > 0 && (
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] text-emerald-300 font-mono">
                {brief.saved_outcomes_count} KPIs Registered in Outcomes DB
              </span>
            )}
          </div>

          {/* 6 Sections Rendering */}
          <div className="space-y-6">
            {brief.sections?.map((sec: any) => (
              <div
                key={sec.section_number}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-3"
              >
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-950 border border-emerald-500/40 text-[10px] text-emerald-300 font-mono">
                    {sec.section_number}
                  </span>
                  <span>{sec.title}</span>
                </h3>

                <div className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                  {sec.content_markdown}
                </div>
              </div>
            ))}
          </div>

          {/* Citations Block */}
          {brief.citations && brief.citations.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
              <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>
                  {isBn
                    ? "বিধিবদ্ধ জাতীয় নীতিমালা ও নির্দেশিকা রেফারেন্স"
                    : "Statutory Policy Citations & National Guidelines"}
                </span>
              </h3>

              <div className="grid md:grid-cols-2 gap-3">
                {brief.citations.map((c: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{c.document_title}</span>
                      <span className="text-[10px] text-cyan-400 font-mono">{c.section}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic">"{c.excerpt}"</p>
                    <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800">
                      Source: {c.source_path} ({c.provenance_class})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 bg-slate-950/90 px-6 py-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>ClimAct Twin Deterministic Policy Memo · Dual-Engine Architecture</span>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            {isBn ? "বন্ধ করুন" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
