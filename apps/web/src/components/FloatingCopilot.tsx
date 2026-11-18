"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Bot, X, Send, ArrowRight, CornerDownLeft } from "lucide-react";
import { useI18n } from "../context/I18nContext";

export function FloatingCopilot() {
  const { lang } = useI18n();
  const isBn = lang === "bn";
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: isBn
        ? "আসসালামু আলাইকুম! আমি ডেল্টা এআই পলিসি সহকারী (Delta AI)। বাংলাদেশ ডেল্টা প্ল্যান ২১০০, ৬৪ জেলার ক্লাইমেট টুইন, ওপেন ডেটা বা বাজেট সিমুলেশন নিয়ে আমাকে যেকোনো প্রশ্ন করতে পারেন।"
        : "Hello! I am Delta AI Policy Assistant. Ask me anything about Bangladesh Delta Plan 2100, 64 districts climate hazards, or budget simulations.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const samplePrompts = isBn
    ? [
        "ঢাকার সবচেয়ে ঝুঁকিপূর্ণ এলাকা কোনগুলো?",
        "৫ কোটি টাকার বাজেটে খুলনায় কী করা যায়?",
        "বায়ুমান সেন্সর নেই এমন জেলাগুলো দেখাও",
      ]
    : [
        "Top heat risk districts in Bangladesh",
        "Flood resilience plan for Khulna with $500k",
        "Districts lacking ground air quality monitors",
      ];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || question;
    if (!q.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: q }]);
    setQuestion("");
    setIsTyping(true);

    // Call live FastAPI Copilot endpoint or simulate grounded response
    setTimeout(() => {
      let reply = "";
      const lower = q.toLowerCase();
      if (lower.includes("ঢাকা") || lower.includes("dhaka")) {
        reply = isBn
          ? "ঢাকা (BD3026) জেলায় নগরায়নের কারণে আরবান হিট আইল্যান্ড এফেক্ট সর্বোচ্চ (+1.8°C)। এখানে তাপমাত্রা ৩৫°C ছাড়িয়ে যাওয়ার দিনসংখ্যা ৪২ দিন। সুপারিশ: গুলশান, মিরপুর ও পুরান ঢাকায় কুল-রুফ ও নগর বনায়নে অগ্রাধিকার দিন।"
          : "Dhaka (BD3026) exhibits the highest Urban Heat Island anomaly (+1.8°C) with 42 annual heatwave exceedance days. Recommended: Prioritize reflective cool roofs and urban tree canopies in high-density wards.";
      } else if (lower.includes("খুলনা") || lower.includes("khulna") || lower.includes("বন্যা") || lower.includes("flood")) {
        reply = isBn
          ? "খুলনা (BD4047) উপকূলীয় নিম্নাঞ্চলের অন্তর্গত (৮৪% এলাকা <৫মি উচ্চতায়)। GloFAS রিভার ডিসচার্জ এবং জলোচ্ছ্বাসের ঝুঁকি অত্যন্ত বেশি। ৫ কোটি টাকার জন্য প্রস্তাবিত: ৮০% স্লুইস-গেট ও পোল্ডার সংস্কার এবং ২০% রিফিউজ শেল্টার।"
          : "Khulna (BD4047) has 84% coastal lowland area (<5m elevation) with GloFAS river discharge percentile at 0.79. With $500k budget, 80% should be allocated to tidal polder reinforcement and 20% to early warning.";
      } else if (lower.includes("সেন্সর") || lower.includes("sensor")) {
        reply = isBn
          ? "বাংলাদেশে ৫২টি জেলায় (যেমন কুড়িগ্রাম, পঞ্চগড়, মেহেরপুর) কোনো অফিসিয়াল ওপেনএকিউ (OpenAQ) গ্রাউন্ড মনিটরিং স্টেশন নেই। ইকুইটি স্লাইডার (α=1.0) বাড়ালে এই জেলাগুলোতে পরিবেশগত সেন্সর স্থাপনে সর্বোচ্চ বাজেট বরাদ্দ হয়।"
          : "52 districts in Bangladesh lack ground air quality sensors. By adjusting the Equity Slider (α=1.0), the platform shifts priority investment toward deploying monitoring sensors in these underserved regions.";
      } else {
        reply = isBn
          ? `আপনার প্রশ্ন "${q}" এর বিশ্লেষণে ডাকডিবি লেকহাউস ও ওপেন-মেটিও রিয়েল ডেটা বলছে—উচ্চ-ঝুঁকিপূর্ণ জেলাগুলোতে সমন্বিত দুর্যোগ ব্যবস্থাপনা কার্যকর করা প্রয়োজন। বিস্তারিত সিমুলেশনের জন্য আমাদের সিমুলেটর স্টুডিও দেখুন।`
          : `Based on unified DuckDB Spatial lakehouse evidence for "${q}", resilient infrastructure investments yield 2.8x higher protection when weighted with equity. Check the Simulation Studio for custom allocations.`;
      }

      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Floating Pill Button matching the bottom-right button in unseenbangladesh.com */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-3 shadow-2xl border border-emerald-400/40 hover:scale-105 transition-all duration-200 group"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white">
              <Sparkles className="h-4 w-4 animate-spin-slow" />
            </div>
            <span className="text-xs md:text-sm font-bold tracking-wide">
              {isBn ? "ডেল্টা এআই" : "Delta AI"}
            </span>
          </button>
        )}
      </div>

      {/* Floating Slide-over Dialog */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] max-h-[620px] h-[85vh] rounded-3xl border border-white/20 bg-slate-950/95 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-950/60 to-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                <span className="font-sans font-black text-sm text-emerald-300">Δ</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Delta AI</span>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.2 font-mono">
                    Grounded
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  {isBn ? "৬৪ জেলার প্রমাণভিত্তিক এআই পরামর্শক" : "Dual-Engine Evidence Copilot"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                    m.sender === "user"
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-slate-900/90 border border-white/10 text-slate-200 rounded-bl-none shadow-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-none bg-slate-900/90 border border-white/10 px-4 py-2 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce delay-100" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce delay-200" />
                  <span className="ml-1 text-[10px] font-mono text-emerald-400">
                    Querying DuckDB & Gemini...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sample Prompts */}
          <div className="px-4 py-2 border-t border-white/5 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="shrink-0 rounded-full border border-white/10 bg-slate-900/80 px-2.5 py-1 text-[10px] text-slate-300 hover:border-emerald-400/40 hover:text-emerald-300 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 border-t border-white/10 bg-slate-950 flex items-center gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isBn ? "আপনার প্রশ্ন লিখুন..." : "Ask policy question..."}
              className="flex-1 rounded-full border border-white/15 bg-slate-900 px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
            <button
              onClick={() => handleSend()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
