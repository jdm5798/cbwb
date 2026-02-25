"use client";

import { GameWithState } from "@/types/game";
import { WatchScoreResult } from "@/types/watchscore";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { FactorChip } from "@/components/shared/FactorChip";

interface GameDrawerProps {
  game: GameWithState;
  watchScore: WatchScoreResult;
  onClose: () => void;
}

function periodLabel(period: number): string {
  if (period === 1) return "1st Half";
  if (period === 2) return "2nd Half";
  if (period === 3) return "Overtime";
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

const FACTOR_DESCRIPTIONS: Record<string, string> = {
  closeness: "How close the score is. Tied games score highest.",
  time_remaining: "How late in the game it is. Final minutes score highest.",
  lead_changes: "How many times the lead has changed hands.",
  upset_likelihood: "Whether an underdog or unranked team could pull off an upset.",
  ranked_stakes: "Whether ranked teams are involved.",
  tourney_implications: "Tournament / postseason implications.",
};

export function GameDrawer({ game, watchScore, onClose }: GameDrawerProps) {
  const isLive = ["IN_PROGRESS", "HALFTIME"].includes(game.status);
  const ls = game.liveState;

  const awayRecord = formatRecord(game.awayTeamRecord);
  const homeRecord = formatRecord(game.homeTeamRecord);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Panel */}
      <div
        className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto p-5 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 text-lg"
        >
          ✕
        </button>

        {/* Header — teams with logos, records */}
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            {isLive ? "Live" : formatTime(game.scheduledAt)}
          </div>

          <div className="space-y-2">
            {/* Away team */}
            <div className="flex items-center gap-2">
              {game.awayTeam.logoUrl && (
                <img
                  src={game.awayTeam.logoUrl}
                  alt={`${game.awayTeam.canonicalName} logo`}
                  className="w-7 h-7 object-contain shrink-0"
                />
              )}
              <span className="font-bold text-base text-white">
                {game.awayTeamRanking && game.awayTeamRanking <= 25 ? (
                  <span className="text-orange-400">#{game.awayTeamRanking} </span>
                ) : null}
                {game.awayTeam.canonicalName}
              </span>
              {awayRecord && (
                <span className="text-xs text-zinc-500 ml-auto shrink-0">{awayRecord}</span>
              )}
            </div>

            {/* Home team */}
            <div className="flex items-center gap-2">
              {game.homeTeam.logoUrl && (
                <img
                  src={game.homeTeam.logoUrl}
                  alt={`${game.homeTeam.canonicalName} logo`}
                  className="w-7 h-7 object-contain shrink-0"
                />
              )}
              <span className="font-bold text-base text-white">
                {game.homeTeamRanking && game.homeTeamRanking <= 25 ? (
                  <span className="text-orange-400">#{game.homeTeamRanking} </span>
                ) : null}
                {game.homeTeam.canonicalName}
              </span>
              {homeRecord && (
                <span className="text-xs text-zinc-500 ml-auto shrink-0">{homeRecord}</span>
              )}
            </div>
          </div>
        </div>

        {/* Live score block */}
        {isLive && ls && (
          <div className="bg-zinc-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">
                {periodLabel(ls.period)}
                {ls.clockDisplay ? ` · ${ls.clockDisplay}` : ""}
              </span>
              <span className="text-xs text-green-400 font-semibold">● LIVE</span>
            </div>
            <div className="flex justify-around text-center">
              <div>
                <div className="text-xs text-zinc-400 mb-1">
                  {game.awayTeam.canonicalName}
                </div>
                <div className="text-4xl font-bold tabular-nums">{ls.awayScore}</div>
              </div>
              <div className="flex items-center text-zinc-600 text-2xl">—</div>
              <div>
                <div className="text-xs text-zinc-400 mb-1">
                  {game.homeTeam.canonicalName}
                </div>
                <div className="text-4xl font-bold tabular-nums">{ls.homeScore}</div>
              </div>
            </div>
            {ls.leadChanges > 0 && (
              <div className="text-center text-xs text-zinc-500 mt-2">
                {ls.leadChanges} lead change{ls.leadChanges !== 1 ? "s" : ""}
              </div>
            )}
            {ls.winProbHome !== null && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>{game.awayTeam.canonicalName}</span>
                  <span>Win Probability</span>
                  <span>{game.homeTeam.canonicalName}</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full transition-all"
                    style={{ width: `${ls.winProbHome * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-zinc-400 mt-1">
                  <span>{Math.round((1 - ls.winProbHome) * 100)}%</span>
                  <span>{Math.round(ls.winProbHome * 100)}%</span>
                </div>
              </div>
            )}

            {/* Live why it matters */}
            {game.liveContext?.whyItMatters && (
              <p className="text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-800">
                {game.liveContext.whyItMatters}
              </p>
            )}
          </div>
        )}

        {/* Pregame prediction block */}
        {!isLive && game.pregamePrediction && (
          <div className="bg-zinc-900 rounded-lg p-4">
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">
              Pregame Preview
              <span className="ml-2 text-zinc-700 normal-case font-normal tracking-normal">
                ~ placeholder data
              </span>
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <div className="text-xs text-zinc-500 mb-0.5">Thrill Score</div>
                <div className="text-lg font-bold text-orange-400">
                  {game.pregamePrediction.thrillScore}
                </div>
              </div>
              {(game.pregamePrediction.homeScore > 0 || game.pregamePrediction.awayScore > 0) && (
                <div>
                  <div className="text-xs text-zinc-500 mb-0.5">Predicted Final</div>
                  <div className="text-base font-semibold text-zinc-200 tabular-nums">
                    {game.awayTeam.canonicalName.split(" ")[0]} {game.pregamePrediction.awayScore}
                    <span className="text-zinc-500 mx-1">–</span>
                    {game.pregamePrediction.homeScore} {game.homeTeam.canonicalName.split(" ")[0]}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-800">
              {game.pregamePrediction.whyItMatters}
            </p>
          </div>
        )}

        {/* Channel */}
        {game.tvNetwork && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Watching on</span>
            <span className="font-semibold text-zinc-100 bg-zinc-800 border border-zinc-700 rounded px-3 py-1">
              📡 {game.tvNetwork}
            </span>
          </div>
        )}

        {/* Watch Score breakdown */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <ScoreBadge score={watchScore.score} size="md" />
            <div>
              <div className="text-sm font-semibold text-zinc-200">Watch Score</div>
              <div className="text-xs text-zinc-500">{watchScore.explanation}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(watchScore.factorContributions)
              .sort(([, a], [, b]) => b - a)
              .map(([key, val]) => (
                <FactorChip key={key} label={key} value={val} />
              ))}
          </div>

          {/* Factor breakdown table */}
          <div className="space-y-1">
            {Object.entries(watchScore.factorContributions)
              .sort(([, a], [, b]) => b - a)
              .filter(([, val]) => val >= 1)
              .map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-28 text-xs text-zinc-400 shrink-0 capitalize">
                    {key.replace(/_/g, " ")}
                  </div>
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500/70 rounded-full"
                      style={{ width: `${Math.min(100, val * 3.5)}%` }}
                    />
                  </div>
                  <div className="text-xs text-zinc-500 w-8 text-right tabular-nums">
                    {val.toFixed(0)}
                  </div>
                </div>
              ))}
          </div>

          <p className="text-xs text-zinc-600 mt-2">
            Model: {watchScore.modelVersion}
          </p>
        </div>

        {/* Factor descriptions */}
        <div className="border-t border-zinc-800 pt-4">
          <p className="text-xs text-zinc-600 font-semibold mb-2 uppercase tracking-wider">
            Score factors
          </p>
          <div className="space-y-2">
            {Object.entries(FACTOR_DESCRIPTIONS).map(([key, desc]) => (
              <div key={key}>
                <span className="text-xs text-zinc-400 font-medium capitalize">
                  {key.replace(/_/g, " ")}:{" "}
                </span>
                <span className="text-xs text-zinc-600">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
