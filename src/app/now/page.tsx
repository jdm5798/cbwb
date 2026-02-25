"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWatchScore } from "@/hooks/useWatchScore";
import { HeroCard } from "@/components/now/HeroCard";
import { GameList } from "@/components/now/GameList";
import { GameDrawer } from "@/components/now/GameDrawer";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

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

function NowPageInner() {
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get("date") ?? getLocalDate();

  const { data, error, isLoading } = useWatchScore(selectedDate);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

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
  const liveGames = games.filter((g) =>
    ["IN_PROGRESS", "HALFTIME"].includes(g.game.status)
  );
  const topGame = liveGames[0] ?? games[0] ?? null;

  const selectedEntry =
    games.find((g) => g.game.id === selectedGameId) ?? null;

  return (
    <>
      <div className="space-y-2">
        {/* Refresh status indicator */}
        <div className="flex items-center justify-end gap-1.5 pb-1">
          <span className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[refreshStatus]}`} />
          <span className="text-xs text-zinc-500">{STATUS_LABELS[refreshStatus]}</span>
        </div>

        {/* Hero — top recommended game */}
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

        {/* Full ranked list */}
        {games.length > 0 && (
          <GameList
            games={games}
            selectedGameId={selectedGameId}
            onSelectGame={(id) =>
              setSelectedGameId((prev) => (prev === id ? null : id))
            }
          />
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
