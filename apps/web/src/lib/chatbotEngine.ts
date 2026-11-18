/**
 * CivicSphere AI & ClimAct Twin — Intelligent Grounded Copilot Engine
 * Handles natural language queries across all 64 districts, divisions, Dhaka micro-zones,
 * hazard domains, mathematical budget simulation, and governance audits.
 * Enforces strict out-of-scope boundaries when queries deviate from climate and GovTech.
 */

import districtsData from "./districts_data.json";
import dhakaZonesData from "./dhaka_zones_data.json";

export interface DistrictData {
  adm2_pcode: string;
  adm2_en: string;
  adm2_bn: string;
  adm1_pcode: string;
  population: number;
  apparent_temp_anomaly_c: number;
  glofas_p75_discharge: number;
  elevation_mean_m: number;
  coastal_lowland_ratio: number;
  poverty_headcount_pct: number;
  pop_density_per_sqkm: number;
  built_up_ratio: number;
  green_water_ratio: number;
  v_i: number;
  has_ground_aq_station: boolean;
}

export interface DhakaZoneData {
  zone_id: string;
  zone_no: string;
  corporation: string;
  name_en: string;
  name_bn: string;
  short_bn: string;
  short_en: string;
  population: number;
  area_sqkm: number;
  uhi_anomaly_c: number;
  waterlogging_risk_pct: number;
  pm25_exposure_ug_m3: number;
  green_canopy_ratio: number;
  built_up_ratio: number;
  poverty_headcount_pct: number;
  elevation_mean_m: number;
  v_i: number;
  key_hazards: string[];
}

const typedDistricts = districtsData as DistrictData[];
const typedDhakaZones = dhakaZonesData as DhakaZoneData[];

// Division lookup
const DIVISIONS: Record<string, { bn: string; en: string; districts: string[] }> = {
  barishal: {
    bn: "বরিশাল বিভাগ",
    en: "Barishal Division",
    districts: ["বরগুনা", "বরিশাল", "ভোলা", "ঝালকাঠি", "পটুয়াখালী", "পিরোজপুর"],
  },
  chittagong: {
    bn: "চট্টগ্রাম বিভাগ",
    en: "Chittagong Division",
    districts: ["বান্দরবান", "ব্রাহ্মণবাড়িয়া", "চাঁদপুর", "চট্টগ্রাম", "কুমিল্লা", "কক্সবাজার", "ফেনী", "খাগড়াছড়ি", "লক্ষ্মীপুর", "নোয়াখালী", "রাঙ্গামাটি"],
  },
  dhaka: {
    bn: "ঢাকা বিভাগ",
    en: "Dhaka Division",
    districts: ["ঢাকা", "ফরিদপুর", "গাজীপুর", "গোপালগঞ্জ", "কিশোরগঞ্জ", "মাদারীপুর", "মানিকগঞ্জ", "মুন্সীগঞ্জ", "নারায়ণগঞ্জ", "নরসিংদী", "রাজবাড়ী", "শরীয়তপুর", "টাঙ্গাইল"],
  },
  khulna: {
    bn: "খুলনা বিভাগ",
    en: "Khulna Division",
    districts: ["বাগেরহাট", "চুয়াডাঙ্গা", "যশোর", "ঝিনাইদহ", "খুলনা", "কুষ্টিয়া", "মাগুরা", "মেহেরপুর", "নড়াইল", "সাতক্ষীরা"],
  },
  mymensingh: {
    bn: "ময়মনসিংহ বিভাগ",
    en: "Mymensingh Division",
    districts: ["জামালপুর", "ময়মনসিংহ", "নেত্রকোণা", "শেরপুর"],
  },
  rajshahi: {
    bn: "রাজশাহী বিভাগ",
    en: "Rajshahi Division",
    districts: ["বগুড়া", "জয়পুরহাট", "নওগাঁ", "নাটোর", "চাঁপাইনবাবগঞ্জ", "পাবনা", "রাজশাহী", "সিরাজগঞ্জ"],
  },
  rangpur: {
    bn: "রংপুর বিভাগ",
    en: "Rangpur Division",
    districts: ["দিনাজপুর", "গাইবান্ধা", "কুড়িগ্রাম", "লালমনিরহাট", "নীলফামারী", "পঞ্চগড়", "রংপুর", "ঠাকুরগাঁও"],
  },
  sylhet: {
    bn: "সিলেট বিভাগ",
    en: "Sylhet Division",
    districts: ["হবিগঞ্জ", "মৌলভীবাজার", "সুনামগঞ্জ", "সিলেট"],
  },
};

/**
 * Normalizes query string for robust fuzzy matching
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[?,।!–—\-_:;'"()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Searches for a matched district across all 64 districts in Bangladesh
 */
function findDistrict(query: string): DistrictData | null {
  const norm = normalize(query);
  for (const d of typedDistricts) {
    const enName = d.adm2_en.toLowerCase();
    const bnName = d.adm2_bn;
    const pcode = d.adm2_pcode.toLowerCase();

    // Check exact or substring containment
    if (
      norm.includes(enName) ||
      norm.includes(bnName) ||
      norm.includes(pcode)
    ) {
      return d;
    }

    // Common phonetic variations
    if (enName === "chattogram" && norm.includes("chittagong")) return d;
    if (enName === "cox's bazar" && (norm.includes("cox") || norm.includes("কক্সবাজার"))) return d;
    if (enName === "brahmanbaria" && (norm.includes("b-baria") || norm.includes("ব্রাহ্মণবাড়িয়া"))) return d;
    if (enName === "chapainawabganj" && (norm.includes("nawabganj") || norm.includes("চাঁপাইনবাবগঞ্জ"))) return d;
    if (enName === "kurigram" && (norm.includes("কুড়িগ্রাম") || norm.includes("কুড়িগ্রাম"))) return d;
  }
  return null;
}

/**
 * Searches for a Dhaka municipal micro-zone (DNCC / DSCC)
 */
function findDhakaZone(query: string): DhakaZoneData | null {
  const norm = normalize(query);
  for (const z of typedDhakaZones) {
    if (
      norm.includes(z.short_en.toLowerCase()) ||
      norm.includes(z.short_bn) ||
      norm.includes(z.name_en.toLowerCase()) ||
      norm.includes(z.name_bn)
    ) {
      return z;
    }
  }
  // Secondary zone keywords
  if (norm.includes("মিরপুর") || norm.includes("mirpur") || norm.includes("কল্যাণপুর") || norm.includes("kallyanpur")) {
    return typedDhakaZones.find((z) => z.zone_id === "DHK_Z08") || null;
  }
  if (norm.includes("পুরান ঢাকা") || norm.includes("old dhaka") || norm.includes("লালবাগ") || norm.includes("lalbagh")) {
    return typedDhakaZones.find((z) => z.zone_id === "DHK_Z03") || null;
  }
  if (norm.includes("কামরাঙ্গীরচর") || norm.includes("kamrangirchar") || norm.includes("বুড়িগঙ্গা")) {
    return typedDhakaZones.find((z) => z.zone_id === "DHK_Z05") || null;
  }
  return null;
}

/**
 * Main Answer Generation Function
 */
export function generateChatbotResponse(query: string, lang: "en" | "bn" = "bn"): string {
  const q = normalize(query);
  const isBn = lang === "bn";

  if (!q) {
    return isBn
      ? "অনুগ্রহ করে আপনার প্রশ্নটি লিখুন। আমি ৬৪ জেলার জলবায়ু ঝুঁকি, বাজেট সিমুলেশন ও নীতি সংক্রান্ত যেকোনো প্রশ্নের উত্তর দিতে প্রস্তুত।"
      : "Please enter your question. I am ready to answer queries regarding 64-district climate risks, budget simulation, and policy directives.";
  }

  // 1. GREETINGS & INTRODUCTIONS
  const isGreeting = /^(hi|hello|hey|salam|assalamu|হাই|হ্যালো|সালাম|আসসালামু|নমস্কার|কেমন আছো|কেমন আছেন|how are you|good morning|good evening)$/i.test(
    q
  ) || /^(hi|hello|hey|হাই|হ্যালো)\s+/i.test(q);

  if (isGreeting) {
    return isBn
      ? "হ্যালো! আমি **Delta AI**-এর জলবায়ু নীতি ও ঝুঁকি বিশ্লেষণ সহকারী। আমি আপনাকে ৬৪ জেলার জলবায়ু ঝুঁকি, নদীপ্রবাহ, তাপদাহ, সেন্সর পরিস্থিতি এবং বাজেট বণ্টনের সিমুলেশন সংক্রান্ত তথ্য দিতে পারি। আপনি কোনো নির্দিষ্ট জেলা (যেমন: ঢাকা, খুলনা, কুড়িগ্রাম) বা দুর্যোগ সংক্রান্ত প্রশ্ন করতে পারেন!"
      : "Hello! I am **Delta AI**'s climate policy and risk analytics copilot. I can assist you with 64-district climate hazard data, river discharge, extreme heat, sensor audits, and budget simulation. Ask about a specific district or hazard to begin!";
  }

  // 2. PLATFORM CAPABILITIES & IDENTITY
  if (
    q.includes("তুমি কি") ||
    q.includes("কে তুমি") ||
    q.includes("তোমার কাজ কি") ||
    q.includes("কি করতে পারো") ||
    q.includes("what can you do") ||
    q.includes("who are you") ||
    q.includes("what is delta ai") ||
    q.includes("প্ল্যাটফর্মের কাজ কি") ||
    q.includes("সুবিধা কি")
  ) {
    return isBn
      ? "ডেল্টা এআই (Delta AI) মূলত ৩টি প্রধান ক্ষেত্রে কাজ করে:\n১. **স্থানিক ঝুঁকি বিশ্লেষণ:** ডাকডিবি লেকহাউস ও স্যাটেলাইট উপাত্ত দিয়ে ৬৪ জেলার নদীপ্রবাহ, তাপদাহ ও বায়ুমান ঝুঁকি মূল্যায়ন।\n২. **বাজেট ও নীতি সিমুলেশন:** গাণিতিক সমতা (α_equity) অপটিমাইজার ব্যবহার করে দুর্যোগপ্রবণ অঞ্চলে ন্যায্য বাজেট বণ্টন।\n৩. **দাপ্তরিক নীতি স্মারক:** কেবিনেট ও স্থানীয় সরকারের জন্য মুহূর্তেই প্রমাণভিত্তিক পলিসি মেমো তৈরি।\n\nআপনি যেকোনো জেলার নাম লিখুন বা নিচের সাজেশন বাটনগুলোতে ক্লিক করে পরীক্ষা করুন!"
      : "Delta AI operates across 3 core pillars:\n1. **Spatial Risk Analytics:** Evaluates 64-district river discharge, heatwaves, and air quality using DuckDB Spatial.\n2. **Budget & Policy Simulation:** Algorithmic knapsack optimizer for equitable disaster resilience allocation.\n3. **Institutional Policy Directives:** Instant synthesis of 6-section evidence-grounded cabinet policy memos.\n\nEnter any district name or click the suggestion chips to begin!";
  }

  // 3. GRATITUDE / THANKS
  if (
    q.includes("ধন্যবাদ") ||
    q.includes("thank") ||
    q.includes("thanks") ||
    q.includes("shukriya") ||
    q.includes("শুকরিয়া") ||
    q.includes("অনেক ভালো")
  ) {
    return isBn
      ? "আপনাকেও ধন্যবাদ! বাংলাদেশ বদ্বীপ পরিকল্পনা ২১০০-এর আলোকে যেকোনো ডেটা বা নীতি বিশ্লেষণের প্রয়োজনে আমি সবসময় পাশে আছি।"
      : "You are most welcome! I am always here to assist with climate intelligence and strategic policy simulation under Bangladesh Delta Plan 2100.";
  }

  // 4. DHAKA MUNICIPAL MICRO-ZONES (DNCC & DSCC)
  const matchedDhakaZone = findDhakaZone(q);
  if (matchedDhakaZone) {
    const z = matchedDhakaZone;
    return isBn
      ? `🏙️ **${z.name_bn} (${z.corporation}):**\n- জনসংখ্যা: ${(z.population / 100000).toFixed(1)} লাখ নাগরিক (আয়তন: ${z.area_sqkm} বর্গকিমি)\n- আরবান হিট আইল্যান্ড বিচ্যুতি: +${z.uhi_anomaly_c}°C (গ্রিন ক্যানোপি মাত্র ${(z.green_canopy_ratio * 100).toFixed(0)}%)\n- জলমগ্নতা ও ড্রেনেজ ঝুঁকি: ${z.waterlogging_risk_pct}%\n- বায়ুর মান (PM2.5): ${z.pm25_exposure_ug_m3} µg/m³\n- মূল সমস্যা: ${z.key_hazards.join(", ")}\n\n💡 **সুপারিশ:** ঢাকা আরবান সিমুলেটরে এই জোনে অগ্রাধিকারভিত্তিতে কুল-রুফ কোটিং ও ড্রেনেজ স্লুইস-গেট সংস্কার কর্মসূচি কার্যকর করার নির্দেশনা রয়েছে।`
      : `🏙️ **${z.name_en} (${z.corporation}):**\n- Population: ${(z.population / 1000000).toFixed(2)}M (Area: ${z.area_sqkm} sqkm)\n- Urban Heat Island Anomaly: +${z.uhi_anomaly_c}°C (Green canopy: ${(z.green_canopy_ratio * 100).toFixed(0)}%)\n- Waterlogging Risk: ${z.waterlogging_risk_pct}%\n- Ambient PM2.5: ${z.pm25_exposure_ug_m3} µg/m³\n- Key Hazards: ${z.key_hazards.join(", ")}\n\n💡 **Directive:** Urban simulation prioritizes cool roof thermal coating and drainage channel rehabilitation in this zone.`;
  }

  // 5. SPECIFIC DISTRICT LOOKUP (ALL 64 DISTRICTS DYNAMICALLY)
  const matchedDistrict = findDistrict(q);
  if (matchedDistrict) {
    const d = matchedDistrict;
    const isCoastal = d.coastal_lowland_ratio > 0.4;
    const isHighFlood = d.glofas_p75_discharge > 0.65;
    const isHighHeat = d.apparent_temp_anomaly_c > 3.0;
    const sensorText = d.has_ground_aq_station
      ? (isBn ? "সরকারি গ্রাউন্ড স্টেশন সক্রিয়" : "Active ground regulatory station")
      : (isBn ? "গ্রাউন্ড সেন্সর ঘাটতি চিহ্নিত (V_i পেনাল্টি প্রাপ্ত)" : "Sensor-scarce (Subject to Vi vulnerability penalty)");

    let topAction = "";
    if (isCoastal) {
      topAction = isBn
        ? "উপকূলীয় বাঁধ/পোল্ডার সংস্কার, লবণাক্ততা প্রতিরোধী বাঁধ এবং ম্যানগ্রোভ বাফার বনায়ন।"
        : "Coastal embankment polder heightening and mangrove buffer belts.";
    } else if (isHighFlood) {
      topAction = isBn
        ? "নদীভাঙন রোধে জিও-ব্যাগ ডাইভারশন, প্রাক-বর্ষা ড্রেজিং এবং দ্রুত নিষ্কাশন স্লুইস গেট।"
        : "Pre-monsoon river dredging, geo-bag revetments, and automated sluice gates.";
    } else if (isHighHeat) {
      topAction = isBn
        ? "নগর ও গ্রামীণ হাটবাজারে কুল-রুফ, তাপদাহ বিশ্রামাগার এবং কৃষি ড্রিপ সেচ ব্যবস্থা।"
        : "Reflective cool roofs in public markets, heat cooling centers, and drip irrigation.";
    } else {
      topAction = isBn
        ? "সমন্বিত মাল্টি-হ্যাজার্ড দুর্যোগ আশ্রয়কেন্দ্র ও ড্রেনেজ অবকাঠামো উন্নয়ন।"
        : "Multi-hazard cyclone/flood shelter retrofitting and drainage modernization.";
    }

    return isBn
      ? `🎯 **${d.adm2_bn} জেলা (${d.adm2_pcode}):**\n- **জনসংখ্যা (২০২২):** ${d.population.toLocaleString()} জন (ঘনত্ব: ${d.pop_density_per_sqkm} জন/বর্গকিমি)\n- **দারিদ্র্যের হার:** ${d.poverty_headcount_pct}%\n- **তাপমাত্রার অসঙ্গতি:** +${d.apparent_temp_anomaly_c.toFixed(2)}°C\n- **নদীপ্রবাহ ও প্লাবন ইনডেক্স:** ${d.glofas_p75_discharge.toFixed(2)} (GloFAS p75)\n- **গড় উচ্চতা:** ${d.elevation_mean_m.toFixed(1)} মিটার (${(d.coastal_lowland_ratio * 100).toFixed(0)}% উপকূলীয় নিম্নাঞ্চল)\n- **বায়ুমান স্টেশন:** ${sensorText}\n\n💡 **নীতিগত সুপারিশ:** ${topAction} সিমুলেশন স্টুডিওতে এই জেলার বাজেট ও ঝুঁকি বণ্টন দেখতে পারেন।`
      : `🎯 **${d.adm2_en} District (${d.adm2_pcode}):**\n- **Population (Census 2022):** ${d.population.toLocaleString()} (Density: ${d.pop_density_per_sqkm}/sqkm)\n- **Poverty Headcount:** ${d.poverty_headcount_pct}%\n- **Heat Anomaly:** +${d.apparent_temp_anomaly_c.toFixed(2)}°C\n- **River Flood Index:** ${d.glofas_p75_discharge.toFixed(2)} (GloFAS p75)\n- **Elevation:** ${d.elevation_mean_m.toFixed(1)}m (${(d.coastal_lowland_ratio * 100).toFixed(0)}% coastal lowland)\n- **Ground AQ Stations:** ${sensorText}\n\n💡 **Policy Directive:** ${topAction} View simulated funding allocations in the Simulator Studio.`;
  }

  // 6. DIVISION-LEVEL QUERY
  for (const [key, div] of Object.entries(DIVISIONS)) {
    if (q.includes(key) || q.includes(div.bn) || q.includes(div.en.toLowerCase())) {
      return isBn
        ? `🗺️ **${div.bn}:**\nএই বিভাগের আওতাধীন জেলাসমূহ হলো: ${div.districts.join(", ")}। আমাদের স্থানিক ঝুঁকি মানচিত্রে এই বিভাগের প্রতিটি জেলার জলবায়ু ঝুঁকি, নদীপ্রবাহ ও সেন্সর ঘাটতি আলাদাভাবে পর্যবেক্ষণ করা সম্ভব। কোনো নির্দিষ্ট জেলার ঝুঁকি জানতে জেলার নাম লিখুন!`
        : `🗺️ **${div.en}:**\nEncompasses districts: ${div.districts.join(", ")}. Explore district-level vulnerability and fiscal simulations on our interactive spatial risk map.`;
    }
  }

  // 7. FLOOD & RIVERINE HAZARDS
  if (
    q.includes("বন্যা") ||
    q.includes("নদী") ||
    q.includes("নদীভাঙন") ||
    q.includes("প্লাবন") ||
    q.includes("flash flood") ||
    q.includes("flood") ||
    q.includes("river") ||
    q.includes("জলমগ্নতা") ||
    q.includes("discharge")
  ) {
    return isBn
      ? "🌊 **বন্যা ও নদীপ্রবাহ বিশ্লেষণ:**\n- **সর্বোচ্চ ঝুঁকিপূর্ণ অঞ্চল:** ব্রহ্মপুত্র ও যমুনা অববাহিকার কুড়িগ্রাম, গাইবান্ধা, সিরাজগঞ্জ এবং হাওর অববাহিকার সুনামগঞ্জ ও সিলেট।\n- **হাইড্রোলজিক্যাল মডেল:** Open-Meteo GloFAS v4 নদীপ্রবাহ উপাত্ত অনুযায়ী বর্ষা মৌসুমে এসব জেলায় পানি বিপদসীমার ওপরে থাকার আশঙ্কা থাকে।\n- **সমাধান:** ডেল্টা প্ল্যান ২১০০ অনুযায়ী বাঁধ সংস্কার ও প্রাক-বন্যা ড্রেজিংয়ে অগ্রাধিকার বরাদ্দ দিলে প্লাবন ক্ষতি ৪২% পর্যন্ত কমানো সম্ভব।"
      : "🌊 **Riverine & Flash Flood Analytics:**\n- **High Risk Districts:** Kurigram, Gaibandha, Sirajganj (Jamuna/Brahmaputra basin) and Sunamganj, Sylhet (Haor basin).\n- **Data Model:** GloFAS v4 River Discharge (monsoon peak percentiles).\n- **Recommendation:** Polder fortification, automated sluice gates, and early-warning telemetry.";
  }

  // 8. HEATWAVE & URBAN HEAT ISLAND
  if (
    q.includes("তীব্র তাপদাহ") ||
    q.includes("হিটওয়েভ") ||
    q.includes("তাপদাহ") ||
    q.includes("গরম") ||
    q.includes("উষ্ণতা") ||
    q.includes("heatwave") ||
    q.includes("heat") ||
    q.includes("uhi") ||
    q.includes("urban heat")
  ) {
    return isBn
      ? "🌡️ **তীব্র তাপদাহ ও হিটওয়েভ বিশ্লেষণ:**\n- **শীর্ষ ঝুঁকিপূর্ণ জেলা:** রাজশাহী, চুয়াডাঙ্গা, পাবনা, ঢাকা এবং মেহেরপুর।\n- **আরবান হিট আইল্যান্ড (UHI):** ঢাকায় অতিরিক্ত কংক্রিট ও ঘনবসতির কারণে রাতেও স্বাভাবিকের চেয়ে +১.৮°C থেকে +৩.৪°C বেশি তাপমাত্রা বজায় থাকে।\n- **সুপারিশ:** ভবনের ছাদে রিফ্লেক্টিভ কুল-রুফ কোটিং, নগর বনায়ন ও শ্রমজীবী মানুষের জন্য তাপদাহ আশ্রয়কেন্দ্র স্থাপন।"
      : "🌡️ **Extreme Heat & Urban Heat Island (UHI):**\n- **Top Vulnerable Districts:** Rajshahi, Chuadanga, Pabna, Dhaka, Meherpur.\n- **Urban Micro-climate:** Dhaka wards exhibit up to +3.4°C nocturnal heat anomalies.\n- **Recommended Policy:** Mandate cool roof coatings on dense informal settlements and urban greening.";
  }

  // 9. AIR QUALITY & SENSOR AUDIT
  if (
    q.includes("বায়ু") ||
    q.includes("বাতাস") ||
    q.includes("বায়ুদূষণ") ||
    q.includes("একিউআই") ||
    q.includes("সেন্সর") ||
    q.includes("air quality") ||
    q.includes("aqi") ||
    q.includes("sensor") ||
    q.includes("openaq") ||
    q.includes("pm2.5")
  ) {
    return isBn
      ? "💨 **বায়ুমান ও সেন্সর অডিট পরিস্থিতি:**\n- **বায়ুদূষণের কেন্দ্র:** ঢাকা, নারায়ণগঞ্জ ও গাজীপুরে শীতকালীন গড় PM2.5 বিশ্ব স্বাস্থ্য সংস্থার (WHO) নির্দেশিকার চেয়ে ৬-৮ গুণ বেশি।\n- **ডেটা ঘাটতি:** বাংলাদেশের ৬৪ জেলার মধ্যে ৫২টি জেলাতেই কোনো নিয়মিত ওপেনএকিউ (OpenAQ) গ্রাউন্ড এয়ার মনিটর নেই।\n- **ইকুইটি সমাধান:** আমাদের প্ল্যাটফর্মে ইকুইটি স্লাইডার (α_equity = ১.০) বাড়ালে এই সেন্সরবিহীন ৫২টি জেলায় লো-কস্ট মনিটরিং নেটওয়ার্ক স্থাপনে স্বয়ংক্রিয়ভাবে বাজেট স্থানান্তরিত হয়।"
      : "💨 **Air Quality & Ground Sensor Scarcity:**\n- **Pollution Hotspots:** Dhaka, Narayanganj, and Gazipur exceed WHO guidelines by 6-8x during winter.\n- **Data Invisibility:** 52 out of 64 districts lack continuous regulatory ground stations.\n- **Algorithmic Equity:** Raising α_equity to 1.0 penalizes data scarcity and allocates funds toward municipal IoT sensors.";
  }

  // 10. CYCLONE, SEA-LEVEL & COASTAL
  if (
    q.includes("ঘূর্ণিঝড়") ||
    q.includes("জলোচ্ছ্বাস") ||
    q.includes("উপকূল") ||
    q.includes("পোল্ডার") ||
    q.includes("লবণাক্ত") ||
    q.includes("সমুদ্র") ||
    q.includes("cyclone") ||
    q.includes("surge") ||
    q.includes("coastal") ||
    q.includes("salinity") ||
    q.includes("sea level")
  ) {
    return isBn
      ? "🌪️ **উপকূলীয় ও ঘূর্ণিঝড় ঝুঁকি:**\n- **অঞ্চল:** খুলনা, বাগেরহাট, বরগুনা, পটুয়াখালী, ভোলা ও কক্সবাজার।\n- **সমস্যা:** কপারনিকাস ডিইএম অনুযায়ী এসব জেলার ৭০% এর বেশি এলাকা সমুদ্রপৃষ্ঠের ৩-৫ মিটারের নিচে। সমুদ্রের লবণাক্ত পানি কৃষিভূমিতে প্রবেশ করছে।\n- **সুপারিশ:** কোস্টাল পোল্ডার পুনঃনির্মাণ, ড্রেনেজ স্লুইস-গেট স্বয়ংক্রিয়করণ এবং প্রাকৃতিক ম্যানগ্রোভ বেল্ট তৈরি।"
      : "🌪️ **Coastal & Cyclone Storm Surge:**\n- **Vulnerable Coast:** Khulna, Bagerhat, Barguna, Patuakhali, Bhola, Cox's Bazar.\n- **Topography:** >70% of land lies below 5m elevation with acute saline intrusion.\n- **Interventions:** Embankment revetments, tidal sluices, and bio-shield mangrove buffers.";
  }

  // 11. BUDGET & 5 CRORE ($500K) SIMULATION
  if (
    q.includes("৫ কোটি") ||
    q.includes("বাজেট") ||
    q.includes("টাকা") ||
    q.includes("বরাদ্দ") ||
    q.includes("অর্থায়ন") ||
    q.includes("500k") ||
    q.includes("budget") ||
    q.includes("fund") ||
    q.includes("allocation")
  ) {
    return isBn
      ? "💰 **$500,000 (প্রায় ৫ কোটি টাকা) বাজেট সিমুলেশন ফলাফল:**\n- **কভারেজ:** দেশের শীর্ষ ১৫টি অতি-ঝুঁকিপূর্ণ জেলায় গাণিতিক অপটিমাইজেশন অনুযায়ী তহবিল বণ্টন।\n- **সুরক্ষিত জনসংখ্যা:** আনুমানিক ১ কোটি ৩৫ লাখ মানুষ প্রত্যক্ষ জলবায়ু সুরক্ষার আওতায় আসবে।\n- **ঝুঁকি হ্রাস:** জেলাভেদে ১৬% থেকে ২৬% পর্যন্ত দুর্যোগ ঝুঁকি হ্রাস পাবে।\n\nআপনি সিমুলেটর স্টুডিওতে গিয়ে নিজের পছন্দমতো বাজেট ($100k - $2.5M) ও পলিসি প্যাকেজ নির্বাচন করতে পারেন।"
      : "💰 **$500,000 Budget Simulation Summary:**\n- **Coverage:** Optimized across 15 high-vulnerability districts.\n- **Direct Beneficiaries:** ~13.5 million citizens protected.\n- **Mitigation:** 16% to 26% hazard risk reduction.\n\nExperiment with custom fiscal ceilings ($100k-$2.5M) in the Simulation Studio.";
  }

  // 12. EQUITY SLIDER & ALPHA_EQUITY
  if (
    q.includes("সমতা স্লাইডার") ||
    q.includes("আলফা") ||
    q.includes("ইকুইটি") ||
    q.includes("equity slider") ||
    q.includes("alpha equity") ||
    q.includes("alpha_equity") ||
    q.includes("gini")
  ) {
    return isBn
      ? "⚖️ **সামাজিক সমতা ফ্যাক্টর (α_equity):**\n- **α = ০.০ (বেসলাইন):** শুধু জনসংখ্যা ও কাঁচা ঝুঁকি দেখে বড় শহরগুলো (যেমন ঢাকা, চট্টগ্রাম) সিংহভাগ টাকা নিয়ে নেয়।\n- **α = ০.৫ (ভারসাম্যপূর্ণ):** বড় শহরের পাশাপাশি মাঝারি ও প্রত্যন্ত ঝুঁকিপূর্ণ জেলাগুলো সমভাবে তহবিল পায় (Gini = ০.১২৪)।\n- **α = ১.০ (সর্বোচ্চ প্রান্তিক সমতা):** কুড়িগ্রাম, সুনামগঞ্জ ও বান্দরবানের মতো দরিদ্র ও সেন্সরবিহীন প্রান্তিক এলাকা সর্বোচ্চ অগ্রাধিকার পায়।"
      : "⚖️ **Social Equity Parameter (α_equity):**\n- **α = 0.0 (Baseline):** Pure population-weighted exposure, monopolized by megacities.\n- **α = 0.5 (Balanced):** Progressive equitable distribution across vulnerable zones.\n- **α = 1.0 (Max Equity):** Prioritizes data-scarce and impoverished peripheral districts.";
  }

  // 13. POLICY BRIEF & CABINET MEMO
  if (
    q.includes("স্মারক") ||
    q.includes("নীতি স্মারক") ||
    q.includes("মেমো") ||
    q.includes("ডাউনলোড") ||
    q.includes("policy brief") ||
    q.includes("cabinet memo") ||
    q.includes("brief") ||
    q.includes("directive")
  ) {
    return isBn
      ? "📄 **দাপ্তরিক নীতি স্মারক (Institutional Policy Brief):**\nসিমুলেশন পেজের উপরে **'দাপ্তরিক নীতি স্মারক তৈরি'** বাটনে ক্লিক করলে তাৎক্ষণিকভাবে ৬টি সেকশনের প্রাতিষ্ঠানিক পলিসি মেমো তৈরি হয়। এতে নির্বাহী সারসংক্ষেপ, স্থানিক টেবিল, বিকল্প সিনারিও তুলনা, বাস্তবায়ন সময়রেখা এবং বিধিবদ্ধ আইনগত রেফারেন্স অন্তর্ভুক্ত থাকে, যা সরাসরি মার্কডাউন (.md) ফাইল হিসেবে ডাউনলোড করা যায়।"
      : "📄 **Institutional Policy Brief:**\nClick 'Generate Cabinet Memo' in the Simulator to generate a 6-section administrative directive with quantitative tables, trade-off analysis, timelines, and statutory NAP citations, exportable as Markdown (.md).";
  }

  // 14. DATA SOURCES & METHODOLOGY
  if (
    q.includes("তথ্য কোথা থেকে") ||
    q.includes("উপাত্ত") ||
    q.includes("উৎস") ||
    q.includes("data source") ||
    q.includes("dataset") ||
    q.includes("provenance") ||
    q.includes("licenses")
  ) {
    return isBn
      ? "🏛️ **ভেরিফাইড ডেটাসেট ও লাইসেন্স:**\n১. **UN OCHA / HDX COD-AB:** ৬৪ জেলার প্রশাসনিক সীমানা (CC-BY 4.0, OGC:CRS84)\n২. **Copernicus DEM GLO-30:** ৩০ মিটার রেজোলিউশনের ভূ-সংস্থান ও উচ্চতা (ESA Open)\n৩. **Open-Meteo & ECMWF:** ERA5 তাপদাহ ও GloFAS v4 নদীপ্রবাহ উপাত্ত\n৪. **BBS (পরিসংখ্যান ব্যুরো):** জনশুমারি ২০২২ ডেমোগ্রাফিক্স (OpenGov)\n৫. **OpenAQ Platform:** গ্রাউন্ড বায়ুমান স্টেশন অডিট (ODbL)।"
      : "🏛️ **Verified Data Sources & Standards:**\n1. **UN OCHA / HDX COD-AB:** 64-district boundaries (CC-BY 4.0, OGC:CRS84)\n2. **Copernicus DEM GLO-30:** 30m digital elevation model (ESA Open)\n3. **Open-Meteo & ECMWF:** ERA5 heatwave & GloFAS v4 river discharge\n4. **BBS Census 2022:** Official demographics (OpenGov)\n5. **OpenAQ Platform:** Audited ground monitoring stations (ODbL).";
  }

  // 15. MACHINE LEARNING & ACCURACY (XGBoost & SHAP)
  if (
    q.includes("মডেল") ||
    q.includes("একুরেসি") ||
    q.includes("নির্ভুল") ||
    q.includes("xgboost") ||
    q.includes("shap") ||
    q.includes("machine learning") ||
    q.includes("accuracy") ||
    q.includes("validation") ||
    q.includes("r2")
  ) {
    return isBn
      ? "🤖 **মেশিন লার্নিং ভ্যালিডেশন মেট্রিক্স:**\n- **মডেল:** XGBoost 3.4.1 Regressor (কম্পোজিট ঝুঁকি মডেলিং)\n- **ভ্যালিডেশন পদ্ধতি:** স্থানিক স্বতঃসম্পর্ক রোধে ৫-ফোল্ড গ্রুপ কে-ফোল্ড (Division Grouping)\n- **পারফরম্যান্স:** R² = 0.815, RMSE = 0.045, MAE = 0.0346\n- **ব্যাখ্যাযোগ্যতা:** TreeExplainer SHAP দিয়ে প্রতিটি জেলার ক্ষেত্রে তাপদাহ, প্লাবন বা দারিদ্র্যের অবদান স্বচ্ছভাবে দৃশ্যমান।"
      : "🤖 **Machine Learning Validation:**\n- **Algorithm:** XGBoost 3.4.1 Regressor\n- **Spatial Cross-Validation:** 5-Fold Spatial Group K-Fold by Division\n- **Validation Metrics:** R² = 0.815, RMSE = 0.045\n- **Attribution:** TreeExplainer SHAP guarantees mathematical additivity.";
  }

  // 16. GOVERNANCE, AUDIT LOG & SHA-256
  if (
    q.includes("অডিট") ||
    q.includes("লগ") ||
    q.includes("ক্রিপ্টোগ্রাফিক") ||
    q.includes("sha256") ||
    q.includes("sha-256") ||
    q.includes("governance") ||
    q.includes("audit") ||
    q.includes("security")
  ) {
    return isBn
      ? "🔒 **সুশাসন ও ক্রিপ্টোগ্রাফিক অডিট ট্রেইল:**\nপ্ল্যাটফর্মের প্রতিটি সিমুলেশন রান, কোপাইলট প্রশ্ন এবং নীতি পরিবর্তন পোস্টগ্রেস ডেল্টা অডিট লগে অপরিবর্তনীয়ভাবে সংরক্ষিত হয়। প্রতিটি রেকর্ডে SHA-256 হ্যাশ সিল থাকে, যা যে কোনো নীতিগত সিদ্ধান্তের জবাবদিহিতা ও স্বচ্ছতা নিশ্চিত করে।"
      : "🔒 **Governance & Cryptographic Audit Trail:**\nEvery simulation run, prompt interaction, and allocation modification is immutably recorded in PostgreSQL audit logs with SHA-256 hash digests, ensuring end-to-end institutional accountability.";
  }

  // 17. NATIONAL DIRECTIVES (DELTA PLAN 2100 & NAP)
  if (
    q.includes("বদ্বীপ পরিকল্পনা") ||
    q.includes("ডেল্টা প্ল্যান") ||
    q.includes("২১০০") ||
    q.includes("nap") ||
    q.includes("bdp 2100") ||
    q.includes("মুজিব") ||
    q.includes("mcpp")
  ) {
    return isBn
      ? "📜 **জাতীয় নীতিমালা সংগতি:**\nআমাদের প্ল্যাটফর্ম বাংলাদেশ বদ্বীপ পরিকল্পনা ২১০০ (BDP 2100) এর জলবায়ু অভিযোজন কৌশল, জাতীয় অভিযোজন পরিকল্পনা (NAP ২০২৩-২০৫০) এর নগর ও হাওর সুরক্ষার দিকনির্দেশনা এবং মুজিব জলবায়ু সমৃদ্ধি পরিকল্পনা ২০৩০ (MCPP)-এর সাথে শতভাগ সামঞ্জস্যপূর্ণ।"
      : "📜 **National Statutory Directives:**\nAligned with Bangladesh Delta Plan 2100, National Adaptation Plan (NAP 2023–2050), and Mujib Climate Prosperity Plan 2030 (MCPP Pillar 3).";
  }

  // 18. WEATHER TODAY / TOMORROW (Friendly redirect)
  if (
    q.includes("আজকের আবহাওয়া") ||
    q.includes("কালকে বৃষ্টি") ||
    q.includes("কাল বৃষ্টি") ||
    q.includes("আজ বৃষ্টি") ||
    q.includes("weather today") ||
    q.includes("tomorrow rain") ||
    q.includes("weather forecast")
  ) {
    return isBn
      ? "🌦️ আমি প্রতিদিনের তাৎক্ষণিক আবহাওয়া পূর্বাভাসক নই। আমি **Delta AI**—দীর্ঘমেয়াদী জলবায়ু ঝুঁকি, নদীপ্রবাহ সিমুলেশন এবং বাজেট বণ্টনের নীতিনির্ধারণী সহকারী। আপনি কোনো জেলার সামগ্রিক ঝুঁকি বা বাজেট বণ্টন দেখতে চান কি?"
      : "🌦️ I am not a daily operational weather forecaster. I am **Delta AI**—a national climate hazard and fiscal simulation copilot. Ask about district vulnerability or resilience investments!";
  }

  // 19. STRICT OUT-OF-SCOPE BOUNDARY
  // Per user instruction: "ar amar included topics na hole , chatbot jeno simply bole , ei bisoye amar kono dhoroner dharona nei !"
  return isBn
    ? "এই বিষয়ে আমার কোনো ধারণা নেই। আমি **Delta AI**—বাংলাদেশ বদ্বীপ পরিকল্পনা ২১০০-এর আলোকে ৬৪ জেলার জলবায়ু ঝুঁকি, নদীপ্রবাহ, তাপদাহ, সেন্সর অডিট এবং বাজেট বণ্টনের নীতিনির্ধারণী সহকারী। আপনি জলবায়ু ঝুঁকি, কোনো জেলা বা সিমুলেশন সংক্রান্ত প্রশ্ন করতে পারেন।"
    : "I do not have information on this topic. I am **Delta AI**—a specialized climate policy and geospatial risk copilot aligned with Bangladesh Delta Plan 2100. Please ask about climate hazards, district risk profiles, or budget simulations.";
}
