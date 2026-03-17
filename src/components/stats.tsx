"use client";
import type { MonitorTick } from "../types/monitor";

interface Props {
  tick: MonitorTick | null;
}

export function Stats({ tick }: Props) {
  if (!tick) {
    return (
      <div className="rounded-lg border border-slate-800 p-4 text-slate-500">
        Waiting for data...
      </div>
    );
  }

  const ss = tick.strategy_state ?? {};

  return (
    <div className="rounded-lg border border-slate-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">{tick.strategy_name}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            tick.mode === "paper"
              ? "bg-amber-900/50 text-amber-400"
              : "bg-emerald-900/50 text-emerald-400"
          }`}
        >
          {tick.mode}
        </span>
      </div>

      <div className="text-sm text-slate-400">{tick.symbol}</div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-slate-500">Bid</div>
          <div className="font-mono">{tick.bid_price?.toFixed(2) ?? "—"}</div>
        </div>
        <div>
          <div className="text-slate-500">Ask</div>
          <div className="font-mono">{tick.ask_price?.toFixed(2) ?? "—"}</div>
        </div>
        <div>
          <div className="text-slate-500">Balance</div>
          <div className="font-mono">{tick.balance?.toFixed(2) ?? "—"}</div>
        </div>
        <div>
          <div className="text-slate-500">Trades</div>
          <div className="font-mono">{tick.trade_count ?? 0}</div>
        </div>
      </div>

      {Object.keys(ss).length > 0 && (
        <div className="border-t border-slate-800 pt-2">
          <div className="text-xs text-slate-500 mb-1">Params</div>
          <div className="grid grid-cols-2 gap-1 text-xs font-mono">
            {Object.entries(ss).map(([key, val]) => {
              if (key === "positions" || val == null || typeof val === "object") return null;
              const display = typeof val === "number" ? val.toFixed(3) : String(val);
              return (
                <div key={key}>
                  {key}: {display}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
