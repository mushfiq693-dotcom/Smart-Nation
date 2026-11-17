"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Layers,
  Thermometer,
  Waves,
  Mountain,
  AlertTriangle,
  RotateCcw,
  Eye,
  Activity,
  MapPin,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";

export type MetricType =
  | "composite_risk"
  | "heat_anomaly"
  | "flood_discharge"
  | "elevation"
  | "sensor_scarcity";

interface MapCanvasProps {
  districtsMatrix?: any[];
  onSelectDistrict?: (district: any) => void;
}

export function MapCanvas({ districtsMatrix = [], onSelectDistrict }: MapCanvasProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [activeMetric, setActiveMetric] = useState<MetricType>("composite_risk");
  const [activeLayer, setActiveLayer] = useState<"adm2" | "h3">("adm2");
  const [showStations, setShowStations] = useState<boolean>(true);
  const [hoveredDistrict, setHoveredDistrict] = useState<any | null>(null);
  const { lang, t } = useI18n();

  const isBn = lang === "bn";

  // Bangladesh Geographic Centroid & Default Bounds
  const BD_CENTER: [number, number] = [90.3563, 23.6850];
  const BD_ZOOM = 6.8;

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Offline Dark Vector Base Style
    const darkStyle: maplibregl.StyleSpecification = {
      version: 8,
      sources: {},
      layers: [
        {
          id: "background",
          type: "background",
          paint: {
            "background-color": "#020617",
          },
        },
      ],
    };

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: darkStyle,
      center: BD_CENTER,
      zoom: BD_ZOOM,
      minZoom: 5.5,
      maxZoom: 12,
      attributionControl: false,
    });

    mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    mapInstance.on("load", () => {
      // 1. Add Districts GeoJSON Source
      mapInstance.addSource("districts-source", {
        type: "geojson",
        data: "/data/bgd_adm2_districts.geojson",
      });

      // 2. Add H3 Hexagons GeoJSON Source
      mapInstance.addSource("h3-hexagons-source", {
        type: "geojson",
        data: "/data/bgd_h3_res7_hexagons.geojson",
      });

      // 3. Add Divisions GeoJSON Source
      mapInstance.addSource("divisions-source", {
        type: "geojson",
        data: "/data/bgd_adm1_divisions.geojson",
      });

      // 4. Add OpenAQ Stations Source
      mapInstance.addSource("stations-source", {
        type: "geojson",
        data: "/data/openaq_bd_stations.geojson",
      });

      // Layer: Districts Fill
      mapInstance.addLayer({
        id: "districts-fill",
        type: "fill",
        source: "districts-source",
        layout: {
          visibility: "visible",
        },
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "elevation_mean_m"], 10],
            0, "#047857",
            5, "#10b981",
            20, "#eab308",
            50, "#ea580c",
            100, "#991b1b",
          ],
          "fill-opacity": 0.75,
        },
      });

      // Layer: Districts Line / Border
      mapInstance.addLayer({
        id: "districts-line",
        type: "line",
        source: "districts-source",
        layout: {
          visibility: "visible",
        },
        paint: {
          "line-color": "#1e293b",
          "line-width": 1.2,
          "line-opacity": 0.9,
        },
      });

      // Layer: Districts Hover Highlight
      mapInstance.addLayer({
        id: "districts-highlight",
        type: "line",
        source: "districts-source",
        paint: {
          "line-color": "#38bdf8",
          "line-width": 2.5,
          "line-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            1.0,
            0.0,
          ],
        },
      });

      // Layer: H3 Hexagons Fill (Initially hidden or shown on toggle)
      mapInstance.addLayer({
        id: "h3-hexagons-fill",
        type: "fill",
        source: "h3-hexagons-source",
        layout: {
          visibility: "none",
        },
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "hazard_score"], 0.5],
            0.2, "#22c55e",
            0.5, "#eab308",
            0.8, "#ef4444",
          ],
          "fill-opacity": 0.8,
        },
      });

      // Layer: H3 Hexagons Line
      mapInstance.addLayer({
        id: "h3-hexagons-line",
        type: "line",
        source: "h3-hexagons-source",
        layout: {
          visibility: "none",
        },
        paint: {
          "line-color": "#0ea5e9",
          "line-width": 0.8,
          "line-opacity": 0.6,
        },
      });

      // Layer: Divisions Boundary Line (Prominent)
      mapInstance.addLayer({
        id: "divisions-line",
        type: "line",
        source: "divisions-source",
        paint: {
          "line-color": "#0284c7",
          "line-width": 2.0,
          "line-opacity": 0.8,
          "line-dasharray": [2, 1],
        },
      });

      // Layer: OpenAQ Stations Circles
      mapInstance.addLayer({
        id: "stations-circle",
        type: "circle",
        source: "stations-source",
        layout: {
          visibility: "visible",
        },
        paint: {
          "circle-color": "#06b6d4",
          "circle-radius": 5,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Interaction Events
      let hoveredFeatureId: string | number | null = null;

      mapInstance.on("mousemove", "districts-fill", (e) => {
        if (!e.features || e.features.length === 0) return;
        mapInstance.getCanvas().style.cursor = "pointer";

        const feature = e.features[0];
        const props = feature.properties;
        setHoveredDistrict(props);

        if (hoveredFeatureId !== null) {
          mapInstance.setFeatureState(
            { source: "districts-source", id: hoveredFeatureId },
            { hover: false }
          );
        }
        hoveredFeatureId = feature.id ?? props.adm2_pcode;
        if (hoveredFeatureId !== null) {
          mapInstance.setFeatureState(
            { source: "districts-source", id: hoveredFeatureId },
            { hover: true }
          );
        }
      });

      mapInstance.on("mouseleave", "districts-fill", () => {
        mapInstance.getCanvas().style.cursor = "";
        setHoveredDistrict(null);
        if (hoveredFeatureId !== null) {
          mapInstance.setFeatureState(
            { source: "districts-source", id: hoveredFeatureId },
            { hover: false }
          );
          hoveredFeatureId = null;
        }
      });

      mapInstance.on("click", "districts-fill", (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties;

        // Fly to Centroid
        if (props.longitude && props.latitude) {
          mapInstance.flyTo({
            center: [Number(props.longitude), Number(props.latitude)],
            zoom: 8.5,
            duration: 1200,
          });
        }

        if (onSelectDistrict) {
          // Merge with full matrix attributes if available
          const fullRecord = districtsMatrix.find((d) => d.adm2_pcode === props.adm2_pcode) || props;
          onSelectDistrict(fullRecord);
        }
      });
    });

    map.current = mapInstance;

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  // Update Choropleth Colors when activeMetric changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    let colorExpression: any;

    switch (activeMetric) {
      case "composite_risk":
        // Yellow to Orange to Crimson Red
        colorExpression = [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", "coastal_lowland_ratio"], 0.3],
          0.0, "#22c55e",
          0.3, "#eab308",
          0.6, "#f97316",
          0.9, "#dc2626",
        ];
        break;

      case "heat_anomaly":
        // Cool yellow to Fire Magenta
        colorExpression = [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", "elevation_mean_m"], 10],
          0, "#fbbf24",
          15, "#f97316",
          30, "#ef4444",
          60, "#a855f7",
        ];
        break;

      case "flood_discharge":
        // Light blue to deep navy
        colorExpression = [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", "coastal_lowland_ratio"], 0.2],
          0.1, "#bae6fd",
          0.4, "#38bdf8",
          0.7, "#0284c7",
          1.0, "#1e3a8a",
        ];
        break;

      case "elevation":
        // Green lowland to amber highland
        colorExpression = [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", "elevation_mean_m"], 5],
          1.0, "#047857",
          5.0, "#10b981",
          15.0, "#eab308",
          40.0, "#ea580c",
          80.0, "#7f1d1d",
        ];
        break;

      case "sensor_scarcity":
        // Highlight sensor-scarce districts with alert amber
        colorExpression = [
          "case",
          ["==", ["coalesce", ["get", "elevation_p10_m"], 0], 0],
          "#b45309",
          "#334155",
        ];
        break;
    }

    try {
      map.current.setPaintProperty("districts-fill", "fill-color", colorExpression);
    } catch {
      // Style may be reloading
    }
  }, [activeMetric]);

  // Toggle between ADM2 Districts and H3 Hexagons
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    if (activeLayer === "adm2") {
      map.current.setLayoutProperty("districts-fill", "visibility", "visible");
      map.current.setLayoutProperty("districts-line", "visibility", "visible");
      map.current.setLayoutProperty("h3-hexagons-fill", "visibility", "none");
      map.current.setLayoutProperty("h3-hexagons-line", "visibility", "none");
    } else {
      map.current.setLayoutProperty("districts-fill", "visibility", "none");
      map.current.setLayoutProperty("districts-line", "visibility", "none");
      map.current.setLayoutProperty("h3-hexagons-fill", "visibility", "visible");
      map.current.setLayoutProperty("h3-hexagons-line", "visibility", "visible");
    }
  }, [activeLayer]);

  // Toggle OpenAQ Stations Visibility
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    map.current.setLayoutProperty(
      "stations-circle",
      "visibility",
      showStations ? "visible" : "none"
    );
  }, [showStations]);

  const resetView = () => {
    if (!map.current) return;
    map.current.flyTo({
      center: BD_CENTER,
      zoom: BD_ZOOM,
      duration: 1000,
    });
  };

  const metricButtons: { id: MetricType; label: string; icon: any }[] = [
    { id: "composite_risk", label: isBn ? "সম্মিলিত ঝুঁকি (R̂_i)" : "Composite Risk (R̂_i)", icon: Activity },
    { id: "heat_anomaly", label: isBn ? "তীব্র তাপদাহ (°C)" : "Heatwave (°C)", icon: Thermometer },
    { id: "flood_discharge", label: isBn ? "নদী প্রবাহ ও প্লাবন" : "River Discharge", icon: Waves },
    { id: "elevation", label: isBn ? "নিচু ভূমি উচ্চতা" : "Elevation (<5m)", icon: Mountain },
    { id: "sensor_scarcity", label: isBn ? "সেন্সর তথ্য ঘাটতি" : "Sensor Scarcity (V_i)", icon: AlertTriangle },
  ];

  return (
    <div className="relative w-full h-[580px] lg:h-[650px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Map Canvas Element */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Top Floating Control Bar: Metric Selector */}
      <div className="absolute top-4 left-4 right-4 md:right-auto z-10 flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/90 p-1.5 shadow-2xl backdrop-blur-xl">
        {metricButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = activeMetric === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setActiveMetric(btn.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Top Right Controls: Layer Toggle & Reset View */}
      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2">
        {/* Layer Switcher (ADM2 vs H3) */}
        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/90 p-1 shadow-2xl backdrop-blur-xl text-xs font-medium">
          <button
            onClick={() => setActiveLayer("adm2")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeLayer === "adm2"
                ? "bg-emerald-500/20 text-emerald-300 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ADM2 (64)
          </button>
          <button
            onClick={() => setActiveLayer("h3")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeLayer === "h3"
                ? "bg-cyan-500/20 text-cyan-300 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            H3 Hex (448)
          </button>
        </div>

        {/* Stations Toggle */}
        <button
          onClick={() => setShowStations(!showStations)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-2xl backdrop-blur-xl transition-all ${
            showStations
              ? "border-cyan-500/40 bg-cyan-950/80 text-cyan-300"
              : "border-slate-800 bg-slate-900/90 text-slate-400"
          }`}
          title="Toggle OpenAQ Ground Stations"
        >
          <MapPin className="h-3.5 w-3.5 text-cyan-400" />
          <span>OpenAQ</span>
        </button>

        {/* Reset View Button */}
        <button
          onClick={resetView}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 shadow-2xl backdrop-blur-xl transition-colors"
          title="Reset to Bangladesh center"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden md:inline">{isBn ? "রিসেট" : "Reset"}</span>
        </button>
      </div>

      {/* Bottom Left Floating Legend */}
      <div className="absolute bottom-4 left-4 z-10 rounded-2xl border border-slate-800 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-xl text-xs space-y-2 max-w-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider">
            {activeMetric === "composite_risk" && (isBn ? "সম্মিলিত ঝুঁকি স্কেল" : "Composite Risk Scale")}
            {activeMetric === "heat_anomaly" && (isBn ? "তাপপ্রবাহ তাপমাত্রা (°C)" : "Heatwave Anomaly (°C)")}
            {activeMetric === "flood_discharge" && (isBn ? "নদী প্রবাহ পিক" : "River Discharge")}
            {activeMetric === "elevation" && (isBn ? "ভূমি উচ্চতা (মিটার)" : "Elevation (Meters)")}
            {activeMetric === "sensor_scarcity" && (isBn ? "সেন্সর তথ্য ঘাটতি" : "Sensor Scarcity Flag")}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">OGC:CRS84</span>
        </div>

        {/* Gradient Bar */}
        {activeMetric !== "sensor_scarcity" ? (
          <div>
            <div
              className={`h-2.5 w-full rounded-full ${
                activeMetric === "composite_risk"
                  ? "bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-red-600"
                  : activeMetric === "heat_anomaly"
                  ? "bg-gradient-to-r from-amber-300 via-orange-500 via-red-500 to-purple-600"
                  : activeMetric === "flood_discharge"
                  ? "bg-gradient-to-r from-sky-200 via-cyan-400 via-blue-600 to-indigo-950"
                  : "bg-gradient-to-r from-emerald-700 via-emerald-500 via-amber-400 to-amber-700"
              }`}
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>{isBn ? "নিম্ন" : "Low"}</span>
              <span>{isBn ? "মধ্যম" : "Moderate"}</span>
              <span>{isBn ? "তীব্র" : "Extreme"}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-amber-600" />
              <span className="text-amber-200">{isBn ? "ঘাটতি (৫২ জেলা)" : "Scarce (52)"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-slate-700" />
              <span className="text-slate-400">{isBn ? "সক্রিয় (১২ জেলা)" : "Monitored (12)"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredDistrict && (
        <div className="absolute top-18 md:top-20 right-4 z-20 pointer-events-none rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl text-xs space-y-1 max-w-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold text-white text-sm">
              {isBn ? hoveredDistrict.adm2_bn || hoveredDistrict.adm2_en : hoveredDistrict.adm2_en}
            </span>
            <span className="font-mono text-[10px] text-cyan-400 bg-slate-800 px-1 py-0.5 rounded">
              {hoveredDistrict.adm2_pcode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500 block">{isBn ? "জনসংখ্যা:" : "Population:"}</span>
              <span className="font-mono font-semibold">
                {hoveredDistrict.population_2022
                  ? Number(hoveredDistrict.population_2022).toLocaleString()
                  : "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">{isBn ? "গড় উচ্চতা:" : "Mean Elevation:"}</span>
              <span className="font-mono font-semibold text-emerald-400">
                {hoveredDistrict.elevation_mean_m
                  ? `${Number(hoveredDistrict.elevation_mean_m).toFixed(1)} m`
                  : "—"}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-cyan-400 italic pt-1 border-t border-slate-800/80">
            {isBn ? "ক্লিক করে বিস্তারিত ডসিয়ার দেখুন" : "Click to inspect detailed dossier"}
          </p>
        </div>
      )}
    </div>
  );
}
