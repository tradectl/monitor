"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { MonitorTick, MonitorFill, ShadowSummary, MonitorEvent } from "../types/monitor";

const MAX_TICKS = 7200;
const INITIAL_RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 60_000;

export interface StrategyData {
  tick: MonitorTick | null;
  ticks: MonitorTick[];
  fills: MonitorFill[];
  shadow: ShadowSummary | null;
}

/** Unique key for a fill to deduplicate. */
function fillKey(f: MonitorFill): string {
  return `${f.timestamp_ms}:${f.fill_type}:${f.price}:${f.quantity}`;
}

export function useMonitor(url: string) {
  const [connected, setConnected] = useState(false);
  const [strategies, setStrategies] = useState<Map<string, StrategyData>>(
    new Map()
  );
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>();
  const aliveRef = useRef(false);
  const fillSeenRef = useRef<Set<string>>(new Set());
  const backoffRef = useRef(INITIAL_RECONNECT_DELAY);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!aliveRef.current) return;

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (e) {
      console.error("monitor: failed to create WebSocket:", e);
      setConnected(false);
      if (aliveRef.current) {
        reconnectRef.current = setTimeout(connect, backoffRef.current);
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_RECONNECT_DELAY);
      }
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      if (aliveRef.current) setConnected(true);
      backoffRef.current = INITIAL_RECONNECT_DELAY;
    };
    ws.onclose = () => {
      if (!aliveRef.current) return;
      setConnected(false);
      reconnectRef.current = setTimeout(connect, backoffRef.current);
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_RECONNECT_DELAY);
    };
    ws.onerror = () => ws.close();
    ws.onmessage = (e) => {
      let event: MonitorEvent;
      try {
        event = JSON.parse(e.data);
      } catch {
        console.warn("monitor: malformed WebSocket message, skipping");
        return;
      }

      if (event.type === "Tick") {
        const key = `${event.strategy_name}/${event.symbol}`;
        setStrategies((prev) => {
          const next = new Map(prev);
          const existing = next.get(key) || {
            tick: null,
            ticks: [],
            fills: [],
            shadow: null,
          };
          const ticks = [...existing.ticks, event];
          next.set(key, {
            tick: event,
            ticks: ticks.length > MAX_TICKS ? ticks.slice(-MAX_TICKS) : ticks,
            fills: existing.fills,
            shadow: existing.shadow,
          });
          return next;
        });
      } else if (event.type === "Fill") {
        // Deduplicate fills
        const fk = fillKey(event);
        if (fillSeenRef.current.has(fk)) return;
        fillSeenRef.current.add(fk);

        const key = `${event.strategy_name}/${event.symbol}`;
        setStrategies((prev) => {
          const next = new Map(prev);
          const existing = next.get(key) || {
            tick: null,
            ticks: [],
            fills: [],
            shadow: null,
          };
          next.set(key, {
            ...existing,
            fills: [...existing.fills, event],
          });
          return next;
        });
      } else if (event.type === "Shadow") {
        const key = `${event.strategy_name}/${event.symbol}`;
        setStrategies((prev) => {
          const next = new Map(prev);
          const existing = next.get(key) || {
            tick: null,
            ticks: [],
            fills: [],
            shadow: null,
          };
          next.set(key, {
            ...existing,
            shadow: event,
          });
          return next;
        });
      }
    };
  }, [url]);

  useEffect(() => {
    aliveRef.current = true;
    connect();
    return () => {
      aliveRef.current = false;
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  return { connected, strategies };
}
