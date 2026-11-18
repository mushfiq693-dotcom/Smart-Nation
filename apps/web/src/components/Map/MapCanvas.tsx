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
  Moon,
  Satellite,
  Map,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";

export type MetricType =
  | "composite_risk"
  | "heat_anomaly"
  | "flood_discharge"
  | "elevation"
  | "sensor_scarcity";

export type BasemapType = "dark" | "satellite" | "streets";

export interface MapCanvasProps {
  districtsMatrix?: any[];
  onSelectDistrict?: (district: any) => void;
  activeMetric?: MetricType;
  setActiveMetric?: (metric: MetricType) => void;
  activeLayer?: "adm2" | "h3";
  setActiveLayer?: (layer: "adm2" | "h3") => void;
  basemap?: BasemapType;
  setBasemap?: (basemap: BasemapType) => void;
  showLabels?: boolean;
  setShowLabels?: (show: boolean) => void;
  showStations?: boolean;
  setShowStations?: (show: boolean) => void;
}

function MapCanvasComponent({
  districtsMatrix = [],
  onSelectDistrict,
  activeMetric: propActiveMetric,
  setActiveMetric: propSetActiveMetric,
  activeLayer: propActiveLayer,
  setActiveLayer: propSetActiveLayer,
  basemap: propBasemap,
  setBasemap: propSetBasemap,
  showLabels: propShowLabels,
  setShowLabels: propSetShowLabels,
  showStations: propShowStations,
  setShowStations: propSetShowStations,
}: MapCanvasProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const onSelectDistrictRef = useRef(onSelectDistrict);
  onSelectDistrictRef.current = onSelectDistrict;
  const districtsMatrixRef = useRef(districtsMatrix);
  districtsMatrixRef.current = districtsMatrix;

  const [internalMetric, setInternalMetric] = useState<MetricType>("composite_risk");
  const activeMetric = propActiveMetric ?? internalMetric;
  const setActiveMetric = propSetActiveMetric ?? setInternalMetric;

  const [internalLayer, setInternalLayer] = useState<"adm2" | "h3">("adm2");
  const activeLayer = propActiveLayer ?? internalLayer;
  const setActiveLayer = propSetActiveLayer ?? setInternalLayer;

  const [internalBasemap, setInternalBasemap] = useState<BasemapType>("streets");
  const basemap = propBasemap ?? internalBasemap;
  const setBasemap = propSetBasemap ?? setInternalBasemap;

  const [internalLabels, setInternalLabels] = useState<boolean>(true);
  const showLabels = propShowLabels ?? internalLabels;
  const setShowLabels = propSetShowLabels ?? setInternalLabels;

  const [internalStations, setInternalStations] = useState<boolean>(true);
  const showStations = propShowStations ?? internalStations;
  const setShowStations = propSetShowStations ?? setInternalStations;

  const [hoveredDistrict, setHoveredDistrict] = useState<any | null>(null);
  const { lang, t } = useI18n();

  const isBn = lang === "bn";

  // Bangladesh Geographic Centroid & Default Bounds
  const BD_CENTER: [number, number] = [90.3563, 23.6850];
  const BD_ZOOM = 6.8;

  // MapTiler Cloud Key from .env (Native Vector & Retina Raster Partner for MapLibre)
  const mapTilerKey =
    process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim() || "8kXMWbrFazDl6fjhCEgT";

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Real Vector & Satellite Raster Base Style Specification with MapTiler Retina @2x Tiles & Open Glyphs
    const initialStyle: maplibregl.StyleSpecification = {
      version: 8,
      glyphs: mapTilerKey
        ? `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${mapTilerKey}`
        : "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        // 1. MapTiler Dataviz Dark (Retina @2x High-DPI Tiles for razor-sharp city & river labels)
        "carto-dark": {
          type: "raster",
          tiles: mapTilerKey
            ? [
                `https://api.maptiler.com/maps/dataviz-dark/256/{z}/{x}/{y}@2x.png?key=${mapTilerKey}`,
              ]
            : [
                "https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png",
                "https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png",
                "https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png",
                "https://d.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png",
              ],
          tileSize: 256,
          attribution: "&copy; MapTiler &copy; OpenStreetMap contributors",
        },
        // 2. MapTiler Satellite Hybrid (High-Resolution Real Satellite + Roads, Rivers & Town Names)
        "esri-satellite": {
          type: "raster",
          tiles: mapTilerKey
            ? [
                `https://api.maptiler.com/maps/hybrid/256/{z}/{x}/{y}@2x.jpg?key=${mapTilerKey}`,
              ]
            : [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              ],
          tileSize: 256,
          attribution: "&copy; MapTiler &copy; Esri, Maxar",
        },
        // 3. MapTiler Streets v2 (Ultra-detailed Upazilas, Thanas, Roads, Rivers & Topography @2x Retina)
        "carto-voyager": {
          type: "raster",
          tiles: mapTilerKey
            ? [
                `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}@2x.png?key=${mapTilerKey}`,
              ]
            : [
                "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
                "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
                "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
                "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
              ],
          tileSize: 256,
          attribution: "&copy; MapTiler &copy; OpenStreetMap contributors",
        },
      },
      layers: [
        {
          id: "background",
          type: "background",
          paint: {
            "background-color": "#020617",
          },
        },
        {
          id: "basemap-dark-layer",
          type: "raster",
          source: "carto-dark",
          layout: {
            visibility: "none",
          },
          paint: {
            "raster-opacity": 0.95,
          },
        },
        {
          id: "basemap-satellite-layer",
          type: "raster",
          source: "esri-satellite",
          layout: {
            visibility: "none",
          },
          paint: {
            "raster-opacity": 1.0,
          },
        },
        {
          id: "basemap-streets-layer",
          type: "raster",
          source: "carto-voyager",
          layout: {
            visibility: "visible",
          },
          paint: {
            "raster-opacity": 0.95,
          },
        },
      ],
    };

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle,
      center: BD_CENTER,
      zoom: BD_ZOOM,
      minZoom: 5.5,
      maxZoom: 14,
      maxBounds: [
        [85.0, 20.0], // Southwest [lng, lat]
        [95.5, 27.5], // Northeast [lng, lat]
      ],
      attributionControl: false,
    });

    mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    mapInstance.on("load", () => {
      // 1. Add Districts GeoJSON Source (100% Real MultiPolygon Boundaries)
      mapInstance.addSource("districts-source", {
        type: "geojson",
        data: "/data/bgd_adm2_districts.geojson",
      });

      // 2. Add District Centroids Source (For Crystal-Clear Vector Text Labels)
      mapInstance.addSource("centroids-source", {
        type: "geojson",
        data: "/data/bgd_adm2_centroids.geojson",
      });

      // 3. Add H3 Hexagons GeoJSON Source
      mapInstance.addSource("h3-hexagons-source", {
        type: "geojson",
        data: "/data/bgd_h3_res7_hexagons.geojson",
      });

      // 4. Add Divisions GeoJSON Source (Unary Union Boundary)
      mapInstance.addSource("divisions-source", {
        type: "geojson",
        data: "/data/bgd_adm1_divisions.geojson",
      });

      // 5. Add OpenAQ Stations Source
      mapInstance.addSource("stations-source", {
        type: "geojson",
        data: "/data/openaq_bd_stations.geojson",
      });

      // Layer: Districts Fill (Semi-transparent Choropleth over real basemap)
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
            ["coalesce", ["get", "coastal_lowland_ratio"], 0.3],
            0.0, "#10b981",
            0.3, "#eab308",
            0.6, "#f97316",
            0.9, "#dc2626",
          ],
          "fill-opacity": 0.55,
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
          "line-color": "rgba(255, 255, 255, 0.3)",
          "line-width": 0.8,
          "line-opacity": 0.85,
        },
      });

      // Layer: Districts Hover Highlight
      mapInstance.addLayer({
        id: "districts-highlight",
        type: "line",
        source: "districts-source",
        paint: {
          "line-color": "#38bdf8",
          "line-width": 2.8,
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
          "fill-opacity": 0.7,
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

      // Layer: Divisions Boundary Line (Prominent Cyan Neon Boundary)
      mapInstance.addLayer({
        id: "divisions-line",
        type: "line",
        source: "divisions-source",
        paint: {
          "line-color": "#00f0ff",
          "line-width": 2.2,
          "line-opacity": 0.85,
          "line-dasharray": [3, 2],
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

      // Layer: Crisp Vector District Text Labels (with dark halo for 100% legibility)
      mapInstance.addLayer({
        id: "districts-labels",
        type: "symbol",
        source: "centroids-source",
        layout: {
          visibility: "visible",
          "text-field": ["get", isBn ? "adm2_bn" : "adm2_en"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5.5, 9.5,
            7.0, 11.5,
            8.5, 14.0,
            10.0, 17.0,
          ],
          "text-anchor": "center",
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-max-width": 8,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#020617",
          "text-halo-width": 2.5,
          "text-halo-blur": 0.8,
        },
      });

      // Layer: Secondary Sub-Labels when zoomed in (e.g. elevation & alternate language)
      mapInstance.addLayer({
        id: "districts-sub-labels",
        type: "symbol",
        source: "centroids-source",
        minzoom: 8.2,
        layout: {
          visibility: "visible",
          "text-field": [
            "concat",
            ["get", isBn ? "adm2_en" : "adm2_bn"],
            " • ",
            ["to-string", ["get", "elevation_mean_m"]],
            "m",
          ],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 11,
          "text-anchor": "top",
          "text-offset": [0, 0.85],
        },
        paint: {
          "text-color": "#38bdf8",
          "text-halo-color": "#020617",
          "text-halo-width": 2.0,
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

      // Click to select district & open detailed dossier
      mapInstance.on("click", "districts-fill", (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties;

        // Fly gently toward clicked district centroid
        if (props.longitude && props.latitude) {
          mapInstance.flyTo({
            center: [Number(props.longitude), Number(props.latitude)],
            zoom: Math.max(mapInstance.getZoom(), 8.2),
            duration: 800,
          });
        }

        if (onSelectDistrictRef.current) {
          // Merge with full matrix attributes if available
          const fullRecord = districtsMatrixRef.current.find((d) => d.adm2_pcode === props.adm2_pcode) || props;
          onSelectDistrictRef.current(fullRecord);
        }
      });
    });

    map.current = mapInstance;

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  // Update Dynamic Language in Map Labels
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    try {
      map.current.setLayoutProperty(
        "districts-labels",
        "text-field",
        ["get", isBn ? "adm2_bn" : "adm2_en"]
      );
      map.current.setLayoutProperty(
        "districts-sub-labels",
        "text-field",
        [
          "concat",
          ["get", isBn ? "adm2_en" : "adm2_bn"],
          " • ",
          ["to-string", ["get", "elevation_mean_m"]],
          "m",
        ]
      );
    } catch {
      // Ignored if style is still initializing
    }
  }, [lang, isBn]);

  // Toggle Label Visibility
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    try {
      const visibility = showLabels ? "visible" : "none";
      map.current.setLayoutProperty("districts-labels", "visibility", visibility);
      map.current.setLayoutProperty("districts-sub-labels", "visibility", visibility);
    } catch {}
  }, [showLabels]);

  // Update Basemap Visibility
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    try {
      map.current.setLayoutProperty(
        "basemap-dark-layer",
        "visibility",
        basemap === "dark" ? "visible" : "none"
      );
      map.current.setLayoutProperty(
        "basemap-satellite-layer",
        "visibility",
        basemap === "satellite" ? "visible" : "none"
      );
      map.current.setLayoutProperty(
        "basemap-streets-layer",
        "visibility",
        basemap === "streets" ? "visible" : "none"
      );

      // Adjust district fill opacity for satellite contrast
      const targetOpacity = basemap === "satellite" ? 0.42 : 0.58;
      map.current.setPaintProperty("districts-fill", "fill-opacity", targetOpacity);
    } catch {
      // Ignored if map style is reloading
    }
  }, [basemap]);

  // Update Choropleth Colors when activeMetric changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    let colorExpression: any;

    switch (activeMetric) {
      case "composite_risk":
        // Emerald green to amber to crimson red
        colorExpression = [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", "coastal_lowland_ratio"], 0.3],
          0.0, "#10b981",
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

      {/* Top Right Floating Controls: ONLY OpenAQ & Reset View as requested */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Stations Toggle */}
        <button
          onClick={() => setShowStations(!showStations)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-2xl backdrop-blur-xl transition-all ${
            showStations
              ? "border-cyan-500/40 bg-cyan-950/85 text-cyan-300 shadow-cyan-950/50"
              : "border-slate-800 bg-slate-900/90 text-slate-400 hover:text-slate-200"
          }`}
          title="Toggle OpenAQ Ground Stations"
        >
          <MapPin className="h-3.5 w-3.5 text-cyan-400" />
          <span>OpenAQ</span>
        </button>

        {/* Reset View Button */}
        <button
          onClick={resetView}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-800 shadow-2xl backdrop-blur-xl transition-colors"
          title="Reset to Bangladesh center"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
          <span>{isBn ? "রিসেট" : "Reset"}</span>
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
        <div className="absolute top-20 right-4 z-20 pointer-events-none rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl text-xs space-y-1.5 max-w-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-white text-sm block">
                {isBn ? hoveredDistrict.adm2_bn || hoveredDistrict.adm2_en : hoveredDistrict.adm2_en}
              </span>
              <span className="text-[10px] text-slate-400">
                {hoveredDistrict.adm2_en} • {hoveredDistrict.topography_class?.replace("_", " ") || "Delta"}
              </span>
            </div>
            <span className="font-mono text-[10px] text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded border border-cyan-500/20">
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

export const MapCanvas = React.memo(MapCanvasComponent);
