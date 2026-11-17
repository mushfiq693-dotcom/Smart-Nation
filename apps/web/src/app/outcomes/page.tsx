"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  Building,
  Calendar,
  ExternalLink,
  Filter,
  Search,
  RefreshCw,
  Edit3,
  X,
  FileCheck,
  TrendingUp,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

export default function OutcomesPage() {
  const { lang, t } = useI18n();
  const { role, token, canGenerateBrief, canManageSystem } = useAuth();
  const isBn = lang === "bn";

  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    total_outcomes: 0,
    planned: 0,
    active: 0,
    under_review: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("");

  // Audit Update Modal State
  const [editingOutcome, setEditingOutcome] = useState<any | null>(null);
  const [newObservedValue, setNewObservedValue] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("Active");
  const [newEvidenceUrl, setNewEvidenceUrl] = useState<string>("");
  const [savingUpdate, setSavingUpdate] = useState<boolean>(false);

  const fetchOutcomesData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getOutcomes();
      setOutcomes(res.outcomes || []);
      setSummary(res.summary || {});
    } catch {
      // Backend may be reloading
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutcomesData();
  }, [fetchOutcomesData]);

  // Open Edit Modal
  const openEditModal = (outcome: any) => {
    setEditingOutcome(outcome);
    setNewObservedValue(
      outcome.observed_value !== null ? String(outcome.observed_value) : ""
    );
    setNewStatus(outcome.status || "Active");
    setNewEvidenceUrl(outcome.evidence_url || "");
  };

  // Submit Update
  const handleSaveUpdate = async () => {
    if (!editingOutcome) return;
    setSavingUpdate(true);
    try {
      await api.updateOutcome(
        editingOutcome.id,
        {
          observed_value: newObservedValue ? Number(newObservedValue) : undefined,
          status: newStatus,
          evidence_url: newEvidenceUrl.trim() || undefined,
        },
        token
      );
      setEditingOutcome(null);
      await fetchOutcomesData();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSavingUpdate(false);
    }
  };

  // Filtered List
  const filteredOutcomes = outcomes.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (agencyFilter && !o.responsible_agency?.toLowerCase().includes(agencyFilter.toLowerCase()))
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.title?.toLowerCase().includes(q) ||
        o.target_pcode?.toLowerCase().includes(q) ||
        o.indicator_code?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "Planned":
        return "bg-blue-950/80 text-blue-300 border-blue-500/40";
      case "Active":
        return "bg-amber-950/80 text-amber-300 border-amber-500/40";
      case "Under_Review":
        return "bg-purple-950/80 text-purple-300 border-purple-500/40";
      case "Completed":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const calculateProgress = (baseline: number, target: number, observed: number | null) => {
    if (observed === null) return 15; // default planned progress
    const totalDiff = Math.abs(target - baseline);
    if (totalDiff === 0) return 100;
    const achievedDiff = Math.abs(observed - baseline);
    return Math.min(100, Math.max(10, Math.round((achievedDiff / totalDiff) * 100)));
  };

  const canEdit = canGenerateBrief || canManageSystem;

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-8 pt-24 md:pt-28 pb-16 space-y-8 font-sans">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-emerald-500/30 bg-emerald-950/60 px-2 py-0.5 text-xs font-semibold text-emerald-300 font-mono">
              Closed-Loop Accountability
            </span>
            <span className="text-slate-500">&middot;</span>
            <span className="text-xs text-cyan-400 font-mono">
              {isBn ? "ফলাফল ট্র্যাকার ও অডিট" : "Baseline-to-Target Verification"}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2.5">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            <span>
              {isBn
                ? "ক্লোজড-লুপ পলিসি ফলাফল ও অগ্রগতি ট্র্যাকার"
                : "Closed-Loop Policy Outcomes Tracker"}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            {isBn
              ? "সিমুলেশনে নির্ধারিত লক্ষ্যমাত্রার বাস্তবায়ন অগ্রগতি পর্যবেক্ষণ। MoDMR, DoE, LGED ও সিটি কর্পোরেশনের দায়িত্বপ্রাপ্ত প্রকল্পের বেসলাইন বনাম ফিল্ড অডিট উপাত্ত।"
              : "Bridging simulation predictions to physical governance. Track quantifiable baseline-to-target commitments across ministries with empirical verification audits."}
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchOutcomesData}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors shadow-sm shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{isBn ? "রিফ্রেশ" : "Refresh Data"}</span>
        </button>
      </section>

      {/* Summary Scorecards */}
      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
            {isBn ? "মোট মাইলফলক" : "Total Outcomes"}
          </span>
          <p className="mt-1 text-2xl font-bold text-white font-mono">{summary.total_outcomes}</p>
          <p className="text-[10px] text-cyan-400 mt-0.5">Tracked Targets</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
            {isBn ? "পরিকল্পিত (Planned)" : "Planned"}
          </span>
          <p className="mt-1 text-2xl font-bold text-blue-400 font-mono">{summary.planned}</p>
          <p className="text-[10px] text-blue-300 mt-0.5">Pre-Monsoon</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
            {isBn ? "চলমান (Active)" : "Active"}
          </span>
          <p className="mt-1 text-2xl font-bold text-amber-400 font-mono">{summary.active}</p>
          <p className="text-[10px] text-amber-300 mt-0.5">Field Execution</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
            {isBn ? "পর্যালোচনাধীন" : "Under Review"}
          </span>
          <p className="mt-1 text-2xl font-bold text-purple-400 font-mono">{summary.under_review}</p>
          <p className="text-[10px] text-purple-300 mt-0.5">Audit Stage</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
            {isBn ? "সম্পন্ন (Completed)" : "Completed"}
          </span>
          <p className="mt-1 text-2xl font-bold text-emerald-400 font-mono">{summary.completed}</p>
          <p className="text-[10px] text-emerald-300 mt-0.5">Targets Met</p>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tab Chips */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 shadow-sm">
          {["ALL", "Planned", "Active", "Under_Review", "Completed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {st === "ALL" ? (isBn ? "সকল মাইলফলক" : "All Outcomes") : st.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Search & Agency Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={isBn ? "মাইলফলক বা জেলা খুঁজুন..." : "Search milestone or p-code..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={agencyFilter}
            onChange={(e) => setAgencyFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="">{isBn ? "সকল মন্ত্রণালয়/সংস্থা" : "All Agencies"}</option>
            <option value="MoDMR">MoDMR</option>
            <option value="DoE">DoE (Environment)</option>
            <option value="LGED">LGED</option>
            <option value="DNCC">DNCC / DSCC</option>
            <option value="MoHFW">MoHFW (Health)</option>
          </select>
        </div>
      </section>

      {/* Main Outcomes Table */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Milestone Target</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Agency</th>
                <th className="py-3 px-4">Baseline &rarr; Target</th>
                <th className="py-3 px-4">Field Observed</th>
                <th className="py-3 px-4">Verification Horizon</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading outcomes registry...
                  </td>
                </tr>
              ) : filteredOutcomes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No matching outcomes found.
                  </td>
                </tr>
              ) : (
                filteredOutcomes.map((o) => {
                  const progressPct = calculateProgress(
                    Number(o.baseline_value),
                    Number(o.target_value),
                    o.observed_value ? Number(o.observed_value) : null
                  );

                  return (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-white truncate">{o.title}</div>
                        <div className="font-mono text-[10px] text-cyan-400 mt-0.5">
                          {o.indicator_code}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {o.target_pcode}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300">
                          {o.responsible_agency}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-400">{Number(o.baseline_value).toFixed(1)}</span>
                          <span className="text-slate-600">&rarr;</span>
                          <span className="font-bold text-emerald-400">
                            {Number(o.target_value).toFixed(1)}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                        {o.observed_value !== null ? Number(o.observed_value).toFixed(1) : "—"}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span>{o.review_date}</span>
                        </div>
                        {o.evidence_url && (
                          <a
                            href={o.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5 mt-0.5"
                          >
                            <span>Evidence Link</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-semibold ${getStatusBadge(
                            o.status
                          )}`}
                        >
                          {o.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {canEdit ? (
                          <button
                            onClick={() => openEditModal(o)}
                            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition-colors"
                          >
                            <Edit3 className="h-3 w-3 text-emerald-400" />
                            <span>{isBn ? "অডিট" : "Audit"}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Read-only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reviewer Field Audit Modal */}
      {editingOutcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">
                  Policy Reviewer Audit Verification
                </span>
                <h3 className="text-base font-bold text-white leading-tight mt-0.5">
                  {editingOutcome.title}
                </h3>
              </div>
              <button
                onClick={() => setEditingOutcome(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Baseline Commitment:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {editingOutcome.baseline_value}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Target Simulated Commitment:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {editingOutcome.target_value}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">
                  Empirical Field Observed Value:
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newObservedValue}
                  onChange={(e) => setNewObservedValue(e.target.value)}
                  placeholder="Enter audited field value..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">
                  Milestone Lifecycle Status:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Planned">Planned</option>
                  <option value="Active">Active (Under Implementation)</option>
                  <option value="Under_Review">Under Review (Audit in Progress)</option>
                  <option value="Completed">Completed (Target Verified)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">
                  Verification Evidence / Survey Document URL:
                </label>
                <input
                  type="url"
                  value={newEvidenceUrl}
                  onChange={(e) => setNewEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingOutcome(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveUpdate}
                disabled={savingUpdate}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50"
              >
                {savingUpdate ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileCheck className="h-3.5 w-3.5" />
                )}
                <span>Save Audit Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
