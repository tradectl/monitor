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

export type MonitorEvent = MonitorTick | MonitorFill;
