"use client";
import { useState, useCallback } from "react";
import { useMonitor } from "../hooks/use-monitor";
import { PriceChart } from "../components/price-chart";
import { Positions } from "../components/positions";
import { Shadow } from "../components/shadow";
import { Stats } from "../components/stats";
import { ConnectionStatus } from "../components/connection";
import { ErrorBoundary } from "../components/error-boundary";
import type { PriceLine } from "../types/monitor";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:9100";

export default function MonitorPage() {
  const { connected, strategies } = useMonitor(WS_URL);
  const keys = Array.from(strategies.keys());
  const [selected, setSelected] = useState<string | null>(null);
  const [shadowLines, setShadowLines] = useState<PriceLine[] | null>(null);
  const handleVariantSelect = useCallback((lines: PriceLine[] | null) => setShadowLines(lines), []);
  const activeKey = selected && keys.includes(selected) ? selected : keys[0] ?? null;
  const data = activeKey ? strategies.get(activeKey) : null;

  return (
    <div className="min-h-screen flex flex-col p-4 gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold tracking-tight">tradectl monitor</h1>
        <ConnectionStatus connected={connected} />
      </div>

      {keys.length === 0 ? (
        <div className="text-slate-500 text-center py-20">
          Waiting for data from bot ({WS_URL})...
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Chart + sidebar */}
          {data && (
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="h-[500px] min-w-0 flex-1">
                <ErrorBoundary>
                  <PriceChart
                    key={activeKey}
                    ticks={data.ticks}
                    fills={data.fills}
                    tick={data.tick}
                    extraLines={shadowLines ?? undefined}
                  />
                </ErrorBoundary>
              </div>
              <div className="lg:w-72 shrink-0 space-y-4 overflow-y-auto">
                <ErrorBoundary>
                  <Stats tick={data.tick} />
                </ErrorBoundary>
                <ErrorBoundary>
                  <Positions tick={data.tick} fills={data.fills} />
                </ErrorBoundary>
                <ErrorBoundary>
                  <Shadow shadow={data.shadow} onVariantSelect={handleVariantSelect} />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* Strategy list below chart */}
          {keys.length > 1 && (
            <div className="border border-slate-800 rounded-lg mt-4">
              <div className="p-2 text-xs text-slate-500 font-semibold border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
                Strategies ({keys.length})
              </div>
              <div className="divide-y divide-slate-800/50">
                {keys.map((key) => {
                  const d = strategies.get(key);
                  const tick = d?.tick;
                  const mode = tick?.mode;
                  const rawPos = tick?.strategy_state?.positions;
                  const positions = Array.isArray(rawPos) ? rawPos : [];
                  return (
                    <button
                      key={key}
                      onClick={() => setSelected(key)}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-4 transition-colors ${
                        key === activeKey
                          ? "bg-slate-800 text-white"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                      }`}
                    >
                      <span className="truncate font-medium min-w-0 flex-1">{key}</span>
                      {mode && (
                        <span
                          className={`text-[10px] px-1 py-0.5 rounded shrink-0 ${
                            mode === "paper"
                              ? "bg-amber-900/50 text-amber-400"
                              : "bg-emerald-900/50 text-emerald-400"
                          }`}
                        >
                          {mode}
                        </span>
                      )}
                      {tick && (
                        <>
                          <span className="font-mono text-slate-500 shrink-0">{((tick.bid_price + tick.ask_price) * 0.5).toFixed(2)}</span>
                          <span className="font-mono shrink-0 w-12 text-right">
                            {positions.length > 0 ? (
                              <span className="text-blue-400">{positions.length} pos</span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </span>
                          <span className="font-mono text-slate-500 shrink-0 w-16 text-right">{tick.trade_count} trades</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
