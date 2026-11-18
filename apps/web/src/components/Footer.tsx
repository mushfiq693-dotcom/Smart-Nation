"use client";

import React from "react";
import Link from "next/link";
import {
  Globe2,
  Database,
  Shield,
  ArrowUp,
  Sliders,
  Bot,
  Activity,
} from "lucide-react";
import { useI18n } from "../context/I18nContext";

export function Footer() {
  const { lang } = useI18n();
  const isBn = lang === "bn";

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="w-full border-t border-white/10 bg-slate-950 text-slate-400 font-sans text-xs">
      {/* Main Minimal Footer */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          {/* Brand & Mission */}
          <div className="max-w-md space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 border border-emerald-400/40 p-1 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <img
                  src="/delta-emblem-badge.png"
                  alt="Delta AI Logo"
                  className="h-full w-full object-contain rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  Delta
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-xs font-bold text-emerald-300">
                  AI
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed">
              {isBn
                ? "বাংলাদেশ বদ্বীপ পরিকল্পনা ২১০০ ও জাতীয় অভিযোজন পরিকল্পনার (NAP) আলোকে ৬৪ জেলার জলবায়ু ঝুঁকি বিশ্লেষণ, নদীপ্রবাহ সিমুলেশন এবং গাণিতিক সমতাভিত্তিক সম্পদ বণ্টন প্ল্যাটফর্ম।"
                : "National climate risk analytics, river discharge simulation, and algorithmic equity resource allocation platform aligned with Bangladesh Delta Plan 2100."}
            </p>

            {/* Badges & Status */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1.5 text-[11px] text-emerald-300 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {isBn ? "ডিআইইউ এআই বিল্ডার্স কংগ্রেস ২০২৬" : "DIU AI Builders Congress 2026"}
                </span>
                <span className="text-slate-600">&middot;</span>
                <span className="text-cyan-300 font-mono text-[10px]">
                  {isBn ? "পাবলিক সার্ভিস ট্র্যাক" : "GovTech Track"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>
                  {isBn
                    ? "সকল সার্ভিস সক্রিয় (Live)"
                    : "All Systems Online"}
                </span>
              </div>
            </div>
          </div>

          {/* Platform Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {isBn ? "প্ল্যাটফর্ম মডিউল" : "Platform Modules"}
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-xs">
              <li>
                <Link
                  href="/"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Globe2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>{isBn ? "৬৪ জেলা স্থানিক মানচিত্র" : "Spatial Risk Map"}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/simulator"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Sliders className="h-3.5 w-3.5 text-slate-500" />
                  <span>{isBn ? "বাজেট ও নীতি সিমুলেটর" : "Policy Simulator"}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/data-hub"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Database className="h-3.5 w-3.5 text-slate-500" />
                  <span>{isBn ? "উপাত্ত ক্যাটালগ ও লেকহাউস" : "Public Data Hub"}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/copilot"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Bot className="h-3.5 w-3.5 text-slate-500" />
                  <span>{isBn ? "গ্রাউন্ডেড এআই কোপাইলট" : "AI Policy Copilot"}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/governance"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Shield className="h-3.5 w-3.5 text-slate-500" />
                  <span>{isBn ? "সুশাসন ও অডিট লগ ট্রেইল" : "Governance & Audit"}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/outcomes"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Activity className="h-3.5 w-3.5 text-slate-500" />
                  <span>{isBn ? "ফলাফল ও অগ্রগতি ট্র্যাকার" : "Outcomes Tracker"}</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright and Scroll-to-Top */}
      <div className="border-t border-white/5 bg-slate-950 px-4 sm:px-6 lg:px-8 py-5">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p className="text-center sm:text-left">
            &copy; {new Date().getFullYear()}{" "}
            <strong className="text-slate-300 font-semibold">Delta AI</strong>.{" "}
            {isBn
              ? "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার ওপেন ডেটা ফ্রেমওয়ার্ক।"
              : "Government Open Data Framework."}
          </p>

          {/* Smooth Scroll-To-Top Pill Button */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 hover:bg-slate-800 px-3.5 py-1.5 text-xs text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40 transition-all shadow-sm active:scale-95 shrink-0"
            title={isBn ? "পৃষ্ঠার শীর্ষে যান" : "Back to Top"}
          >
            <ArrowUp className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-medium">{isBn ? "শীর্ষে যান" : "Back to top"}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
