"use client";

import useSWR from "swr";

interface StatusData {
  games: { total: number; live: number; lastUpdated: string | null };
  agentRuns: { total: number; lastRun: string | null; lastStatus: string | null };
  teams: { total: number };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function DataStatus() {
  const { data: gamesData } = useSWR<{ games: unknown[]; fetchedAt: string }>(
    "/api/games",
    fetcher,
    { refreshInterval: 60_000 }
  );

  const { data: agentData } = useSWR<{ runs: Array<{ status: string; startedAt: string }> }>(
    "/api/admin/agent",
    fetcher,
    { refreshInterval: 30_000 }
  );

  const totalGames = Array.isArray(gamesData?.games) ? gamesData.games.length : 0;
  const liveGames = Array.isArray(gamesData?.games)
    ? (gamesData.games as Array<{ status: string }>).filter(
        (g) => g.status === "IN_PROGRESS" || g.status === "HALFTIME"
      ).length
    : 0;

  const lastRun = agentData?.runs?.[0];
  const lastStatsRun = agentData?.runs?.find(
    (r) => r.type === "advanced_stats_ingest"
  );

  function timeAgo(iso: string | null | undefined): string {
    if (!iso) return "never";
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatusCard
        label="ESPN Data"
        value={`${totalGames} games (${liveGames} live)`}
        meta={`Updated ${timeAgo(gamesData?.fetchedAt)}`}
        indicator={gamesData ? "green" : "gray"}
      />
      <StatusCard
        label="Agent Runs"
        value={lastRun?.status ?? "—"}
        meta={`Last run ${timeAgo(lastRun?.startedAt)}`}
        indicator={
          lastRun?.status === "SUCCESS"
            ? "green"
            : lastRun?.status === "FAILED"
            ? "red"
            : "gray"
        }
      />
      <StatusCard
        label="Advanced Stats"
        value={lastStatsRun ? (lastStatsRun.status ?? "—") : "Not ingested"}
        meta={
          lastStatsRun
            ? `Last ingest ${timeAgo(lastStatsRun.startedAt)}`
            : "Use ↻ Ingest Advanced Stats to populate"
        }
        indicator={
          lastStatsRun?.status === "SUCCESS"
            ? "green"
            : lastStatsRun?.status === "PARTIAL"
            ? "yellow"
            : lastStatsRun?.status === "FAILED"
            ? "red"
            : "gray"
        }
      />
    </div>
  );
}

function StatusCard({
  label,
  value,
  meta,
  indicator,
}: {
  label: string;
  value: string;
  meta: string;
  indicator: "green" | "yellow" | "red" | "gray";
}) {
  const colors = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    gray: "bg-zinc-600",
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${colors[indicator]}`} />
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold text-zinc-200">{value}</p>
      <p className="text-xs text-zinc-600 mt-0.5">{meta}</p>
    </div>
  );
}
