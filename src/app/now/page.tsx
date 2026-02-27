"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWatchScore } from "@/hooks/useWatchScore";
import { HeroCard } from "@/components/now/HeroCard";
import { GameList } from "@/components/now/GameList";
import { GameDrawer } from "@/components/now/GameDrawer";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { GameWithState, GameStatus } from "@/types/game";
import type { WatchScoreResult } from "@/types/watchscore";

function getLocalDate(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
}

const STATUS_COLORS = {
  fresh: "bg-green-500",
  stale: "bg-yellow-500",
  error: "bg-red-500",
  loading: "bg-zinc-500 animate-pulse",
};

const STATUS_LABELS = {
  fresh: "Live",
  stale: "Stale",
  error: "Error",
  loading: "Updating…",
};

export type SortKey = "watchScore" | "thrillScore" | "startTime" | "ranked";

function statusGroup(status: GameStatus): number {
  if (status === "IN_PROGRESS" || status === "HALFTIME") return 0;
  if (status === "SCHEDULED") return 1;
  return 2;
}

export function sortGames(
  games: Array<{ game: GameWithState; watchScore: WatchScoreResult }>,
  key: SortKey
) {
  return [...games].sort((a, b) => {
    const groupDiff =
      statusGroup(a.game.status) - statusGroup(b.game.status);
    if (groupDiff !== 0) return groupDiff;

    switch (key) {
      case "thrillScore": {
        const aT = a.game.pregamePrediction?.thrillScore ?? -1;
        const bT = b.game.pregamePrediction?.thrillScore ?? -1;
        return bT - aT;
      }
      case "startTime":
        return (
          new Date(a.game.scheduledAt).getTime() -
          new Date(b.game.scheduledAt).getTime()
        );
      case "ranked": {
        const aR = Math.min(
          a.game.homeTeamRanking ?? 999,
          a.game.awayTeamRanking ?? 999
        );
        const bR = Math.min(
          b.game.homeTeamRanking ?? 999,
          b.game.awayTeamRanking ?? 999
        );
        return aR - bR;
      }
      default:
        return b.watchScore.score - a.watchScore.score;
    }
  });
}

function NowPageInner() {
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get("date") ?? getLocalDate();

  const { data, error, isLoading } = useWatchScore(selectedDate);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("watchScore");

  const refreshStatus: keyof typeof STATUS_COLORS =
    isLoading && !data
      ? "loading"
      : error && !data
      ? "error"
      : error && data
      ? "stale"
      : "fresh";

  if (isLoading && !data) {
    return <LoadingSpinner label="Loading games…" />;
  }

  if (error && !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-sm mb-2">Failed to load games.</p>
        <p className="text-zinc-600 text-xs">
          Make sure the database is running and try refreshing.
        </p>
        <p className="text-zinc-700 text-xs mt-1">{String(error)}</p>
      </div>
    );
  }

  const games = data?.games ?? [];

  // HeroCard always shows the top watch-score game, unaffected by sort selection
  const liveGames = games.filter((g) =>
    ["IN_PROGRESS", "HALFTIME"].includes(g.game.status)
  );
  const topGame = liveGames[0] ?? games[0] ?? null;

  // Sort applied only to the game list
  const sortedGames = sortGames(games, sortKey);

  const selectedEntry =
    games.find((g) => g.game.id === selectedGameId) ?? null;

  return (
    <>
      <div className="space-y-2">
        {/* Refresh status indicator */}
        <div className="flex items-center justify-end gap-1.5 pb-1">
          <span
            className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[refreshStatus]}`}
          />
          <span className="text-xs text-zinc-500">
            {STATUS_LABELS[refreshStatus]}
          </span>
        </div>

        {/* Hero — top recommended game by watch score */}
        {topGame && (
          <HeroCard
            game={topGame.game}
            watchScore={topGame.watchScore}
            onExpand={() => setSelectedGameId(topGame.game.id)}
          />
        )}

        {games.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm">
              No games scheduled for today. Use the date picker to check another
              day.
            </p>
          </div>
        )}

        {/* Sort toolbar + full ranked list */}
        {games.length > 0 && (
          <>
            <div className="flex items-center justify-end gap-2 pt-1">
              <span className="text-xs text-zinc-500">Sort by</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded px-2 py-1 focus:outline-none focus:border-orange-400"
              >
                <option value="watchScore">Watch Score</option>
                <option value="thrillScore">Thrill Score</option>
                <option value="startTime">Start Time</option>
                <option value="ranked">Ranked Matchups</option>
              </select>
            </div>

            <GameList
              games={sortedGames}
              selectedGameId={selectedGameId}
              onSelectGame={(id) =>
                setSelectedGameId((prev) => (prev === id ? null : id))
              }
            />
          </>
        )}
      </div>

      {/* Slide-out detail drawer */}
      {selectedEntry && (
        <GameDrawer
          game={selectedEntry.game}
          watchScore={selectedEntry.watchScore}
          onClose={() => setSelectedGameId(null)}
        />
      )}
    </>
  );
}

export default function NowPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading games…" />}>
      <NowPageInner />
    </Suspense>
  );
}
