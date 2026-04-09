# @tradectl/monitor

Real-time WebSocket dashboard for monitoring live trading bots. Client-side only — connects directly to the bot's MonitorBroadcaster.

## Stack

- **Framework**: Next.js 14 (App Router), React 18
- **Charting**: Lightweight Charts 4.1
- **Styling**: TailwindCSS
- **Port**: 3002 (dev and prod)

## Architecture

```
Monitor Dashboard (port 3002)
    │
    └── WebSocket client
            │
            └── Bot's MonitorBroadcaster (port 9100)
                    │
                    └── Runner broadcasts: Tick, Fill, Shadow events
```

No server-side API calls. The dashboard connects directly to the bot's WebSocket server. Multiple dashboards can connect to the same bot simultaneously (broadcast channel).

## Components

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main dashboard page |
| `src/app/layout.tsx` | Root layout with metadata |
| `src/components/connection.tsx` | WebSocket connection status indicator |
| `src/components/stats.tsx` | Strategy performance stats (balance, trades, PnL) |
| `src/components/positions.tsx` | Active positions table (entry, TP, SL, unrealized PnL) |
| `src/components/price-chart.tsx` | Lightweight Charts candlestick + price line overlays + fill markers |
| `src/components/shadow.tsx` | Shadow variant results table (scores, details) |
| `src/components/error-boundary.tsx` | React error boundary wrapper |
| `src/hooks/use-monitor.ts` | WebSocket client hook (connection, parsing, state) |
| `src/types/monitor.ts` | TypeScript interfaces for all message types |

## use-monitor Hook

**Connection**: Auto-reconnect with exponential backoff (3s initial, doubling to 60s max).

**State**: `Map<string, StrategyData>` keyed by `{strategy_name}/{symbol}`.
- `StrategyData`: `{ tick, ticks[], fills[], shadow }`
- Tick buffer: 7200 max (MAX_TICKS) — ~2 hours at 1 tick/sec
- Fill dedup: composite key `${timestamp_ms}:${fill_type}:${price}:${quantity}`

**Returns**: `{ connected: boolean, strategies: Map<string, StrategyData> }`.

## Message Types

Messages are JSON-encoded, field names are **snake_case** (from Rust serde serialization).

**MonitorTick** (`type: "Tick"`):
- `strategy_name`, `mode`, `symbol`, `bid`, `ask`, `balance`, `trade_count`
- `price_lines: PriceLine[]` — chart overlays from strategy's `monitor_snapshot()`
- `strategy_state: object` — arbitrary JSON from strategy's `MonitorSnapshot.state`

**MonitorFill** (`type: "Fill"`):
- `symbol`, `side`, `price`, `quantity`, `fill_type` (entry/tp/sl)
- `profit_pct?`, `profit_usd?` — present on exit fills
- `exit_id?`, `is_partial`, `position_closed`

**ShadowSummary** (`type: "Shadow"`):
- Shadow variant evaluation results, scores, details

## Build & Dev

```bash
npm install && npm run dev     # hot reload (port 3002)
npm run build && npm start     # production build
```

No environment variables required. WebSocket URL is configured in the UI.

## Gotchas

- **Message field names are snake_case** from Rust serde — the TypeScript interfaces must match exactly (e.g., `strategy_name`, `timestamp_ms`, `is_buyer_maker`).
- **Fill deduplication** uses a composite key — two real fills with identical timestamp, type, price, and quantity will be deduplicated (dropped). This is a known trade-off for simplicity.
- **Tick buffer is capped at 7200** — older ticks are discarded. At 1 tick/sec this is ~2 hours of history.
- **MonitorBroadcaster has zero overhead** when no clients are connected (broadcast channel drops messages with no receivers).
- **Multiple dashboards** can connect simultaneously — the bot uses a broadcast channel, not point-to-point.
