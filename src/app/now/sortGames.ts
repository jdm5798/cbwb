import type { GameWithState, GameStatus } from "@/types/game";
import type { WatchScoreResult } from "@/types/watchscore";

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
