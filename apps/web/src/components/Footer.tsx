"use client";

import React from "react";
import Link from "next/link";
import {
  Globe2,
  Database,
  ExternalLink,
  Shield,
  ArrowUp,
  FileText,
  Sliders,
  Bot,
  Activity,
  CheckCircle2,
  Scale,
  Sparkles,
} from "lucide-react";
import { useI18n } from "../context/I18nContext";

export function Footer() {
  const { lang, t } = useI18n();
  const isBn = lang === "bn";

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="w-full border-t border-white/10 bg-slate-950 text-slate-400 font-sans text-xs">
      {/* Main Footer Directory */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* 1. Brand & Mission (Col span: 4) */}
          <div className="lg:col-span-4 space-y-4">
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

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {isBn
                ? "বাংলাদেশ বদ্বীপ পরিকল্পনা ২১০০ ও জাতীয় অভিযোজন পরিকল্পনার (NAP) আলোকে ৬৪ জেলার জলবায়ু ঝুঁকি বিশ্লেষণ, নদীপ্রবাহ সিমুলেশন এবং গাণিতিক সমতাভিত্তিক সম্পদ বণ্টন প্ল্যাটফর্ম।"
                : "National climate risk analytics, river discharge simulation, and algorithmic equity resource allocation platform aligned with Bangladesh Delta Plan 2100."}
            </p>

            {/* Hackathon & GovTech Track Badge */}
            <div className="pt-2">
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
            </div>

            {/* System Status Pill */}
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>
                {isBn
                  ? "সকল ডেটা পাইপলাইন ও এপিআই সক্রিয় (Active)"
                  : "All Data Pipelines & APIs Online"}
              </span>
            </div>
          </div>

          {/* 2. Platform Navigation (Col span: 2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {isBn ? "প্ল্যাটফর্ম মডিউল" : "Platform Modules"}
            </h4>
            <ul className="space-y-2 text-xs">
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

          {/* 3. Verified Data Sources & Provider References (Col span: 3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {isBn ? "যাচাইকৃত উপাত্তের উৎস" : "Verified Data Sources"}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      {isBn ? "বাংলাদেশ পরিসংখ্যান ব্যুরো (BBS)" : "Bangladesh Bureau of Statistics"}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isBn
                        ? "জনশুমারি ২০২২ ও জেলা ডেমোগ্রাফিক্স"
                        : "Census 2022 & District Demographics"}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded shrink-0">
                    OpenGov
                  </span>
                </div>
              </li>
              <li>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-200 block">UN OCHA / HDX COD-AB</span>
                    <span className="text-[11px] text-slate-500">
                      {isBn
                        ? "অফিসিয়াল প্রশাসনিক সীমানা (৬৪ জেলা)"
                        : "Official Administrative Boundaries"}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-emerald-400/90 px-1.5 py-0.5 rounded shrink-0">
                    CC-BY 4.0
                  </span>
                </div>
              </li>
              <li>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      Copernicus EMS &amp; GLO-30
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isBn
                        ? "ডিজিটাল এলিভেশন ও কোস্টাল নিম্নাঞ্চল"
                        : "Digital Elevation & Coastal Lowlands"}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-cyan-400 px-1.5 py-0.5 rounded shrink-0">
                    ESA Open
                  </span>
                </div>
              </li>
              <li>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-200 block">Open-Meteo &amp; ECMWF</span>
                    <span className="text-[11px] text-slate-500">
                      {isBn
                        ? "ERA5 তাপদাহ ও GloFAS v4 নদীপ্রবাহ"
                        : "ERA5 Heat & GloFAS River Discharge"}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-purple-400 px-1.5 py-0.5 rounded shrink-0">
                    Open-Meteo
                  </span>
                </div>
              </li>
              <li>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-200 block">OpenAQ Global Grid v3</span>
                    <span className="text-[11px] text-slate-500">
                      {isBn
                        ? "বায়ুমান পর্যবেক্ষণ ও সেন্সর অডিট"
                        : "Regulatory Air Quality & Sensor Audit"}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-amber-400 px-1.5 py-0.5 rounded shrink-0">
                    ODbL
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* 4. Standards, APIs & Developer Hub (Col span: 3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {isBn ? "মানদণ্ড ও ডেভেলপার হাব" : "Standards & Developers"}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center justify-between group"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-emerald-400" />
                    <span>FastAPI OpenAPI / Swagger</span>
                  </span>
                  <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{isBn ? "স্থানিক রেফারেন্স (CRS)" : "Spatial Reference"}</span>
                  </span>
                  <span className="font-mono text-[10px] text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    OGC:CRS84
                  </span>
                </div>
              </li>
              <li>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-teal-400" />
                    <span>{isBn ? "উপাত্ত ফরম্যাট" : "Lakehouse Format"}</span>
                  </span>
                  <span className="font-mono text-[10px] text-teal-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    GeoParquet + DuckDB
                  </span>
                </div>
              </li>
              <li>
                <Link
                  href="/governance"
                  className="hover:text-emerald-400 transition-colors flex items-center justify-between group"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    <span>{isBn ? "এনআরবি ওপেন-মডেল হাব" : "NRB Open-Model Hub"}</span>
                  </span>
                  <span className="text-[10px] text-purple-300 font-mono">Open ML</span>
                </Link>
              </li>
              <li className="pt-1">
                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-2.5 text-[11px] text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>{isBn ? "ক্রিপ্টোগ্রাফিক অখণ্ডতা" : "Cryptographic Integrity"}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    {isBn
                      ? "প্রতিটি নীতি সিমুলেশন ও এআই ইন্টারঅ্যাকশন পোস্টগ্রেজ অডিট লগে অপরিবর্তনীয়ভাবে সংরক্ষিত।"
                      : "All simulations and policy actions are immutably logged with SHA-256 state hashes."}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright, Open Data Notice, and Scroll-to-Top */}
      <div className="border-t border-white/5 bg-slate-950 px-4 sm:px-6 lg:px-8 py-5">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p>
              &copy; {new Date().getFullYear()}{" "}
              <strong className="text-slate-300 font-semibold">Delta AI</strong>.{" "}
              {isBn
                ? "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার ওপেন ডেটা ফ্রেমওয়ার্ক।"
                : "Government Open Data Framework."}
            </p>
            <span className="hidden sm:inline text-slate-700">&middot;</span>
            <p className="text-[10px] text-slate-600">
              HDX COD-AB &middot; Copernicus GLO-30 &middot; Open-Meteo GloFAS &middot; OpenAQ v3
              &middot; BBS 2022
            </p>
          </div>

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
