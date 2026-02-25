import { clsx } from "clsx";
import { GameWithState } from "@/types/game";
import { WatchScoreResult } from "@/types/watchscore";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { FactorChip } from "@/components/shared/FactorChip";

interface HeroCardProps {
  game: GameWithState;
  watchScore: WatchScoreResult;
  onExpand: () => void;
}

function periodLabel(period: number): string {
  if (period === 1) return "1st";
  if (period === 2) return "2nd";
  if (period === 3) return "OT";
  return `${period - 2}OT`;
}

function teamDisplay(
  name: string,
  ranking: number | null | undefined,
  score: number | undefined,
  isWinning: boolean
) {
  return (
    <div className={clsx("flex items-center justify-between gap-3", isWinning ? "text-white" : "text-zinc-400")}>
      <span className="font-semibold text-lg truncate">
        {ranking && ranking <= 25 ? `#${ranking} ` : ""}
        {name}
      </span>
      {score !== undefined && (
        <span className="text-2xl font-bold tabular-nums shrink-0">{score}</span>
      )}
    </div>
  );
}

export function HeroCard({ game, watchScore, onExpand }: HeroCardProps) {
  const isLive = ["IN_PROGRESS", "HALFTIME"].includes(game.status);
  const ls = game.liveState;

  const homeWinning = ls ? ls.homeScore >= ls.awayScore : null;

  return (
    <div className="rounded-xl border border-orange-500/40 bg-gradient-to-br from-orange-950/20 to-zinc-900 p-5 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">
            📺 Switch to This Game
          </div>
          {isLive && ls && (
            <div className="text-xs text-zinc-400">
              {periodLabel(ls.period)}
              {ls.clockDisplay ? ` · ${ls.clockDisplay}` : ""}
              {ls.leadChanges > 0 ? ` · ${ls.leadChanges} lead changes` : ""}
            </div>
          )}
        </div>
        <ScoreBadge score={watchScore.score} size="lg" />
      </div>

      {/* Teams */}
      <div className="space-y-2 mb-4">
        {teamDisplay(
          game.awayTeam.canonicalName,
          game.awayTeamRanking,
          ls?.awayScore,
          homeWinning === false
        )}
        {teamDisplay(
          game.homeTeam.canonicalName,
          game.homeTeamRanking,
          ls?.homeScore,
          homeWinning === true
        )}
      </div>

      {/* Explanation */}
      <p className="text-sm text-zinc-300 mb-3">{watchScore.explanation}</p>

      {/* Factor chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {Object.entries(watchScore.factorContributions)
          .sort(([, a], [, b]) => b - a)
          .map(([key, val]) => (
            <FactorChip key={key} label={key} value={val} />
          ))}
      </div>

      {/* Bottom row: channel + details button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {game.tvNetwork && (
            <span className="text-sm font-semibold text-zinc-200 bg-zinc-800 border border-zinc-700 rounded px-3 py-1">
              📡 {game.tvNetwork}
            </span>
          )}
        </div>
        <button
          onClick={onExpand}
          className="text-sm text-orange-400 hover:text-orange-300 underline underline-offset-2"
        >
          Full details →
        </button>
      </div>
    </div>
  );
}
