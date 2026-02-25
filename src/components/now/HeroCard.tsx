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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatRecord(record: { wins: number; losses: number } | null | undefined): string | null {
  if (!record) return null;
  return `${record.wins}-${record.losses}`;
}

interface HeroTeamRowProps {
  name: string;
  ranking?: number | null;
  logoUrl?: string | null;
  record?: { wins: number; losses: number } | null;
  score?: number;
  isWinning: boolean;
}

function HeroTeamRow({ name, ranking, logoUrl, record, score, isWinning }: HeroTeamRowProps) {
  const recordStr = formatRecord(record);

  return (
    <div className={clsx("flex items-center gap-3", isWinning ? "text-white" : "text-zinc-400")}>
      {/* Logo */}
      <div className="shrink-0 w-9 h-9 flex items-center justify-center">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${name} logo`}
            className="w-9 h-9 object-contain"
          />
        ) : (
          <span className="text-sm font-bold bg-zinc-800 rounded-full w-9 h-9 flex items-center justify-center text-zinc-400">
            {name.charAt(0)}
          </span>
        )}
      </div>

      {/* Ranking + Name + Record */}
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-lg truncate">
          {ranking && ranking <= 25 ? (
            <span className={clsx("font-bold mr-0.5", isWinning ? "text-orange-400" : "text-orange-500/60")}>
              #{ranking}{" "}
            </span>
          ) : null}
          {name}
        </span>
        {recordStr && (
          <span className="ml-2 text-sm text-zinc-500">{recordStr}</span>
        )}
      </div>

      {/* Score */}
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
          {!isLive && game.status === "SCHEDULED" && (
            <div className="text-xs text-zinc-400">
              {formatTime(game.scheduledAt)}
            </div>
          )}
        </div>
        <ScoreBadge score={watchScore.score} size="lg" />
      </div>

      {/* Teams */}
      <div className="space-y-2.5 mb-4">
        <HeroTeamRow
          name={game.awayTeam.canonicalName}
          ranking={game.awayTeamRanking}
          logoUrl={game.awayTeam.logoUrl}
          record={game.awayTeamRecord}
          score={ls?.awayScore}
          isWinning={homeWinning === false}
        />
        <HeroTeamRow
          name={game.homeTeam.canonicalName}
          ranking={game.homeTeamRanking}
          logoUrl={game.homeTeam.logoUrl}
          record={game.homeTeamRecord}
          score={ls?.homeScore}
          isWinning={homeWinning === true}
        />
      </div>

      {/* Pregame prediction strip */}
      {!isLive && game.pregamePrediction && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-3 py-2 border-t border-zinc-800/60">
          <span className="text-zinc-500">
            Thrill{" "}
            <span className="text-orange-400 font-semibold">
              {game.pregamePrediction.thrillScore}
            </span>
          </span>
          {(game.pregamePrediction.homeScore > 0 || game.pregamePrediction.awayScore > 0) && (
            <span className="text-zinc-500 tabular-nums">
              Predicted{" "}
              <span className="text-zinc-300">
                {game.awayTeam.canonicalName.split(" ")[0]} {game.pregamePrediction.awayScore}
                {" – "}
                {game.pregamePrediction.homeScore} {game.homeTeam.canonicalName.split(" ")[0]}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Explanation / why it matters */}
      <p className="text-sm text-zinc-300 mb-3">
        {isLive
          ? (game.liveContext?.whyItMatters ?? watchScore.explanation)
          : (game.pregamePrediction?.whyItMatters ?? watchScore.explanation)}
      </p>

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
