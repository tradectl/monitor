"use client";
import { useState, useEffect, useMemo } from "react";
import type { ShadowSummary, ShadowTrialResult, ShadowVariantDetail, PriceLine } from "../types/monitor";

type SortKey = "score" | "pnl_pct" | "trade_count" | "max_drawdown_pct";

interface Props {
  shadow: ShadowSummary | null;
  onVariantSelect: (lines: PriceLine[] | null) => void;
}

function formatDuration(secs: number): string {
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Safe toFixed — treats null/NaN/Infinity as 0. */
function n(v: number | null | undefined, digits = 2): string {
  return (v != null && isFinite(v) ? v : 0).toFixed(digits);
}

const SORT_LABELS: Record<SortKey, string> = {
  score: "Score",
  pnl_pct: "PnL",
  trade_count: "Trades",
  max_drawdown_pct: "DD",
};

function buildOverlayLines(detail: ShadowVariantDetail): PriceLine[] {
  const lines: PriceLine[] = [];
  if (detail.position) {
    lines.push({
      label: `SH:Entry`,
      price: detail.position.avg_entry,
      color: "#a855f7",
      style: "dashed",
      line_width: 1,
      axis_label: true,
    });
  }
  for (const exit of detail.active_exits) {
    const isTp = exit.kind === "tp";
    lines.push({
      label: `SH:${exit.id}`,
      price: exit.price,
      color: isTp ? "#a3e635" : "#f97316",
      style: "dotted",
      line_width: 1,
      axis_label: true,
    });
  }
  if (detail.pending_entry) {
    lines.push({
      label: "SH:Limit",
      price: detail.pending_entry.price,
      color: "#818cf8",
      style: "dotted",
      line_width: 1,
      axis_label: true,
    });
  }
  return lines;
}

export function Shadow({ shadow, onVariantSelect }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    if (!shadow) return [];
    const arr = [...shadow.results];
    arr.sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return arr;
  }, [shadow, sortKey, sortAsc]);

  const detail: ShadowVariantDetail | undefined = useMemo(
    () => shadow?.details?.find((d) => d.variant === selected),
    [shadow, selected],
  );

  // Push overlay lines when selection or detail changes
  useEffect(() => {
    if (detail) {
      onVariantSelect(buildOverlayLines(detail));
    } else {
      onVariantSelect(null);
    }
  }, [detail, onVariantSelect]);

  if (!shadow || shadow.results.length === 0) return null;

  // ── Detail view ──────────────────────────────────────────────
  if (selected) {
    const result = shadow.results.find((r) => r.variant === selected);
    return (
      <div className="rounded-lg border border-slate-800 p-4 space-y-3">
        <button
          onClick={() => setSelected(null)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
        >
          <span>&larr;</span>
          <span className="truncate max-w-[200px]" title={selected}>{selected}</span>
        </button>

        {/* Summary metrics */}
        {result && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-slate-500">PnL</div>
              <div className={`font-mono font-semibold ${result.pnl_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {result.pnl_pct >= 0 ? "+" : ""}{n(result.pnl_pct)}%
              </div>
            </div>
            <div>
              <div className="text-slate-500">Score</div>
              <div className="font-mono">{n(result.score)}</div>
            </div>
            <div>
              <div className="text-slate-500">DD</div>
              <div className="font-mono text-red-400">{n(result.max_drawdown_pct, 1)}%</div>
            </div>
          </div>
        )}

        {detail ? (
          <>
            {/* Position */}
            <div className="border-t border-slate-800 pt-2">
              <div className="text-[10px] text-slate-500 mb-1">Position</div>
              {detail.position ? (
                <div className="text-xs font-mono space-y-0.5">
                  <div className="flex justify-between">
                    <span className={detail.position.side === "Long" ? "text-emerald-400" : "text-red-400"}>
                      {detail.position.side}
                    </span>
                    <span className="text-slate-300">qty {n(detail.position.quantity, 4)}</span>
                  </div>
                  <div className="text-slate-400">
                    entry {n(detail.position.avg_entry)} ({detail.position.entry_count}x)
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-600">No position</div>
              )}
            </div>

            {/* Exits */}
            {detail.active_exits.length > 0 && (
              <div className="border-t border-slate-800 pt-2">
                <div className="text-[10px] text-slate-500 mb-1">Exits</div>
                <div className="space-y-0.5">
                  {detail.active_exits.map((e) => (
                    <div key={e.id} className="text-xs font-mono flex justify-between">
                      <span className={e.kind === "tp" ? "text-emerald-400" : "text-red-400"}>
                        {e.id} ({e.kind.toUpperCase()})
                      </span>
                      <span className="text-slate-300">{n(e.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending entry */}
            {detail.pending_entry && (
              <div className="border-t border-slate-800 pt-2">
                <div className="text-[10px] text-slate-500 mb-1">Pending Entry</div>
                <div className="text-xs font-mono text-indigo-400">
                  {detail.pending_entry.side} limit @ {n(detail.pending_entry.price)} (size {detail.pending_entry.size})
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="border-t border-slate-800 pt-2">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-slate-500">Balance</div>
                  <div className="font-mono">{n(detail.balance)}</div>
                </div>
                <div>
                  <div className="text-slate-500">W/L</div>
                  <div className="font-mono">
                    <span className="text-emerald-400">{detail.win_count}</span>
                    /
                    <span className="text-red-400">{detail.loss_count}</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Avg W/L</div>
                  <div className="font-mono text-[10px]">
                    <span className="text-emerald-400">{n(detail.avg_win_pct, 1)}%</span>
                    /
                    <span className="text-red-400">{n(detail.avg_loss_pct, 1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent trades */}
            {detail.recent_trades.length > 0 && (
              <div className="border-t border-slate-800 pt-2">
                <div className="text-[10px] text-slate-500 mb-1">Recent Trades ({detail.recent_trades.length})</div>
                <div className="space-y-0.5 max-h-32 overflow-y-auto">
                  {detail.recent_trades.map((t, i) => (
                    <div key={i} className="text-[10px] font-mono flex items-center justify-between px-1">
                      <span className={t.side === "Long" ? "text-emerald-400" : "text-red-400"}>
                        {n(t.entry_price, 1)}&rarr;{n(t.exit_price, 1)}
                      </span>
                      <span className={`font-semibold ${t.pnl_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {t.pnl_pct >= 0 ? "+" : ""}{n(t.pnl_pct)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-xs text-slate-600 border-t border-slate-800 pt-2">
            Detail not available (outside top 5)
          </div>
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────
  return (
    <div className="rounded-lg border border-slate-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Shadow</span>
        <span className="text-xs text-slate-500">
          {shadow.results.length} variants &middot; {formatDuration(shadow.window_secs)}
        </span>
      </div>

      {/* Sort controls */}
      <div className="flex gap-1">
        {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              if (sortKey === key) setSortAsc(!sortAsc);
              else { setSortKey(key); setSortAsc(false); }
            }}
            className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
              sortKey === key
                ? "bg-slate-700 text-white"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
            }`}
          >
            {label}{sortKey === key ? (sortAsc ? " \u2191" : " \u2193") : ""}
          </button>
        ))}
      </div>

      {/* Variant list */}
      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {sorted.map((r, i) => (
          <button
            key={r.variant}
            onClick={() => setSelected(r.variant)}
            className={`w-full text-left text-xs rounded px-2 py-1.5 transition-colors ${
              r.eligible
                ? "border border-slate-800/50 hover:bg-slate-800/50"
                : "text-slate-600 hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`truncate max-w-[140px] ${r.eligible ? "text-slate-300" : ""}`} title={r.variant}>
                {i === 0 && sortKey === "score" && !sortAsc && (
                  <span className="text-amber-400 mr-1">#1</span>
                )}
                {r.variant}
              </span>
              <span
                className={`font-mono font-semibold shrink-0 ${
                  r.pnl_pct >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {r.pnl_pct >= 0 ? "+" : ""}
                {n(r.pnl_pct)}%
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5 font-mono">
              <span>{r.trade_count}t</span>
              <span>dd {n(r.max_drawdown_pct, 1)}%</span>
              <span>score {n(r.score)}</span>
              {!r.eligible && <span className="text-slate-700">pending</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
