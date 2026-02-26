"use client";

import { useState } from "react";
import useSWR from "swr";
import { clsx } from "clsx";

interface AgentRun {
  id: string;
  type: string;
  provider: string | null;
  status: string;
  logs: string[];
  summary: string | null;
  startedAt: string;
  completedAt: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "text-green-400",
  FAILED: "text-red-400",
  RUNNING: "text-yellow-400 animate-pulse",
  PARTIAL: "text-orange-400",
};

export function AgentRunHistory() {
  const { data, mutate } = useSWR<{ runs: AgentRun[] }>(
    "/api/admin/agent",
    fetcher,
    { refreshInterval: 15_000 }
  );
  const [triggering, setTriggering] = useState(false);
  const [triggeringStats, setTriggeringStats] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function triggerIngest() {
    setTriggering(true);
    try {
      await fetch("/api/admin/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await mutate();
    } finally {
      setTriggering(false);
    }
  }

  async function triggerAdvancedStatsIngest() {
    setTriggeringStats(true);
    try {
      await fetch("/api/admin/ingest/advanced-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providers: ["barttorvik", "haslametrics"] }),
      });
      await mutate();
    } finally {
      setTriggeringStats(false);
    }
  }

  const runs = data?.runs ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-200">Agent Run History</h3>
        <div className="flex gap-2">
          <button
            onClick={triggerAdvancedStatsIngest}
            disabled={triggeringStats}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-orange-300 px-3 py-1 border border-zinc-700 rounded font-semibold"
          >
            {triggeringStats ? "Fetching Stats…" : "↻ Ingest Advanced Stats"}
          </button>
          <button
            onClick={triggerIngest}
            disabled={triggering}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 px-3 py-1 border border-zinc-700 rounded font-semibold"
          >
            {triggering ? "Fetching…" : "↻ Fetch ESPN Now"}
          </button>
        </div>
      </div>

      {runs.length === 0 && (
        <p className="text-zinc-600 text-sm">No runs yet. Click "Fetch ESPN Now" to start.</p>
      )}

      <div className="space-y-2">
        {runs.map((run) => (
          <div
            key={run.id}
            className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
          >
            <button
              className="w-full text-left px-4 py-3 flex items-center gap-3"
              onClick={() => setExpanded((prev) => (prev === run.id ? null : run.id))}
            >
              <span className={clsx("text-xs font-bold w-16 shrink-0", STATUS_COLORS[run.status] ?? "text-zinc-400")}>
                {run.status}
              </span>
              <span className="text-sm text-zinc-300 flex-1 truncate">
                {run.type}
                {run.provider ? ` · ${run.provider}` : ""}
              </span>
              <span className="text-xs text-zinc-600 shrink-0">
                {new Date(run.startedAt).toLocaleTimeString()}
              </span>
            </button>

            {expanded === run.id && (
              <div className="border-t border-zinc-800 px-4 py-3 space-y-2">
                {run.summary && (
                  <p className="text-xs text-zinc-400">{run.summary}</p>
                )}
                {run.logs && run.logs.length > 0 && (
                  <pre className="text-xs text-zinc-600 font-mono bg-zinc-950 rounded p-3 overflow-x-auto max-h-48 overflow-y-auto">
                    {Array.isArray(run.logs)
                      ? run.logs.join("\n")
                      : String(run.logs)}
                  </pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
