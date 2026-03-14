"use client";

interface Props {
  connected: boolean;
}

export function ConnectionStatus({ connected }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`w-2 h-2 rounded-full ${
          connected ? "bg-emerald-400" : "bg-red-400 animate-pulse"
        }`}
      />
      <span className="text-slate-400">
        {connected ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
}
