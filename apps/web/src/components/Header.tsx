"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe2,
  Sliders,
  Database,
  Bot,
  CheckCircle2,
  Shield,
  Activity,
  ChevronDown,
  User,
  Check,
  Menu,
  X,
  Flame,
  Waves,
  Wind,
  Mountain,
  Sparkles,
} from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { useAuth, UserRole } from "../context/AuthContext";
import { api } from "../lib/api";
import type { MetricType } from "./Map/MapCanvas";

export function Header() {
  const pathname = usePathname();
  const { lang, toggleLang, setLang, t } = useI18n();
  const { role, setRole } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getHealth()
      .then(() => {
        if (mounted) setBackendOnline(true);
      })
      .catch(() => {
        if (mounted) setBackendOnline(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setRoleMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const rolesList: { id: UserRole; title: string; badge: string; desc: string }[] = [
    {
      id: "Public_Portal",
      title: t("roles.Public_Portal.title"),
      badge: t("roles.Public_Portal.badge"),
      desc: t("roles.Public_Portal.desc"),
    },
    {
      id: "Municipal_Analyst",
      title: t("roles.Municipal_Analyst.title"),
      badge: t("roles.Municipal_Analyst.badge"),
      desc: t("roles.Municipal_Analyst.desc"),
    },
    {
      id: "Policy_Reviewer",
      title: t("roles.Policy_Reviewer.title"),
      badge: t("roles.Policy_Reviewer.badge"),
      desc: t("roles.Policy_Reviewer.desc"),
    },
    {
      id: "System_Admin",
      title: t("roles.System_Admin.title"),
      badge: t("roles.System_Admin.badge"),
      desc: t("roles.System_Admin.desc"),
    },
  ];

  const mapSubItems: {
    metric: MetricType;
    href: string;
    label: string;
    sublabel: string;
    icon: any;
  }[] = [
    {
      metric: "heat_anomaly",
      href: "/#map-section?metric=heat",
      label: lang === "bn" ? "হিটওয়েভ ও তাপমাত্রা" : "Urban Heat Island",
      sublabel: lang === "bn" ? "ERA5 তাপদাহ অ্যানোমালি" : "ERA5 2m Anomaly",
      icon: Flame,
    },
    {
      metric: "flood_discharge",
      href: "/#map-section?metric=flood",
      label: lang === "bn" ? "বন্যা ও নদীপ্রবাহ" : "GloFAS Flood Discharge",
      sublabel: lang === "bn" ? "নদী প্রবাহ পিক" : "River Flow Peak",
      icon: Waves,
    },
    {
      metric: "sensor_scarcity",
      href: "/#map-section?metric=pm25",
      label: lang === "bn" ? "বায়ুমান (PM2.5)" : "OpenAQ Air Quality",
      sublabel: lang === "bn" ? "গ্রাউন্ড স্টেশন ঘাটতি" : "Station Equity Audit",
      icon: Wind,
    },
    {
      metric: "elevation",
      href: "/#map-section?metric=elevation",
      label: lang === "bn" ? "উপকূলীয় উচ্চতা" : "Copernicus DEM",
      sublabel: lang === "bn" ? "<৫মি প্লাবন সমভূমি" : "Lowland Elevation",
      icon: Mountain,
    },
  ];

  const handleMapMetricSelect = (e: React.MouseEvent, item: (typeof mapSubItems)[0]) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);

    if (pathname === "/") {
      e.preventDefault();
      // Dispatch custom event to trigger reactive metric change in page.tsx
      window.dispatchEvent(new CustomEvent("select-map-metric", { detail: item.metric }));
      window.history.replaceState(null, "", item.href);

      // Smooth scroll to the live map section
      const mapEl = document.getElementById("map-section");
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.replaceState(null, "", "/");
    }
  };

  const handleSimSelect = (e: React.MouseEvent, href: string) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);

    if (href.includes("#") && pathname === href.split("#")[0]) {
      e.preventDefault();
      const id = href.split("#")[1];
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", href);
      }
    }
  };

  const simulationSubItems = [
    { href: "/simulator", label: lang === "bn" ? "বাজেট সিমুলেটর (What-If)" : "What-If Budget Simulator", icon: Sliders },
    { href: "/simulator#equity", label: lang === "bn" ? "ইকুইটি স্লাইডার (α_equity)" : "Equity Optimization Slider", icon: Sparkles },
    { href: "/outcomes", label: lang === "bn" ? "ফলাফল ট্র্যাকার" : "Policy Outcomes Tracker", icon: CheckCircle2 },
  ];

  const governanceSubItems = [
    { href: "/governance", label: lang === "bn" ? "অডিট ও প্রমাণাধিকার" : "Audit & Provenance", icon: Shield },
    { href: "/copilot", label: lang === "bn" ? "পলিসি কো-পাইলট (AI)" : "AI Policy Copilot", icon: Bot },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 md:px-8 pt-3 md:pt-4 pointer-events-none font-sans">
      <div
        ref={dropdownRef}
        className="pointer-events-auto mx-auto max-w-7xl glass-capsule rounded-full px-4 md:px-6 py-2.5 flex items-center justify-between transition-all duration-300 shadow-2xl border border-white/15 bg-slate-950/80 backdrop-blur-xl"
      >
        {/* Left: Brand Emblem & Title */}
        <Link href="/" onClick={handleHomeClick} className="flex items-center gap-2.5 md:gap-3 group shrink-0">
          <div className="relative flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-2xl bg-slate-900/90 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200 border border-emerald-400/40 overflow-hidden ring-1 ring-white/10">
            <img
              src="/delta-emblem-badge.png"
              alt="Delta AI Logo"
              className="h-full w-full object-contain rounded-xl"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg md:text-xl font-extrabold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
              Delta
            </span>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] md:text-xs font-bold text-emerald-300">
              AI
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Pills matching unseenbangladesh.com style */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {/* 1. Home */}
          <Link
            href="/"
            onClick={handleHomeClick}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              pathname === "/" && !activeDropdown
                ? "bg-white text-slate-900 shadow-md font-semibold"
                : "text-slate-200 hover:text-white hover:bg-white/10"
            }`}
          >
            {lang === "bn" ? "হোম" : "Home"}
          </Link>

          {/* 2. Map Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "map" ? null : "map")}
              className={`flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeDropdown === "map"
                  ? "bg-white/20 text-white font-semibold"
                  : "text-slate-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>{lang === "bn" ? "ম্যাপ" : "Map"}</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {activeDropdown === "map" && (
              <div className="absolute left-0 mt-3 w-60 rounded-2xl border border-white/15 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {lang === "bn" ? "স্থানিক লেয়ারসমূহ" : "Spatial Layers"}
                </div>
                {mapSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={(e) => handleMapMetricSelect(e, sub)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors group"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/80 group-hover:bg-emerald-500/30 text-emerald-400 transition-colors shrink-0">
                        <SubIcon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-100 group-hover:text-emerald-300">
                          {sub.label}
                        </span>
                        <span className="text-[10px] text-slate-400 group-hover:text-emerald-400/80 font-mono">
                          {sub.sublabel}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Simulation Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "sim" ? null : "sim")}
              className={`flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                pathname.startsWith("/simulator") || activeDropdown === "sim"
                  ? "bg-white/20 text-white font-semibold"
                  : "text-slate-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>{lang === "bn" ? "সিমুলেশন" : "Simulation"}</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {activeDropdown === "sim" && (
              <div className="absolute left-0 mt-3 w-60 rounded-2xl border border-white/15 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {lang === "bn" ? "নীতিমালা ও অপ্টিমাইজেশন" : "Policy & Optimization"}
                </div>
                {simulationSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={(e) => handleSimSelect(e, sub.href)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
                    >
                      <SubIcon className="h-4 w-4 text-emerald-400" />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Data Hub */}
          <Link
            href="/data-hub"
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              pathname === "/data-hub"
                ? "bg-white text-slate-900 shadow-md font-semibold"
                : "text-slate-200 hover:text-white hover:bg-white/10"
            }`}
          >
            {lang === "bn" ? "ডেটা হাব" : "Data Hub"}
          </Link>

          {/* 5. Governance & AI */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "gov" ? null : "gov")}
              className={`flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                pathname === "/governance" || pathname === "/copilot" || activeDropdown === "gov"
                  ? "bg-white/20 text-white font-semibold"
                  : "text-slate-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>{lang === "bn" ? "অডিট ও নীতি" : "Governance"}</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {activeDropdown === "gov" && (
              <div className="absolute left-0 mt-3 w-56 rounded-2xl border border-white/15 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                {governanceSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
                    >
                      <SubIcon className="h-4 w-4 text-emerald-400" />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. NRB Fellowship / Outcomes */}
          <Link
            href="/outcomes"
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              pathname === "/outcomes"
                ? "bg-white text-slate-900 shadow-md font-semibold"
                : "text-slate-200 hover:text-white hover:bg-white/10"
            }`}
          >
            {lang === "bn" ? "ফলাফল" : "Outcomes"}
          </Link>
        </nav>

        {/* Right: Language Pill Switcher & Profile/Role Pill Button */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Status Dot */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-700/60 text-[11px] text-slate-300"
            title={backendOnline ? "FastAPI Lakehouse Online" : "FastAPI Disconnected"}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                backendOnline ? "bg-emerald-400 animate-pulse" : "bg-red-400"
              }`}
            />
            <span className="font-mono text-[10px] hidden md:inline">
              {backendOnline ? "LIVE" : "OFFLINE"}
            </span>
          </div>

          {/* Language Switcher Pill matching unseenbangladesh: "বাং | EN" */}
          <div className="flex items-center bg-slate-900/80 border border-slate-700/80 rounded-full p-0.5 shadow-inner">
            <button
              onClick={() => setLang("bn")}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
                lang === "bn"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              বাং
            </button>
            <button
              onClick={() => setLang("en")}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
                lang === "en"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              EN
            </button>
          </div>

          {/* Role / Profile Pill Button */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition-all shadow-sm hover:border-emerald-500/40"
              title="Select Role (RBAC)"
            >
              <User className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">
                {lang === "bn" ? t(`roles.${role}.badge`) : role.replace("_", " ")}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {/* Role Switcher Dropdown */}
            {roleMenuOpen && (
              <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-white/15 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-bold text-white">
                    {lang === "bn" ? "ব্যবহারকারীর ভূমিকা (RBAC)" : "Select Access Role"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {lang === "bn"
                      ? "স্বয়ংক্রিয় ব্যাকএন্ড JWT টোকেন ইনজেকশন কার্যকর"
                      : "Cryptographically signed JWT bearer tokens"}
                  </p>
                </div>

                <div className="space-y-1">
                  {rolesList.map((r) => {
                    const isSelected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          setRole(r.id);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 rounded-xl px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                            : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                        }`}
                      >
                        <div className="mt-0.5">
                          {isSelected ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border border-slate-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">{r.title}</span>
                            <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400">
                              {r.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            {r.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 text-slate-200 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto lg:hidden mx-auto mt-2 max-w-sm rounded-3xl border border-white/15 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-2xl">
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={handleHomeClick}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <Globe2 className="h-4 w-4 text-emerald-400" />
              <span>{lang === "bn" ? "হোম ও ম্যাপ" : "Home & Map"}</span>
            </Link>

            {/* Mobile Spatial Layers */}
            <div className="flex flex-col gap-1 rounded-2xl bg-slate-900/60 p-2 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 pt-1">
                {lang === "bn" ? "স্থানিক লেয়ারসমূহ" : "Spatial Layers"}
              </span>
              {mapSubItems.map((sub) => {
                const SubIcon = sub.icon;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={(e) => handleMapMetricSelect(e, sub)}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <SubIcon className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{sub.label}</span>
                  </Link>
                );
              })}
            </div>
            <Link
              href="/simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <Sliders className="h-4 w-4 text-emerald-400" />
              <span>{lang === "bn" ? "সিমুলেশন স্টুডিও" : "Simulation Studio"}</span>
            </Link>
            <Link
              href="/data-hub"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <Database className="h-4 w-4 text-emerald-400" />
              <span>{lang === "bn" ? "ডেটা হাব" : "Data Hub"}</span>
            </Link>
            <Link
              href="/copilot"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <Bot className="h-4 w-4 text-emerald-400" />
              <span>{lang === "bn" ? "পলিসি কো-পাইলট" : "Policy Copilot"}</span>
            </Link>
            <Link
              href="/governance"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>{lang === "bn" ? "অডিট ও নীতিমালা" : "Governance"}</span>
            </Link>
            <Link
              href="/outcomes"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{lang === "bn" ? "ফলাফল ট্র্যাকার" : "Outcomes Tracker"}</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
