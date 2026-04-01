"use client";
import type { MonitorTick, MonitorFill } from "../types/monitor";

interface PositionData {
  side: string;
  quantity: number;
  avg_entry: number;
  tp_price: number;
  sl_price: number;
}

interface Props {
  tick: MonitorTick | null;
  fills: MonitorFill[];
}

export function Positions({ tick, fills }: Props) {
  const rawPos = tick?.strategy_state?.positions;
  const positions: PositionData[] = Array.isArray(rawPos) ? rawPos : [];

  return (
    <div className="rounded-lg border border-slate-800 p-4 space-y-3">
      <div className="text-sm font-semibold">
        Positions
        {positions.length > 0 && (
          <span className="ml-1 text-slate-500">({positions.length})</span>
        )}
      </div>

      {positions.length === 0 ? (
        <div className="text-xs text-slate-500">No open positions</div>
      ) : (
        <div className="space-y-2">
          {positions.map((pos) => (
            <div
              key={`${pos.side}-${pos.avg_entry}-${pos.quantity}`}
              className="text-xs border border-slate-800 rounded p-2 space-y-1"
            >
              <div className="flex justify-between items-center">
                <span
                  className={`font-medium ${
                    pos.side === "Long" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {pos.side}
                </span>
                <span className="font-mono text-slate-300">
                  qty {pos.quantity}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 font-mono text-slate-400">
                <div>
                  <div className="text-[10px] text-slate-600 uppercase">
                    Entry
                  </div>
                  {pos.avg_entry.toFixed(2)}
                </div>
                <div>
                  <div className="text-[10px] text-emerald-900 uppercase">
                    TP
                  </div>
                  <span className="text-emerald-400">
                    {pos.tp_price.toFixed(2)}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] text-red-900 uppercase">SL</div>
                  <span className="text-red-400">
                    {pos.sl_price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {fills.length > 0 && (
        <>
          <div className="text-sm font-semibold pt-2 border-t border-slate-800">
            Fills ({fills.length})
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {fills
              .slice(-20)
              .reverse()
              .map((f, i) => {
                const time = new Date(f.timestamp_ms).toLocaleTimeString();
                const isEntry = f.fill_type === "entry";
                const isTp = f.fill_type === "tp";
                return (
                  <div
                    key={`${f.timestamp_ms}-${f.fill_type}-${f.price}`}
                    className="text-xs border border-slate-800/50 rounded px-2 py-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold ${
                            isEntry
                              ? "text-blue-400"
                              : isTp
                                ? "text-emerald-400"
                                : "text-red-400"
                          }`}
                        >
                          {f.fill_type.toUpperCase()}
                        </span>
                        <span className="text-slate-500">{f.side}</span>
                      </div>
                      {f.profit_pct !== null && (
                        <span
                          className={`font-mono font-semibold ${
                            f.profit_pct >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {f.profit_pct >= 0 ? "+" : ""}
                          {f.profit_pct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-slate-500 mt-0.5">
                      <span className="font-mono">
                        {f.quantity} @ {f.price.toFixed(2)}
                      </span>
                      <span>{time}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
