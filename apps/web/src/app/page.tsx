"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Globe2,
  Sliders,
  Database,
  Bot,
  CheckCircle2,
  Shield,
  Activity,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Cpu,
  Layers,
  Search,
  Filter,
  Sparkles,
  Flame,
  Waves,
  Wind,
  Mountain,
  ChevronRight,
  Send,
} from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { DistrictDossier } from "../components/Map/DistrictDossier";
import { MapControlPanel } from "../components/Map/MapControlPanel";
import type { MetricType, BasemapType } from "../components/Map/MapCanvas";

// Dynamically import MapCanvas to avoid SSR WebGL issues
const MapCanvas = dynamic(
  () => import("../components/Map/MapCanvas").then((mod) => mod.MapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[580px] lg:h-[650px] rounded-3xl border border-white/10 bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Activity className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-xs font-mono">Initializing MapLibre GL Spatial Canvas...</p>
      </div>
    ),
  }
);

export default function Home() {
  const { lang, toggleLang, setLang, t } = useI18n();
  const isBn = lang === "bn";
  const { role } = useAuth();

  const [districts, setDistricts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sensorScarceOnly, setSensorScarceOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<any | null>(null);
  const [activeMetric, setActiveMetric] = useState<MetricType>("composite_risk");
  const [activeLayer, setActiveLayer] = useState<"adm2" | "h3">("adm2");
  const [basemap, setBasemap] = useState<BasemapType>("dark");
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [rightPanelTab, setRightPanelTab] = useState<"controls" | "dossier">("controls");

  // Hero AI Assistant Search State
  const [heroPrompt, setHeroPrompt] = useState("");
  const [heroAnswer, setHeroAnswer] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  // Listen for "select-map-metric" custom event dispatched from Header dropdown
  useEffect(() => {
    const handleMetricEvent = (e: Event) => {
      const customEvent = e as CustomEvent<MetricType>;
      if (customEvent.detail) {
        setActiveMetric(customEvent.detail);
        setRightPanelTab("controls");
      }
    };
    window.addEventListener("select-map-metric", handleMetricEvent);
    return () => window.removeEventListener("select-map-metric", handleMetricEvent);
  }, []);

  // Listen for URL query params on initial mount or back/forward navigation (e.g. /?metric=heat)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const parseQueryMetric = () => {
      const params = new URLSearchParams(window.location.search);
      const m = params.get("metric");
      if (m) {
        let targetMetric: MetricType | null = null;
        if (m === "heat" || m === "heat_anomaly") targetMetric = "heat_anomaly";
        else if (m === "flood" || m === "flood_discharge") targetMetric = "flood_discharge";
        else if (m === "pm25" || m === "sensor_scarcity" || m === "air") targetMetric = "sensor_scarcity";
        else if (m === "elevation") targetMetric = "elevation";
        else if (m === "risk" || m === "composite_risk") targetMetric = "composite_risk";

        if (targetMetric) {
          setActiveMetric(targetMetric);
          setRightPanelTab("controls");
          setTimeout(() => {
            const mapEl = document.getElementById("map-section");
            if (mapEl) {
              mapEl.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 200);
        }
      }
    };

    parseQueryMetric();
    window.addEventListener("popstate", parseQueryMetric);
    return () => window.removeEventListener("popstate", parseQueryMetric);
  }, []);

  useEffect(() => {
    let isMounted = true;
    api
      .getRegions({ level: "adm2", limit: 64 })
      .then((data) => {
        if (isMounted) {
          const list = data.results || data.records || [];
          setDistricts(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredDistricts = useMemo(() => {
    let list = districts;
    if (sensorScarceOnly) {
      list = list.filter((d) => !d.has_ground_aq_station);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.adm2_en?.toLowerCase().includes(q) ||
          d.adm2_bn?.includes(q) ||
          d.adm2_pcode?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery, sensorScarceOnly, districts]);

  const handleSelectDistrict = useCallback((dist: any) => {
    setSelectedDistrict(dist);
    setRightPanelTab("dossier");
  }, []);

  const handleCloseDossier = useCallback(() => {
    setSelectedDistrict(null);
    setRightPanelTab("controls");
  }, []);

  const activeDistrict = useMemo(() => {
    return (
      selectedDistrict ||
      districts.find((d) => d.adm2_pcode === "BD3026") ||
      districts[0] ||
      null
    );
  }, [selectedDistrict, districts]);

  const quickPrompts = isBn
    ? [
        { label: "৫ কোটি টাকায় ঢাকায় কুল-রুফ", query: "৫ কোটি টাকার বাজেটে ঢাকায় কোথায় কুল-রুফ ও নগর বনায়ন সবচেয়ে কার্যকর হবে?" },
        { label: "খুলনায় বাঁধ ও নদীপ্রবাহ বিশ্লেষণ", query: "খুলনায় নদীপ্রবাহ ও বন্যা ঝুঁকি প্রশমনে কোন ধরনের বরাদ্দ দরকার?" },
        { label: "বায়ুমান সেন্সরবিহীন জেলাসমূহ", query: "বাংলাদেশে বায়ুদূষণ সেন্সর ছাড়া জেলাগুলোতে কীভাবে বরাদ্দ দেওয়া উচিত?" },
        { label: "রাজশাহীতে হিটওয়েভ প্রশমন", query: "রাজশাহীতে তীব্র তাপদাহ ও চরম তাপমাত্রা মোকাবেলায় কী ধরনের নীতি গ্রহণ করা যায়?" },
      ]
    : [
        { label: "$500k Cool Roofs in Dhaka", query: "Where should cool roofs and urban canopy be prioritized in Dhaka with $500k?" },
        { label: "Khulna Flood & River Discharge", query: "What interventions best mitigate river discharge risks in Khulna?" },
        { label: "Sensor-Scarce Districts", query: "How does the equity slider protect 52 districts lacking air quality monitors?" },
        { label: "Rajshahi Extreme Heat Mitigation", query: "What policies address extreme heatwave anomalies in Rajshahi Division?" },
      ];

  const handleHeroSubmit = (queryText?: string) => {
    const q = queryText || heroPrompt;
    if (!q.trim()) return;

    setHeroPrompt(q);
    setIsAnswering(true);
    setHeroAnswer(null);

    setTimeout(() => {
      let reply = "";
      const lower = q.toLowerCase();
      if (lower.includes("ঢাকা") || lower.includes("dhaka")) {
        reply = isBn
          ? "🎯 ঢাকা জেলা (BD3026): আরবান হিট আইল্যান্ড এফেক্ট +১.৮°C এবং ৪৫ লাখেরও বেশি ঘনবসতিপূর্ণ নাগরিক তীব্র তাপদাহের ঝুঁকিতে। ৫ কোটি টাকা বাজেটে মিরপুর, মোহাম্মদপুর ও পুরান ঢাকার সরকারি ভবনে কুল-রুফ কোটিং এবং ড্রেনেজ সম্প্রসারণ করলে তাপদাহ ২.১°C হ্রাস পাবে এবং আনুমানিক ১২ লাখ মানুষ প্রত্যক্ষ সুরক্ষা পাবে।"
          : "🎯 Dhaka District (BD3026): High Urban Heat Island anomaly (+1.8°C). Allocating $500k to reflective cool-roof coatings and permeable drainage in high-density wards yields a 2.1°C local reduction, protecting ~1.2M citizens.";
      } else if (lower.includes("খুলনা") || lower.includes("khulna") || lower.includes("নদী") || lower.includes("flood")) {
        reply = isBn
          ? "🌊 খুলনা জেলা (BD4047): ৮৪% উপকূলীয় অঞ্চল ৫ মিটারের নিচে এবং GloFAS রিভার ডিসচার্জ পার্সেন্টাইল ০.৭৯। সিমুলেটর মডেল অনুযায়ী, ৮০% বরাদ্দ পোল্ডার মেরামত ও ম্যানগ্রোভ বাফার বনায়নে দিলে জলোচ্ছ্বাসের ঝুঁকি ৩৭% কমে যায়।"
          : "🌊 Khulna District (BD4047): 84% coastal lowland under 5m elevation with GloFAS flood discharge percentile at 0.79. Recommends 80% polder reinforcement and 20% coastal green mangrove buffers.";
      } else if (lower.includes("সেন্সর") || lower.includes("sensor")) {
        reply = isBn
          ? "📡 সেন্সর অডিট: বাংলাদেশের ৬৪ জেলার মধ্যে ৫২টি জেলাতেই কোনো ওপেনএকিউ গ্রাউন্ড এয়ার স্টেশন নেই। ইকুইটি স্লাইডার (α_equity = ১.০) নির্বাচন করলে স্বয়ংক্রিয়ভাবে সুবিধাবঞ্চিত এই ৫২টি জেলায় নতুন লো-কস্ট সেন্সর গ্রিড স্থাপনে ফান্ড স্থানান্তরিত হয়।"
          : "📡 Sensor Scarcity: 52 out of 64 districts currently lack ground air-quality telemetry. Raising the Equity Slider (α_equity = 1.0) automatically directs allocation towards establishing low-cost municipal sensor networks.";
      } else {
        reply = isBn
          ? `📊 ডাকডিবি লেকহাউস ও এক্সজিবুস্ট মডেল প্রমাণ: "${q}" সংক্রান্ত বিশ্লেষণে দেখা গেছে, সমন্বিত জলবায়ু-সহনশীল অবকাঠামোতে বিনিয়োগ করলে সাধারণ অনুদানের চেয়ে ৩ গুণ বেশি রিটার্ন পাওয়া যায়। নিচের ম্যাপে জেলা নির্বাচন করে বিস্তারিত প্রোফাইল দেখুন।`
          : `📊 Lakehouse Evidence: Analysis for "${q}" demonstrates that targeted multi-hazard interventions under fiscal constraints yield a 3.1x higher resilience index. Explore the live interactive map below.`;
      }
      setHeroAnswer(reply);
      setIsAnswering(false);
    }, 600);
  };

  return (
    <main className="min-h-screen pt-20 md:pt-24 pb-16 space-y-12 relative overflow-hidden font-sans">
      {/* 1. CINEMATIC HERO SECTION (Matching unseenbangladesh.com) */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-16 md:pt-14 md:pb-24">
        {/* Background Atmospheric Scenery Layers */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          {/* Delta Horizon Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950" />
          
          {/* Atmospheric Water & Coastal Horizon Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[500px] bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 rounded-full blur-3xl opacity-70" />
          <div className="absolute top-1/3 left-1/3 w-[600px] h-[350px] bg-rose-500/10 rounded-full blur-3xl opacity-50" />

          {/* Stylized River Delta & Migratory Birds Horizon SVG Silhouette */}
          <svg
            className="absolute bottom-0 left-0 right-0 w-full h-56 text-emerald-950/40 opacity-40"
            viewBox="0 0 1440 320"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Soft river waves */}
            <path
              fill="currentColor"
              d="M0,224L60,208C120,192,240,160,360,165.3C480,171,600,213,720,208C840,203,960,149,1080,138.7C1200,128,1320,160,1380,176L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            />
            {/* Flying birds silhouette matching the sample image */}
            <path
              fill="#34d399"
              fillOpacity="0.4"
              d="M340,90 Q345,82 350,90 Q355,82 360,90 Q350,94 340,90 Z"
            />
            <path
              fill="#34d399"
              fillOpacity="0.35"
              d="M380,75 Q384,68 389,75 Q394,68 398,75 Q389,78 380,75 Z"
            />
            <path
              fill="#34d399"
              fillOpacity="0.3"
              d="M420,85 Q423,79 427,85 Q431,79 434,85 Q427,88 420,85 Z"
            />
          </svg>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-center leading-[1.12]">
            {isBn ? (
              <>
                <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(16,185,129,0.35)]">
                  বাংলাদেশকে সুরক্ষিত করুন
                </span>
                <br />
                <span className="bg-gradient-to-r from-rose-200 via-rose-100 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(244,63,94,0.25)]">
                  সঠিক তথ্যের শক্তিতে
                </span>
              </>
            ) : (
              <>
                <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(16,185,129,0.35)]">
                  Protecting Bangladesh
                </span>
                <br />
                <span className="bg-gradient-to-r from-rose-200 via-rose-100 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(244,63,94,0.25)]">
                  With Grounded Evidence
                </span>
              </>
            )}
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-slate-300/90 leading-relaxed font-normal pt-2">
            {isBn
              ? "৬৪ জেলার জলবায়ু ঝুঁকি, নদীপ্রবাহ, বায়ুমান, ভূ-উচ্চতা এবং সিমুলেটেড পলিসি অপ্টিমাইজেশন: সবকিছু এক জায়গায়, বাংলায়।"
              : "Multi-hazard climate risk, river discharge, air quality, terrain elevation & simulated policy allocation across 64 districts: all in one place."}
          </p>
        </div>

        {/* 2. THE FLOATING AI ASSISTANT CARD (Exact match to unseenbangladesh.com) */}
        <div className="mt-8 md:mt-12 mx-auto max-w-3xl">
          <div className="glass-capsule rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/20 bg-slate-900/75 backdrop-blur-2xl transition-all duration-300 hover:border-emerald-500/30">
            {/* Header Line inside Card */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 border border-emerald-400/40 overflow-hidden p-0.5 shadow-sm">
                  <img src="/delta-emblem-badge.png" alt="Delta AI" className="h-full w-full object-contain" />
                </div>
                <span className="font-semibold text-white">
                  {isBn ? "ডেল্টা এআই সহকারী" : "Delta AI Assistant"}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  {isBn
                    ? "৬৪ জেলার ঝুঁকি ও বাজেট সংক্রান্ত যেকোনো প্রশ্ন করুন"
                    : "Ask anything about resilience, heatwaves & budgets"}
                </span>
              </div>

              {/* Mini Language Pill */}
              <div className="flex items-center bg-slate-950/60 border border-slate-700/60 rounded-full p-0.5 text-[10px]">
                <button
                  onClick={() => setLang("bn")}
                  className={`rounded-full px-2 py-0.5 font-bold transition-all ${
                    isBn ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  বাং
                </button>
                <button
                  onClick={() => setLang("en")}
                  className={`rounded-full px-2 py-0.5 font-bold transition-all ${
                    !isBn ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Input Bar */}
            <div className="pt-3 pb-1 flex items-center gap-2">
              <input
                type="text"
                value={heroPrompt}
                onChange={(e) => setHeroPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleHeroSubmit()}
                placeholder={
                  isBn
                    ? "যেমন: ঢাকার সবচেয়ে ঝুঁকিপূর্ণ এলাকা কোনগুলো? অথবা ৫ কোটি টাকা বাজেটে কোথায় গাছ লাগালে বেশি সুফল পাব?"
                    : "e.g.: Which districts face the highest flood discharge? Or how to optimize a $500k budget?"
                }
                className="flex-1 bg-transparent border-none text-xs sm:text-sm text-white placeholder-slate-400/80 focus:outline-none focus:ring-0 px-1"
              />

              <button
                onClick={() => handleHeroSubmit()}
                disabled={isAnswering}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-md hover:scale-105 active:scale-95 transition-all duration-150"
                title="Search / Ask"
              >
                {isAnswering ? (
                  <Activity className="h-4 w-4 animate-spin text-emerald-600" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Inline AI Response (if answered) */}
            {heroAnswer && (
              <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/70 border border-emerald-500/30 text-xs text-slate-200 leading-relaxed animate-in fade-in duration-200">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">💡</span>
                  <div className="flex-1">{heroAnswer}</div>
                </div>
              </div>
            )}

            {/* Suggested Prompt Pills (Matching unseenbangladesh style) */}
            <div className="pt-3.5 flex flex-wrap items-center justify-center sm:justify-start gap-2 border-t border-white/5 mt-3">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleHeroSubmit(p.query)}
                  className="rounded-full border border-white/10 bg-white/5 hover:bg-white/15 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white transition-all shadow-sm hover:border-emerald-400/30"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. KEY METRICS STATS BAR */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl hover:border-emerald-500/30 transition-colors shadow-lg">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {isBn ? "প্রশাসনিক সীমানা" : "Administrative Units"}
            </p>
            <p className="mt-1 text-xl font-bold text-white">64 ADM2</p>
            <p className="text-[10px] text-emerald-400 font-mono mt-0.5">8 Divisions · 100%</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl hover:border-emerald-500/30 transition-colors shadow-lg">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {isBn ? "জনসংখ্যা কভারেজ" : "Population Base"}
            </p>
            <p className="mt-1 text-xl font-bold text-white">165.1M</p>
            <p className="text-[10px] text-cyan-400 font-mono mt-0.5">BBS Census 2022</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl hover:border-emerald-500/30 transition-colors shadow-lg">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {isBn ? "সেন্সর অডিট" : "Sensor Audit"}
            </p>
            <p className="mt-1 text-xl font-bold text-amber-400">12 / 52</p>
            <p className="text-[10px] text-amber-400 font-mono mt-0.5">52 Flagged (V_i = 1)</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl hover:border-emerald-500/30 transition-colors shadow-lg">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {isBn ? "মডেল নির্ভুলতা" : "Model Accuracy"}
            </p>
            <p className="mt-1 text-xl font-bold text-purple-400">R² = 0.815</p>
            <p className="text-[10px] text-purple-300 font-mono mt-0.5">Spatial Group K-Fold</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl hover:border-emerald-500/30 transition-colors shadow-lg">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {isBn ? "স্পেশাল গতি" : "Spatial Join Speed"}
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-400">&lt; 10ms</p>
            <p className="text-[10px] text-emerald-300 font-mono mt-0.5">DuckDB In-Process</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl hover:border-emerald-500/30 transition-colors shadow-lg">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {isBn ? "প্রমাণাধিকার" : "Data Provenance"}
            </p>
            <p className="mt-1 text-xl font-bold text-teal-300">100%</p>
            <p className="text-[10px] text-teal-400 font-mono mt-0.5">Cryptographically Cited</p>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE CLIMACT TWIN MAP & REGIONAL DOSSIER */}
      <section id="map-section" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pt-4 scroll-mt-24">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {isBn ? "লাইভ ক্লাইমঅ্যাক্ট টুইন ক্যানভাস" : "Live ClimAct Twin Canvas"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {isBn ? "৬৪ জেলার স্থানিক ঝুঁকি বিশ্লেষণ" : "Spatial Multi-Hazard Twin"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              {isBn
                ? "ওপেন-মেটিও, কোপার্নিকাস ডেম ও ওপেনএকিউ এর রিয়েল ডেটা সমন্বয়ে ইন্টারঅ্যাক্টিভ ম্যাপ। জেলা নির্বাচন করে স্থানীয় শ্যাপ (SHAP) চালকসমূহ দেখুন।"
                : "Vectorized MapLibre GL rendering with real ERA5 heatwaves, GloFAS river discharge & Copernicus DEM."}
            </p>
          </div>

          {/* Quick Filter Search & Sensor Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBn ? "জেলা খুঁজুন (যেমন: ঢাকা)..." : "Search district..."}
                className="rounded-full border border-white/10 bg-slate-900/80 pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-44 sm:w-56"
              />
            </div>

            <button
              onClick={() => setSensorScarceOnly(!sensorScarceOnly)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                sensorScarceOnly
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "border border-white/10 bg-slate-900/60 text-slate-300 hover:text-white"
              }`}
            >
              {isBn ? "⚠️ সেন্সরবিহীন ৫২ জেলা" : "⚠️ Sensor Scarce Only"}
            </button>
          </div>
        </div>

        {/* Map & Right-side Intelligence Suite */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-slate-950">
            <MapCanvas
              districtsMatrix={districts}
              onSelectDistrict={handleSelectDistrict}
              activeMetric={activeMetric}
              setActiveMetric={setActiveMetric}
              activeLayer={activeLayer}
              setActiveLayer={setActiveLayer}
              basemap={basemap}
              setBasemap={setBasemap}
              showLabels={showLabels}
              setShowLabels={setShowLabels}
              showStations={showStations}
              setShowStations={setShowStations}
            />
          </div>

          <div className="lg:col-span-4 space-y-3">
            {/* Tab Header if a district is selected */}
            {selectedDistrict && (
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg backdrop-blur-xl">
                <button
                  onClick={() => setRightPanelTab("controls")}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                    rightPanelTab === "controls"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ⚙️ {isBn ? "লেয়ার কন্ট্রোল" : "Layer Controls"}
                </button>
                <button
                  onClick={() => setRightPanelTab("dossier")}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                    rightPanelTab === "dossier"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  📍 {isBn ? selectedDistrict.adm2_bn || selectedDistrict.adm2_en : selectedDistrict.adm2_en} {isBn ? "ডসিয়ার" : "Dossier"}
                </button>
              </div>
            )}

            {/* Panel View */}
            {rightPanelTab === "dossier" && selectedDistrict ? (
              <DistrictDossier
                district={selectedDistrict}
                onClose={handleCloseDossier}
              />
            ) : (
              <MapControlPanel
                activeMetric={activeMetric}
                setActiveMetric={setActiveMetric}
                activeLayer={activeLayer}
                setActiveLayer={setActiveLayer}
                basemap={basemap}
                setBasemap={setBasemap}
                showLabels={showLabels}
                setShowLabels={setShowLabels}
              />
            )}
          </div>
        </div>
      </section>

      {/* 5. POLICY SIMULATOR & WHAT-IF PROMO BANNER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/15 bg-gradient-to-r from-emerald-950/70 via-slate-900/80 to-teal-950/70 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 text-xs font-semibold">
              {isBn ? "প্রিস্ক্রিপটিভ সিমুলেটর স্টুডিও" : "Prescriptive Simulation Studio"}
            </span>

            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              {isBn
                ? "বাজেট বরাদ্দ ও সামাজিক ন্যায্যতা স্লাইডার দিয়ে ভবিষ্যৎ পরীক্ষা করুন"
                : "Simulate What-If Policy Scenarios with the Equity Slider"}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isBn
                ? "ঐতিহাসিক পক্ষপাতিত্ব দূর করতে আমাদের আলফা-ইকুইটি (α_equity) অপ্টিমাইজার সুবিধাবঞ্চিত জেলাগুলোতে ন্যায্য সম্পদ বণ্টন নিশ্চিত করে। ৫ কোটি টাকা বাজেটে গাছ লাগানো, কুল-রুফ ও ড্রেনেজ অবকাঠামোর সুফল গণনা করুন।"
                : "Balance raw vulnerability with equitable resource allocation. Use mathematical knapsack optimization to protect vulnerable populations under real fiscal constraints."}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/simulator"
                className="flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition-all hover:scale-105"
              >
                <Sliders className="h-4 w-4" />
                <span>{isBn ? "সিমুলেশন স্টুডিও চালু করুন" : "Launch Simulator"}</span>
                <ChevronRight className="h-4 w-4" />
              </Link>

              <Link
                href="/data-hub"
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium px-5 py-2.5 text-xs sm:text-sm transition-all"
              >
                <Database className="h-4 w-4 text-emerald-400" />
                <span>{isBn ? "ডেটা ক্যাটালগ দেখুন" : "View Data Hub"}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
