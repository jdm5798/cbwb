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

// ---------------------------------------------------------------------------
// TeamRow — logo + ranking + name + record (shared sub-component)
// ---------------------------------------------------------------------------

interface TeamRowProps {
  name: string;
  ranking?: number | null;   // AP/Coaches poll rank
  btRank?: number | null;    // BartTorvik T-Rank
  logoUrl?: string | null;
  record?: { wins: number; losses: number } | null;
}

function TeamRow({ name, ranking, btRank, logoUrl, record }: TeamRowProps) {
  const recordStr = formatRecord(record);

  return (
    <div className="flex items-center gap-2 min-w-0 w-full">
      {/* Logo */}
      <div className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${name} logo`}
            className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
          />
        ) : (
          <span className="text-xs font-bold text-zinc-500 bg-zinc-800 rounded-full w-6 h-6 flex items-center justify-center">
            {name.charAt(0)}
          </span>
        )}
      </div>

      {/* AP Rank + Name */}
      <span className="font-semibold text-sm text-zinc-100 truncate min-w-0">
        {ranking && ranking <= 25 ? (
          <span className="text-orange-400 font-bold mr-0.5">#{ranking}</span>
        ) : null}
        {name}
      </span>

      {/* BT Rank + Record — right-aligned */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        {btRank != null && (
          <span data-testid="bt-rank" className="text-[10px] text-zinc-600 tabular-nums">
            T{btRank}
          </span>
        )}
        {recordStr && (
          <span data-testid="team-record" className="text-xs text-zinc-500 tabular-nums">
            {recordStr}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PregameSection
// ---------------------------------------------------------------------------

interface PregameSectionProps {
  scheduledAt: string;
  pregamePrediction: GameWithState["pregamePrediction"];
  homeTeamName: string;
  awayTeamName: string;
  tvNetwork?: string | null;
}

function PregameSection({
  scheduledAt,
  pregamePrediction,
  homeTeamName,
  awayTeamName,
  tvNetwork,
}: PregameSectionProps) {
  // Short display name: first word of team name
  const homeShort = homeTeamName.split(" ")[0];
  const awayShort = awayTeamName.split(" ")[0];

  return (
    <div className="mt-3 pt-3 border-t border-zinc-800/60">
      <div className="flex items-center justify-between gap-2">
        {/* Left: start time + predicted score */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs min-w-0">
          <span data-testid="pregame-time" className="text-zinc-400 shrink-0">
            {formatTime(scheduledAt)}
          </span>

          {/* Predicted score */}
          {pregamePrediction && (pregamePrediction.homeScore > 0 || pregamePrediction.awayScore > 0) && (
            <>
              <span className="text-zinc-600">·</span>
              <span data-testid="pregame-prediction" className="text-zinc-400 shrink-0 tabular-nums">
                <span className="text-zinc-300">{awayShort}</span>{" "}
                {pregamePrediction.awayScore}
                <span className="text-zinc-600 mx-1">–</span>
                {pregamePrediction.homeScore}{" "}
                <span className="text-zinc-300">{homeShort}</span>
              </span>
            </>
          )}
        </div>

        {/* Right: TV badge */}
        {tvNetwork && (
          <span className="text-xs text-zinc-400 bg-zinc-800 rounded px-2 py-0.5 shrink-0">
            {tvNetwork}
          </span>
        )}
      </div>

      {/* Why it matters */}
      {pregamePrediction?.whyItMatters && (
        <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2">
          {pregamePrediction.whyItMatters}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LiveSection
// ---------------------------------------------------------------------------

interface LiveSectionProps {
  liveState: NonNullable<GameWithState["liveState"]>;
  liveContext: GameWithState["liveContext"];
  tvNetwork?: string | null;
}

function LiveSection({ liveState, liveContext, tvNetwork }: LiveSectionProps) {
  return (
    <div className="mt-3 pt-3 border-t border-zinc-800/60">
      <div className="flex items-center justify-between gap-2">
        {/* Left: period + score */}
        <div className="flex items-center gap-3">
          <span
            data-testid="live-period"
            className="text-xs text-green-400 font-semibold shrink-0"
          >
            {periodLabel(liveState.period)}
            {liveState.clockDisplay ? ` · ${liveState.clockDisplay}` : ""}
          </span>

          <span className="text-zinc-600 text-xs">·</span>

          <span
            data-testid="live-score"
            className="text-sm font-bold tabular-nums text-white shrink-0"
          >
            {liveState.awayScore}
            <span className="text-zinc-500 mx-1">–</span>
            {liveState.homeScore}
          </span>
        </div>

        {/* Right: TV badge */}
        {tvNetwork && (
          <span className="text-xs text-zinc-400 bg-zinc-800 rounded px-2 py-0.5 shrink-0">
            {tvNetwork}
          </span>
        )}
      </div>

      {/* Live why it matters */}
      {liveContext?.whyItMatters && (
        <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2">
          {liveContext.whyItMatters}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GameCard
// ---------------------------------------------------------------------------

export function GameCard({ game, watchScore, rank, isSelected, onClick }: GameCardProps) {
  const isLive = ["IN_PROGRESS", "HALFTIME"].includes(game.status);

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
      {/* ── Header: teams + TV channel ─────────────────────────────────── */}
      <div className="flex items-start gap-3">
        {/* Watch score badge (+ "Thrill Score" label for pregame) */}
        {game.status === "SCHEDULED" && game.pregamePrediction ? (
          <div data-testid="thrill-score" className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
            <ScoreBadge score={watchScore.score} size="sm" />
            <span className="text-[10px] text-zinc-500 leading-none">Thrill Score</span>
          </div>
        ) : (
          <div className="flex flex-col items-center shrink-0 pt-0.5">
            <ScoreBadge score={watchScore.score} size="sm" />
          </div>
        )}

        {/* Team rows */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <TeamRow
            name={game.awayTeam.canonicalName}
            ranking={game.awayTeamRanking}
            btRank={game.awayBtRank}
            logoUrl={game.awayTeam.logoUrl}
            record={game.awayTeamRecord ?? game.awayTeamEspnRecord}
          />
          <TeamRow
            name={game.homeTeam.canonicalName}
            ranking={game.homeTeamRanking}
            btRank={game.homeBtRank}
            logoUrl={game.homeTeam.logoUrl}
            record={game.homeTeamRecord ?? game.homeTeamEspnRecord}
          />
        </div>

      </div>

      {/* ── Status section ─────────────────────────────────────────────── */}
      {isLive && game.liveState ? (
        <LiveSection liveState={game.liveState} liveContext={game.liveContext} tvNetwork={game.tvNetwork} />
      ) : game.status === "SCHEDULED" ? (
        <PregameSection
          scheduledAt={game.scheduledAt}
          pregamePrediction={game.pregamePrediction}
          homeTeamName={game.homeTeam.canonicalName}
          awayTeamName={game.awayTeam.canonicalName}
          tvNetwork={game.tvNetwork}
        />
      ) : null}
    </button>
  );
}
