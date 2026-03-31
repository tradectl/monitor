"use client";
import { useEffect, useRef } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type IPriceLine,
  ColorType,
  LineStyle,
  type SeriesMarker,
  type Time,
} from "lightweight-charts";
import type { MonitorTick, MonitorFill, PriceLine } from "../types/monitor";

interface Props {
  ticks: MonitorTick[];
  fills: MonitorFill[];
  tick: MonitorTick | null;
  extraLines?: PriceLine[];
}

export function PriceChart({ ticks, fills, tick, extraLines }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const linesRef = useRef<IPriceLine[]>([]);
  const lastTickCount = useRef(0);
  const lastTime = useRef(0);
  const markersRef = useRef<SeriesMarker<Time>[]>([]);
  const extraPricesRef = useRef<number[]>([]);

  // Create chart on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0f172a" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: "#334155" },
      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
        secondsVisible: true,
      },
    });

    const series = chart.addLineSeries({
      color: "#3b82f6",
      lineWidth: 2,
      priceLineVisible: false,
      autoscaleInfoProvider: (original: () => { priceRange: { minValue: number; maxValue: number }; margins?: { above: number; below: number } } | null) => {
        const res = original();
        const extras = extraPricesRef.current;

        if (!res && extras.length === 0) return null;

        let min = res?.priceRange.minValue ?? Infinity;
        let max = res?.priceRange.maxValue ?? -Infinity;
        for (const p of extras) {
          if (p < min) min = p;
          if (p > max) max = p;
        }
        if (!isFinite(min) || !isFinite(max)) return res;
        return {
          priceRange: { minValue: min, maxValue: max },
          margins: { above: 0.05, below: 0.05 },
        };
      },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      linesRef.current = [];
      markersRef.current = [];
      extraPricesRef.current = [];
      lastTickCount.current = 0;
      lastTime.current = 0;
    };
  }, []);

  // Update data
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || ticks.length === 0) return;

    // Append only new ticks with strictly increasing timestamps
    if (ticks.length > lastTickCount.current) {
      const newTicks = ticks.slice(lastTickCount.current);
      for (const t of newTicks) {
        const time = Math.floor(t.timestamp_ms / 1000);
        if (time > lastTime.current) {
          series.update({
            time: time as UTCTimestamp,
            value: (t.bid_price + t.ask_price) * 0.5,
          });
          lastTime.current = time;
        }
      }
      lastTickCount.current = ticks.length;
    }
  }, [ticks]);

  // Update price lines from strategy — fully generic, no strategy-specific logic
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !tick) return;

    // Remove ALL previous lines
    for (const line of linesRef.current) {
      try { series.removePriceLine(line); } catch {}
    }
    linesRef.current = [];

    const styleMap: Record<string, number> = {
      solid: LineStyle.Solid,
      dashed: LineStyle.Dashed,
      dotted: LineStyle.Dotted,
    };

    const prices: number[] = [];
    const created: IPriceLine[] = [];

    const allLines = [...tick.price_lines, ...(extraLines ?? [])];
    for (const pl of allLines) {
      prices.push(pl.price);
      created.push(
        series.createPriceLine({
          price: pl.price,
          color: pl.color,
          lineWidth: pl.line_width as 1 | 2 | 3 | 4,
          lineStyle: styleMap[pl.style] ?? LineStyle.Dashed,
          axisLabelVisible: pl.axis_label,
          title: pl.label,
        })
      );
    }

    linesRef.current = created;
    extraPricesRef.current = prices;

    return () => {
      for (const line of created) {
        try { series.removePriceLine(line); } catch {}
      }
    };
  }, [tick, extraLines]);

  // Fill markers
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || fills.length === 0) return;

    const markers: SeriesMarker<Time>[] = fills.map((f) => ({
      time: (f.timestamp_ms / 1000) as UTCTimestamp,
      position: f.fill_type === "entry" ? "belowBar" as const : "aboveBar" as const,
      color:
        f.fill_type === "entry"
          ? "#3b82f6"
          : f.fill_type === "tp"
            ? "#22c55e"
            : "#ef4444",
      shape: f.fill_type === "entry" ? "arrowUp" as const : "arrowDown" as const,
      text: f.fill_type.toUpperCase(),
    }));

    markersRef.current = markers;
    series.setMarkers(markers);
  }, [fills]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[300px] rounded-lg border border-slate-800"
    />
  );
}
