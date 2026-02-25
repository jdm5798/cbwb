"use client";

import { clsx } from "clsx";
import { GameWithState } from "@/types/game";
import { WatchScoreResult } from "@/types/watchscore";
import { ScoreBadge } from "@/components/shared/ScoreBadge";

interface GameCardProps {
  game: GameWithState;
  watchScore: WatchScoreResult;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
}

function statusLabel(game: GameWithState): { text: string; color: string } {
  switch (game.status) {
    case "IN_PROGRESS":
      return {
        text: game.liveState
          ? `${periodLabel(game.liveState.period)} · ${game.liveState.clockDisplay ?? ""}`
          : "LIVE",
        color: "text-green-400",
      };
    case "HALFTIME":
      return { text: "Halftime", color: "text-yellow-400" };
    case "FINAL":
      return { text: "Final", color: "text-zinc-500" };
    case "SCHEDULED":
      return { text: formatTime(game.scheduledAt), color: "text-zinc-400" };
    default:
      return { text: game.status, color: "text-zinc-500" };
  }
}

function periodLabel(period: number): string {
  if (period === 1) return "1st";
  if (period === 2) return "2nd";
  if (period === 3) return "OT";
  return `${period - 2}OT`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatRanking(rank: number | null | undefined, name: string): string {
  if (rank && rank <= 25) return `#${rank} ${name}`;
  return name;
}

export function GameCard({ game, watchScore, rank, isSelected, onClick }: GameCardProps) {
  const isLive = ["IN_PROGRESS", "HALFTIME"].includes(game.status);
  const status = statusLabel(game);
  const margin = game.liveState
    ? Math.abs(game.liveState.homeScore - game.liveState.awayScore)
    : null;

  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full text-left rounded-lg border px-4 py-3 transition-colors",
        isSelected
          ? "border-orange-500/60 bg-orange-950/20"
          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900",
        !isLive && "opacity-70"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Rank */}
        <span className="text-zinc-600 text-sm w-5 text-center font-mono">
          {game.status !== "FINAL" ? rank : "—"}
        </span>

        {/* Score badge */}
        <ScoreBadge score={watchScore.score} size="sm" />

        {/* Game info */}
        <div className="flex-1 min-w-0">
          {/* Teams + score */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-zinc-100 truncate">
              {formatRanking(game.awayTeamRanking, game.awayTeam.canonicalName)}
              {" @ "}
              {formatRanking(game.homeTeamRanking, game.homeTeam.canonicalName)}
            </span>
            {isLive && game.liveState && (
              <span className="text-sm font-bold tabular-nums text-white shrink-0">
                {game.liveState.awayScore}–{game.liveState.homeScore}
              </span>
            )}
          </div>

          {/* Status + explanation */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className={clsx("text-xs shrink-0", status.color)}>
              {status.text}
            </span>
            {(isLive || game.status === "SCHEDULED") && (
              <span className="text-xs text-zinc-500 truncate">
                · {watchScore.explanation}
              </span>
            )}
          </div>
        </div>

        {/* TV channel */}
        {game.tvNetwork && (
          <span className="text-xs text-zinc-400 bg-zinc-800 rounded px-2 py-0.5 shrink-0">
            {game.tvNetwork}
          </span>
        )}

        {/* Close game indicator */}
        {isLive && margin !== null && margin <= 5 && (
          <span className="text-xs text-red-400 font-bold shrink-0">
            {margin === 0 ? "TIE" : `±${margin}`}
          </span>
        )}
      </div>
    </button>
  );
}
