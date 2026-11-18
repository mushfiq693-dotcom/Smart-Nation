"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Bot, X, Send, ArrowRight, CornerDownLeft } from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { generateChatbotResponse } from "../lib/chatbotEngine";

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

    setTimeout(() => {
      const reply = generateChatbotResponse(q, lang);
      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
      setIsTyping(false);
    }, 400);
  };

  return (
    <>
      {/* Floating Pill Button matching the bottom-right button in unseenbangladesh.com */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white pl-2 pr-5 py-2 shadow-2xl border border-emerald-400/40 hover:scale-105 transition-all duration-200 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/90 border border-emerald-400/40 overflow-hidden p-0.5 shadow-sm">
              <img src="/delta-emblem-badge.png" alt="Delta AI" className="h-full w-full object-contain" />
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
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 border border-emerald-400/40 overflow-hidden p-0.5 shadow-sm">
                <img src="/delta-emblem-badge.png" alt="Delta AI" className="h-full w-full object-contain" />
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
