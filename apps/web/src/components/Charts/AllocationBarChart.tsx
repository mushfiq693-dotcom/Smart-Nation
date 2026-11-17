"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

interface AllocationBarChartProps {
  allocations: any[];
  lang: "en" | "bn";
}

export function AllocationBarChart({ allocations = [], lang = "en" }: AllocationBarChartProps) {
  const isBn = lang === "bn";
  const topAllocations = allocations.slice(0, 10);

  const districtNames = topAllocations.map((a) =>
    isBn ? a.adm2_bn || a.district || a.adm2_en : a.district || a.adm2_en || a.adm2_pcode
  );

  const values = topAllocations.map((a) => a.allocated_usd || 0);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#0f172a",
      borderColor: "#334155",
      textStyle: { color: "#f8fafc", fontSize: 12 },
      formatter: (params: any) => {
        const item = params[0];
        const dataObj = topAllocations[item.dataIndex];
        if (!dataObj) return "";
        const scarcityText =
          dataObj.vulnerability_index_vi > 0.5
            ? isBn
              ? "সেন্সর ঘাটতি চিহ্নিত (V_i = ১.০)"
              : "Sensor-Scarce Flag (Vi = 1.0)"
            : isBn
            ? "মনিটরড জেলা"
            : "Monitored District";

        return `
          <div style="font-weight: bold; margin-bottom: 4px; color: #34d399;">
            ${item.name} (${dataObj.adm2_pcode || "ADM2"})
          </div>
          <div style="font-size: 11px; line-height: 1.6;">
            <div>${isBn ? "বরাদ্দকৃত অর্থ:" : "Allocated Funds:"} <b>$${Number(
          dataObj.allocated_usd
        ).toLocaleString()} USD</b></div>
            <div>${isBn ? "মোট বরাদ্দের অংশ:" : "Budget Share:"} <b>${Number(
          dataObj.allocation_pct
        ).toFixed(1)}%</b></div>
            <div>${isBn ? "সুরক্ষিত জনসংখ্যা:" : "Protected Population:"} <b>${Number(
          dataObj.estimated_protected_population || 0
        ).toLocaleString()}</b></div>
            <div style="color: #fbbf24; font-size: 10px; margin-top: 2px;">${scarcityText}</div>
          </div>
        `;
      },
    },
    grid: {
      left: "22%",
      right: "10%",
      top: "6%",
      bottom: "6%",
      containLabel: false,
    },
    xAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#334155" } },
      splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
      axisLabel: {
        color: "#94a3b8",
        fontSize: 10,
        formatter: (val: number) => `$${Math.round(val / 1000)}k`,
      },
    },
    yAxis: {
      type: "category",
      data: districtNames,
      inverse: true,
      axisLine: { lineStyle: { color: "#334155" } },
      axisTick: { show: false },
      axisLabel: {
        color: "#f1f5f9",
        fontSize: 11,
        fontWeight: "bold",
      },
    },
    series: [
      {
        name: isBn ? "বরাদ্দকৃত তহবিল ($ USD)" : "Allocated Funds ($ USD)",
        type: "bar",
        data: values,
        barWidth: 16,
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: "#059669" },
            { offset: 0.7, color: "#10b981" },
            { offset: 1, color: "#34d399" },
          ]),
        },
        label: {
          show: true,
          position: "right",
          color: "#34d399",
          fontSize: 10,
          fontFamily: "monospace",
          formatter: (params: any) => `$${Math.round(params.value / 1000)}k`,
        },
      },
    ],
  };

  return (
    <div className="w-full h-80">
      <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
