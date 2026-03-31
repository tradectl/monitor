export interface PriceLine {
  label: string;
  price: number;
  color: string;
  /** "solid", "dashed", or "dotted" */
  style: string;
  line_width: number;
  axis_label: boolean;
}

export interface MonitorTick {
  type: "Tick";
  timestamp_ms: number;
  strategy_name: string;
  mode: string;
  symbol: string;
  bid_price: number;
  ask_price: number;
  balance: number;
  trade_count: number;
  /** Price lines provided by the strategy (TP, SL, entry, limit, etc). */
  price_lines: PriceLine[];
  /** Strategy-specific state for the info panel. */
  strategy_state: Record<string, unknown>;
}

export interface MonitorFill {
  type: "Fill";
  timestamp_ms: number;
  strategy_name: string;
  symbol: string;
  side: string;
  price: number;
  quantity: number;
  fill_type: "entry" | "tp" | "sl";
  profit_pct: number | null;
  profit_usd: number | null;
}

export interface ShadowTrialResult {
  variant: string;
  trade_count: number;
  pnl: number;
  pnl_pct: number;
  max_drawdown_pct: number;
  score: number;
  eligible: boolean;
}

export interface ShadowPosition {
  side: string;
  avg_entry: number;
  quantity: number;
  entry_count: number;
}

export interface ShadowExit {
  id: string;
  price: number;
  kind: string;
}

export interface ShadowPendingEntry {
  side: string;
  price: number;
  size: number;
}

export interface ShadowTrade {
  entry_price: number;
  exit_price: number;
  pnl_pct: number;
  side: string;
  exit_time: number;
}

export interface ShadowVariantDetail {
  variant: string;
  position: ShadowPosition | null;
  active_exits: ShadowExit[];
  pending_entry: ShadowPendingEntry | null;
  balance: number;
  win_count: number;
  loss_count: number;
  avg_win_pct: number;
  avg_loss_pct: number;
  recent_trades: ShadowTrade[];
}

export interface ShadowSummary {
  type: "Shadow";
  timestamp_ms: number;
  strategy_name: string;
  symbol: string;
  window_secs: number;
  results: ShadowTrialResult[];
  details?: ShadowVariantDetail[];
}

export type MonitorEvent = MonitorTick | MonitorFill | ShadowSummary;
