"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import enDict from "../i18n/en.json";
import bnDict from "../i18n/bn.json";

export type Language = "en" | "bn";

interface I18nContextType {
  lang: Language;
  toggleLang: () => void;
  setLang: (lang: Language) => void;
  t: (path: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("bn");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("civicsphere_lang") as Language;
      if (saved === "en" || saved === "bn") {
        setLangState(saved);
      }
    } catch {
      // Ignore localStorage read errors in SSR/strict envs
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("civicsphere_lang", newLang);
    } catch {
      // Ignore
    }
  };

  const toggleLang = () => {
    setLang(lang === "en" ? "bn" : "en");
  };

  const t = (path: string, fallback?: string): string => {
    const dict = lang === "bn" ? bnDict : enDict;
    const parts = path.split(".");
    let current: any = dict;

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return fallback || path;
      }
    }

    if (typeof current === "string") {
      return current;
    }
    return fallback || path;
  };

  return (
    <I18nContext.Provider value={{ lang, toggleLang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
