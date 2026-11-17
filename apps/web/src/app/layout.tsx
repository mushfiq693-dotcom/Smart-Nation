import type { Metadata } from "next";
import { Hind_Siliguri, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "../context/I18nContext";
import { AuthProvider } from "../context/AuthContext";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FloatingCopilot } from "../components/FloatingCopilot";

const hindSiliguri = Hind_Siliguri({
  weight: ["400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
  variable: "--font-bengali",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CivicSphere AI | ClimAct Twin Bangladesh",
  description:
    "Grounded geospatial spatial intelligence, classical ML hazard risk scoring, explainable SHAP drivers, and policy simulation for Bangladesh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`dark ${hindSiliguri.variable} ${plusJakartaSans.variable}`}>
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300">
        <I18nProvider>
          <AuthProvider>
            <Header />
            <div className="flex-1 w-full">{children}</div>
            <FloatingCopilot />
            <Footer />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
