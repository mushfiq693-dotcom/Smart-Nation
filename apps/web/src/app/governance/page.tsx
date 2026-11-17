"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Lock,
  Download,
  Terminal,
  Activity,
  CheckCircle2,
  FileCheck,
  Cpu,
  Layers,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Globe2,
  UserCheck,
  AlertTriangle,
  Award,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

export default function GovernancePage() {
  const { lang, t } = useI18n();
  const { role, token, canViewAuditLogs, getRoleBadgeColor } = useAuth();
  const isBn = lang === "bn";

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const [nrbData, setNrbData] = useState<any | null>(null);
  const [loadingNrb, setLoadingNrb] = useState(true);

  // Fetch Audit Logs (if allowed)
  const fetchAuditLogsData = useCallback(async () => {
    if (!canViewAuditLogs) return;
    setLoadingLogs(true);
    try {
      const res = await api.getAuditLogs(token, roleFilter || undefined, actionFilter || undefined);
      setAuditLogs(res.logs || []);
      setTotalLogs(res.total_returned || 0);
    } catch {
      // Backend may be reloading
    } finally {
      setLoadingLogs(false);
    }
  }, [canViewAuditLogs, token, roleFilter, actionFilter]);

  // Fetch NRB Hub Data
  useEffect(() => {
    let isMounted = true;
    api
      .getNrbHub()
      .then((data) => {
        if (isMounted) {
          setNrbData(data);
          setLoadingNrb(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingNrb(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (canViewAuditLogs) {
      fetchAuditLogsData();
    }
  }, [canViewAuditLogs, fetchAuditLogsData]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-8 pt-24 md:pt-28 pb-16 space-y-10 font-sans">
      {/* Governance Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-amber-500/30 bg-amber-950/60 px-2 py-0.5 text-xs font-semibold text-amber-300 font-mono">
              Immutable Governance & Trust
            </span>
            <span className="text-slate-500">&middot;</span>
            <span className="text-xs text-cyan-400 font-mono">NRB Open Innovation</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2.5">
            <Shield className="h-7 w-7 text-amber-400" />
            <span>{isBn ? "সুশাসন, এআই অডিট লগ ও এনআরবি ওপেন-মডেল হাব" : "Governance, AI Audit Logs & NRB Open-Model Hub"}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            {isBn
              ? "অপরিবর্তনীয় ক্রিপ্টোগ্রাফিক অডিট ট্রেইল, ডুয়াল-ইঞ্জিন এআই সেপারেশন এবং দেশ-বিদেশের অনাবাসী বাংলাদেশী (NRB) গবেষকদের জন্য ওপেন মেশিন লার্নিং আর্কিটেকচার।"
              : "Tamper-proof cryptographic audit trail, dual-engine AI separation, and open scientific models for Non-Resident Bangladeshi & diaspora research contributors."}
          </p>
        </div>

        {/* Current Role Badge */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-xs">
          <UserCheck className="h-4 w-4 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Viewer</span>
            <span className="font-bold text-slate-200">{role.replace("_", " ")}</span>
          </div>
        </div>
      </section>

      {/* Trust & Architecture Principles Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Dual-Engine AI Separation</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Deterministic DuckDB Spatial + XGBoost regressor strictly isolated from Generative LLM tool calls. Zero raw SQL access.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
            <FileCheck className="h-4 w-4" />
            <span>Zero Hallucination Grounding</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All Copilot answers enforce structured citations from official National Adaptation Plan (NAP) and Mujib Climate Prosperity Plan corpus.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
            <Activity className="h-4 w-4" />
            <span>Local Shapley Efficiency</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Exact additive TreeExplainer SHAP guarantees Σϕ_i = R̂_i - E[f(x)], providing mathematical proof of hazard score composition.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
            <Lock className="h-4 w-4" />
            <span>Immutable Audit Logging</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Every simulation run, copilot prompt, and policy brief generation is persisted into PostgreSQL audit logs with sanitized credentials.
          </p>
        </div>
      </section>

      {/* Section A: Live AI Governance Audit Logs */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Terminal className="h-5 w-5 text-amber-400" />
              <span>{isBn ? "লাইভ এআই গভর্নেন্স অডিট লগ ট্রেইল" : "Live AI Governance & System Audit Trail"}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBn
                ? "সিস্টেমের প্রতিটি ইন্টারঅ্যাকশন ও এআই কুয়েরির অপরিবর্তনীয় অডিট লগ"
                : "Real-time cryptographic audit log stream from PostgreSQL audit_logs table"}
            </p>
          </div>

          {canViewAuditLogs && (
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">{isBn ? "সকল রোল (All Roles)" : "All Roles"}</option>
                <option value="Public_Portal">Public_Portal</option>
                <option value="Municipal_Analyst">Municipal_Analyst</option>
                <option value="Policy_Reviewer">Policy_Reviewer</option>
                <option value="System_Admin">System_Admin</option>
              </select>

              <button
                onClick={fetchAuditLogsData}
                disabled={loadingLogs}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
                <span>{isBn ? "রিফ্রেশ" : "Refresh"}</span>
              </button>
            </div>
          )}
        </div>

        {canViewAuditLogs ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Log ID</th>
                    <th className="py-3 px-4">Actor Role</th>
                    <th className="py-3 px-4">Action Type</th>
                    <th className="py-3 px-4">Endpoint</th>
                    <th className="py-3 px-4">Payload Summary / Integrity</th>
                    <th className="py-3 px-4">Timestamp (UTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Loading audit logs...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No audit logs found.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-800/40 transition-colors text-[11px]">
                        <td className="py-3 px-4 text-slate-500">#{l.id}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                              l.actor_role === "Public_Portal"
                                ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                                : l.actor_role === "Municipal_Analyst"
                                ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/40"
                                : l.actor_role === "Policy_Reviewer"
                                ? "bg-purple-950/60 text-purple-300 border-purple-500/40"
                                : "bg-amber-950/60 text-amber-300 border-amber-500/40"
                            }`}
                          >
                            {l.actor_role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">{l.action_type}</td>
                        <td className="py-3 px-4 text-cyan-400">{l.endpoint}</td>
                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                          {typeof l.payload_summary === "object"
                            ? JSON.stringify(l.payload_summary)
                            : String(l.payload_summary)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {l.created_at ? l.created_at.replace("T", " ").slice(0, 19) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-800 bg-slate-900/60 px-6 py-2.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>Showing latest {auditLogs.length} audit trail records</span>
              <span className="font-mono text-emerald-400">Cryptographically Signed</span>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-amber-500/40 bg-amber-950/20 p-8 text-center space-y-3">
            <Lock className="h-8 w-8 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-white">
              {isBn ? "সংরক্ষিত অডিট লগ দর্শন (RBAC Protected)" : "Restricted Governance Audit Trail"}
            </h3>
            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
              {isBn
                ? "রোল-বেজড অ্যাক্সেস কন্ট্রোল (RBAC) নীতিমালার অধীনে অডিট লগ ট্রেইল দেখার অনুমতি শুধুমাত্র 'পলিসি পর্যালোচক (Policy_Reviewer)' এবং 'সিস্টেম অ্যাডমিনিস্ট্রেটর (System_Admin)' এর জন্য সংরক্ষিত। শীর্ষে রোল স্যুইচার থেকে আপনার ভূমিকা পরিবর্তন করে অডিট ট্রেইল পরীক্ষা করুন।"
                : "Under our strict RBAC governance doctrine, raw immutable audit log records are restricted to Policy Reviewers and System Administrators. Please switch your role to 'Policy Reviewer' or 'System Admin' in the top header selector to inspect the live trail."}
            </p>
          </div>
        )}
      </section>

      {/* Section B: NRB Open-Model Hub */}
      <section className="space-y-6 pt-4 border-t border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-cyan-500/30 bg-cyan-950/60 px-2 py-0.5 text-xs font-semibold text-cyan-300 font-mono">
              Diaspora Innovation
            </span>
            <span className="text-slate-500">&middot;</span>
            <span className="text-xs text-emerald-400 font-mono">Open Science AI</span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-1 flex items-center gap-2.5">
            <Globe2 className="h-6 w-6 text-cyan-400" />
            <span>{isBn ? "এনআরবি ওপেন-মডেল ও উদ্ভাবন হাব (NRB Open-Model Hub)" : "NRB Open-Model & Innovation Hub"}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            {isBn
              ? "অনাবাসী ও প্রবাসী বাংলাদেশী (NRB) গবেষক, প্রকৌশলী এবং বিশ্ববিদ্যালয়ের ল্যাবগুলোর জন্য উন্মুক্ত মডেল কার্ড, ট্রেনিং হাইপার-প্যারামিটার এবং সরাসরি জিওপার্কেট ডাউনলোড।"
              : "Empowering Non-Resident Bangladeshi & diaspora scientists: reproducible machine learning model cards, serialized weights, and modular open plugin contribution architecture."}
          </p>
        </div>

        {/* Model Card Grid */}
        {nrbData?.model_card && (
          <div className="grid md:grid-cols-3 gap-5">
            {/* Card 1: Core Architecture */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 space-y-3 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                <Cpu className="h-4 w-4" />
                <span>Architecture Specification</span>
              </div>
              <h3 className="text-base font-bold text-white">{nrbData.model_card.model_name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                {nrbData.model_card.architecture}
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div>Validation: {nrbData.model_card.training_protocol}</div>
                <div>Explainability: {nrbData.model_card.explainability_engine}</div>
              </div>
            </div>

            {/* Card 2: Performance Metrics */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 space-y-3 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <Award className="h-4 w-4" />
                <span>Spatial Cross-Validation</span>
              </div>
              <h3 className="text-base font-bold text-white">Out-of-Fold Performance</h3>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center font-mono">
                <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">R² Score</span>
                  <span className="text-base font-bold text-emerald-400">
                    {nrbData.model_card.metrics.out_of_fold_r2}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">RMSE</span>
                  <span className="text-base font-bold text-cyan-400">
                    {nrbData.model_card.metrics.out_of_fold_rmse}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">MAE</span>
                  <span className="text-base font-bold text-purple-400">
                    {nrbData.model_card.metrics.out_of_fold_mae}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 pt-1">
                Group K-Fold by ADM1 Division eliminates spatial autocorrelation leakage.
              </p>
            </div>

            {/* Card 3: Features Used */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 space-y-3 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                <Layers className="h-4 w-4" />
                <span>Input Features (9 Sectors)</span>
              </div>
              <h3 className="text-base font-bold text-white">Multi-Sector Normalization</h3>
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                {nrbData.model_card.features_used?.map((feat: string, fIdx: number) => (
                  <span
                    key={fIdx}
                    className="rounded-md bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Downloadable Artifacts Table */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="h-4 w-4 text-cyan-400" />
              <span>{isBn ? "ওপেন মডেল ফাইল ও আর্টফ্যাক্টস ডাউনলোড" : "Downloadable Open-Model Artifacts"}</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Open Science License</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Artifact Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {nrbData?.artifacts?.map((art: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{art.name}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-300 text-xs">{art.type}</td>
                    <td className="py-3.5 px-4 text-cyan-400">{art.format}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {art.size_bytes ? `${(art.size_bytes / 1024).toFixed(1)} KB` : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <a
                        href={`${API_BASE}${art.download_url}`}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-emerald-400 hover:border-emerald-500 hover:text-emerald-300 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contribution Guidelines Box */}
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 via-slate-900/50 to-slate-900/50 p-6 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
            <Globe2 className="h-4 w-4" />
            <span>NRB Contribution Protocol (DIU AI Builders Congress 2026)</span>
          </div>

          <h3 className="text-sm font-bold text-white">
            {isBn ? "গবেষক ও প্লাগইন কন্ট্রিবিউশন নির্দেশনা:" : "How Diaspora Researchers Can Extend ClimAct Twin:"}
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-300 pt-1">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1">
              <span className="font-bold text-cyan-400 block font-mono">Step 1: Download</span>
              <p className="text-[11px] text-slate-400">
                Download <code className="text-white">ml_feature_matrix.parquet</code> to replicate baseline predictions.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1">
              <span className="font-bold text-cyan-400 block font-mono">Step 2: Develop</span>
              <p className="text-[11px] text-slate-400">
                Train specialized models (e.g. radar satellite subsidence, micro-urban drainage).
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1">
              <span className="font-bold text-cyan-400 block font-mono">Step 3: Validate</span>
              <p className="text-[11px] text-slate-400">
                Validate against Spatial Group K-Fold to prevent geographic autocorrelation.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1">
              <span className="font-bold text-cyan-400 block font-mono">Step 4: Contribute</span>
              <p className="text-[11px] text-slate-400">
                Submit PR or contact <code className="text-emerald-400">nrb-hub@civicsphere.ai</code>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
