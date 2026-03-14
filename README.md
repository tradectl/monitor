# tradectl-monitor

Real-time trading strategy monitor for [tradectl](https://tradectl.com). Connects to a running bot's WebSocket server and displays live price charts, strategy state, positions, and fill events.

![Next.js](https://img.shields.io/badge/Next.js_14-000?logo=nextdotjs) ![TradingView](https://img.shields.io/badge/Lightweight_Charts-2962FF?logo=tradingview&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

## Quick start

```bash
npm install
npm run dev
```

Opens on [http://localhost:3002](http://localhost:3002). Connects to `ws://localhost:9100` by default (configurable via `NEXT_PUBLIC_WS_URL`).

## What it shows

- **Price chart** — live mid-price line with strategy-defined price lines (TP, SL, entry, limit, corridors) rendered as overlays. Uses [Lightweight Charts](https://github.com/nicenemo/lightweight-charts).
- **Fill markers** — entry/TP/SL fills shown as colored arrows on the chart.
- **Stats panel** — strategy name, mode (live/paper), symbol, bid/ask, balance, trade count, and any strategy-specific state.
- **Positions panel** — open positions with entry/TP/SL prices, and recent fill history with PnL.
- **Multi-strategy** — when a bot runs multiple strategies, a selector at the bottom lets you switch between them.

## How it works

The monitor is a read-only WebSocket client. The bot's `MonitorBroadcaster` (from [tradectl-sdk](https://github.com/nicenemo/tradectl-sdk)) sends two event types:

**`Tick`** — broadcast on every price update:
```json
{
  "type": "Tick",
  "timestamp_ms": 1710460800000,
  "strategy_name": "moonshot",
  "mode": "live",
  "symbol": "BTCUSDT",
  "bid_price": 67150.0,
  "ask_price": 67150.5,
  "balance": 10250.0,
  "trade_count": 42,
  "price_lines": [
    { "label": "TP", "price": 67800.0, "color": "#22c55e", "style": "dashed", "line_width": 1, "axis_label": true },
    { "label": "SL", "price": 66500.0, "color": "#ef4444", "style": "dashed", "line_width": 1, "axis_label": true }
  ],
  "strategy_state": { "corridor_width": 0.015, "positions": [...] }
}
```

**`Fill`** — broadcast on order fills:
```json
{
  "type": "Fill",
  "timestamp_ms": 1710460800000,
  "strategy_name": "moonshot",
  "symbol": "BTCUSDT",
  "side": "Long",
  "price": 67150.5,
  "quantity": 0.01,
  "fill_type": "entry",
  "profit_pct": null,
  "profit_usd": null
}
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:9100` | WebSocket URL of the bot's monitor server |

## Stack

- **Next.js 14** (App Router) — React framework
- **Lightweight Charts** — TradingView charting library
- **Tailwind CSS** — styling
- **TypeScript** — type safety

## License

Proprietary. See LICENSE for details.
