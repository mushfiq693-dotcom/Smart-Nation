"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  User,
  Shield,
  Layers,
  Sparkles,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  content: string;
  toolExecuted?: string;
  toolArgs?: any;
  citations?: any[];
  securityFlag?: string;
  latencyMs?: number;
  timestamp: string;
}

export default function CopilotPage() {
  const { lang, t } = useI18n();
  const { role, token } = useAuth();
  const isBn = lang === "bn";

  const [inputQuery, setInputQuery] = useState("");
  const [selectedPcode, setSelectedPcode] = useState("");
  const [districtsList, setDistrictsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "copilot",
      content: isBn
        ? "আসসালামু আলাইকুম! আমি সিভিকস্ফেয়ার এআই এর গ্রাউন্ডেড পলিসি কোপাইলট (AI Policy Copilot)। আমি ডাকডিবি স্থানিক লেকহাউস, এক্সজিবুস্ট-শ্যাপ ঝুঁকি মডেল এবং জাতীয় অভিযোজন পরিকল্পনা (NAP) ও মুজিব ক্লাইমেট প্ল্যান ২০৩০ থেকে সুনির্দিষ্ট তথ্য সরবরাহ করতে পারি। আপনি কীভাবে সহায়তা চান?"
        : "Welcome to CivicSphere AI Grounded Policy Copilot. I execute deterministic tool calls against our spatial lakehouse, XGBoost SHAP attribution models, and the official National Adaptation Plan (NAP 2023) corpus. How can I assist your policy inquiry?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Load districts list for context selector
  useEffect(() => {
    api
      .getRegions({ level: "adm2", limit: 64 })
      .then((data) => setDistrictsList(data.records || []))
      .catch(() => {});
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = isBn
    ? [
        { label: "ঢাকার তাপদাহ সূচক ও প্রধান শ্যাপ প্রভাবক কী?", query: "ঢাকার তাপদাহ সূচক ও প্রধান শ্যাপ প্রভাবক কী?" },
        { label: "কুড়িগ্রামের সেন্সর ঘাটতি ও বরাদ্দ প্রভাব বিশ্লেষণ", query: "কুড়িগ্রামে কি সেন্সর ঘাটতি আছে এবং সমতা মডেলে বরাদ্দ কীভাবে নির্ধারিত হয়?" },
        { label: "সুনামগঞ্জ বনাম সিলেটের বন্যা ঝুঁকি তুলনা করুন", query: "সুনামগঞ্জ ও সিলেট জেলার নদী প্রবাহ ও আকস্মিক বন্যা ঝুঁকি তুলনা করুন।" },
        { label: "নগর তাপদ্বীপ নিয়ন্ত্রণে জাতীয় নীতি নির্দেশিকা", query: "নগর তাপদ্বীপ ও তাপদাহ প্রশমনে জাতীয় অভিযোজন পরিকল্পনার মূল নির্দেশনা কী?" },
      ]
    : [
        { label: "Dhaka heatwave & top SHAP driver", query: "What is Dhaka's heatwave anomaly and top SHAP hazard driver?" },
        { label: "Kurigram sensor gap & equity allocation", query: "Explain the sensor scarcity status and equity funding for Kurigram." },
        { label: "Compare flood risk: Sunamganj vs Sylhet", query: "Compare the river discharge and flash flood risk between Sunamganj and Sylhet." },
        { label: "NAP guidelines for urban heat mitigation", query: "What are the official NAP 2023 guidelines for urban heat island mitigation?" },
      ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await api.queryCopilot(
        {
          query: query,
          target_pcode: selectedPcode || undefined,
          lang: lang,
        },
        token
      );

      const copilotMsg: ChatMessage = {
        id: res.query_id || `copilot-${Date.now()}`,
        sender: "copilot",
        content: res.answer,
        toolExecuted: res.tool_executed,
        toolArgs: res.tool_arguments,
        citations: res.citations,
        securityFlag: res.security_flag,
        latencyMs: res.execution_latency_ms,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: "copilot",
          content: isBn
            ? `দুঃখিত, অনুরোধটি প্রক্রিয়াকরণে সমস্যা হয়েছে: ${err.message}`
            : `Unable to process query: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-8 pt-24 md:pt-28 pb-16 space-y-6 font-sans">
      {/* Copilot Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-cyan-500/30 bg-cyan-950/60 px-2 py-0.5 text-xs font-semibold text-cyan-300 font-mono">
              Grounded Tool-Calling RAG
            </span>
            <span className="text-slate-500">&middot;</span>
            <span className="text-xs text-emerald-400 font-mono">Prompt-Injection Defended</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2.5">
            <Bot className="h-7 w-7 text-cyan-400" />
            <span>{isBn ? "এআই পলিসি কোপাইলট (AI Policy Copilot)" : "Grounded AI Policy Copilot"}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {isBn
              ? "পাইথোনিক টুল-কলিং ও স্থানিক লেকহাউস কুয়েরি চালিত সহায়ক। শতভাগ প্রমাণভিত্তিক উত্তর এবং জাতীয় অভিযোজন পরিকল্পনা (NAP) ও মুজিব প্ল্যানের সরাসরি সাইটেশন প্রদান করে।"
              : "Strict Pydantic tool-calling assistant executing DuckDB Spatial analytics, XGBoost SHAP attributions, and BM25 official policy retrieval with structured citation badges."}
          </p>
        </div>

        {/* Optional Context P-code Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 shadow-sm text-xs">
          <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400 text-[11px] whitespace-nowrap">
            {isBn ? "প্রাসঙ্গিক জেলা:" : "Target District:"}
          </span>
          <select
            value={selectedPcode}
            onChange={(e) => setSelectedPcode(e.target.value)}
            className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-mono"
          >
            <option value="" className="bg-slate-900 text-slate-400">
              {isBn ? "সকল জেলা (National)" : "All Districts (National)"}
            </option>
            {districtsList.map((d) => (
              <option key={d.adm2_pcode} value={d.adm2_pcode} className="bg-slate-900 text-slate-200">
                {isBn ? d.adm2_bn || d.adm2_en : d.adm2_en} ({d.adm2_pcode})
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Main Chat Thread Container */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-xl flex flex-col h-[600px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "copilot" && (
                <div className="h-8 w-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] md:max-w-2xl rounded-2xl p-4 space-y-2.5 ${
                  m.sender === "user"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                    : "bg-slate-950 border border-slate-800 text-slate-200 shadow-md"
                }`}
              >
                {/* Copilot Tool Execution Badge */}
                {m.toolExecuted && m.toolExecuted !== "none" && (
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-2">
                    <span className="flex items-center gap-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-0.5 text-[10px] text-cyan-300 font-mono">
                      <Activity className="h-3 w-3" />
                      <span>tool: {m.toolExecuted}</span>
                    </span>
                    {m.latencyMs && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {m.latencyMs.toFixed(1)}ms execution
                      </span>
                    )}
                  </div>
                )}

                {/* Prompt Injection Defense Triggered Alert */}
                {m.securityFlag === "PROMPT_INJECTION_DEFENSE_TRIGGERED" && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-950/50 border border-amber-500/50 p-2.5 text-xs text-amber-200">
                    <Shield className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="font-semibold text-[11px]">
                      {isBn
                        ? "নিরাপত্তা নীতি সতর্কতা: প্রম্পট-ইনজেকশন বা ক্ষতিকারক নির্দেশ প্রতিহত করা হয়েছে।"
                        : "Security Defense Triggered: Adversarial prompt instruction successfully neutralized."}
                    </span>
                  </div>
                )}

                {/* Message Body */}
                <div className="text-xs leading-relaxed whitespace-pre-line font-sans">
                  {m.content}
                </div>

                {/* Grounded Citation Cards */}
                {m.citations && m.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-cyan-400 block">
                      {isBn ? "উদ্ধৃত নীতি নির্দেশিকা (Policy Citations):" : "Verified Policy Citations:"}
                    </span>
                    <div className="grid gap-2">
                      {m.citations.map((c: any, cIdx: number) => (
                        <div
                          key={cIdx}
                          className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-[11px] text-slate-300 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{c.document_title}</span>
                            <span className="text-[10px] text-cyan-400 font-mono">{c.section}</span>
                          </div>
                          <p className="text-slate-400 italic">"{c.excerpt}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-500 text-right font-mono">{m.timestamp}</div>
              </div>

              {m.sender === "user" && (
                <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center text-slate-400 text-xs">
              <div className="h-8 w-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Bot className="h-4 w-4 animate-pulse" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-950 border border-slate-800 px-4 py-2.5">
                <RefreshCw className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                <span className="font-mono text-[11px]">
                  {isBn ? "স্থানিক লেকহাউস ও পলিসি রিট্রিভার কুয়েরি চলছে..." : "Executing grounded tool query..."}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="border-t border-slate-800/80 bg-slate-950/40 px-4 py-2 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-medium shrink-0">
            {isBn ? "পরামর্শ:" : "Suggestions:"}
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.query)}
              className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors whitespace-nowrap"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-800 bg-slate-950 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                isBn
                  ? "যেকোনো জেলা, তাপদাহ, প্লাবন বা নীতি নির্দেশিকা সম্পর্কিত প্রশ্ন লিখুন..."
                  : "Ask about climate risk, heat anomalies, river flood discharge, or NAP guidelines..."
              }
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-950/50 hover:from-cyan-400 hover:to-teal-500 disabled:opacity-50 transition-all shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
