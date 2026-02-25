"use client";

import { GameWithState } from "@/types/game";
import { WatchScoreResult } from "@/types/watchscore";
import { GameCard } from "./GameCard";

interface ScoredGame {
  game: GameWithState;
  watchScore: WatchScoreResult;
}

interface GameListProps {
  games: ScoredGame[];
  selectedGameId: string | null;
  onSelectGame: (id: string) => void;
}

export function GameList({ games, selectedGameId, onSelectGame }: GameListProps) {
  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 text-sm">No games found for this date.</p>
      </div>
    );
  }

  const liveGames = games.filter((g) =>
    ["IN_PROGRESS", "HALFTIME"].includes(g.game.status)
  );
  const upcomingGames = games.filter((g) => g.game.status === "SCHEDULED");
  const finalGames = games.filter((g) => g.game.status === "FINAL");

  return (
    <div className="space-y-6">
      {liveGames.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Live ({liveGames.length})
          </h2>
          <div className="space-y-2">
            {liveGames.map((item, idx) => (
              <GameCard
                key={item.game.id}
                game={item.game}
                watchScore={item.watchScore}
                rank={idx + 1}
                isSelected={selectedGameId === item.game.id}
                onClick={() => onSelectGame(item.game.id)}
              />
            ))}
          </div>
        </section>
      )}

      {upcomingGames.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Upcoming ({upcomingGames.length})
          </h2>
          <div className="space-y-2">
            {upcomingGames.map((item, idx) => (
              <GameCard
                key={item.game.id}
                game={item.game}
                watchScore={item.watchScore}
                rank={idx + 1}
                isSelected={selectedGameId === item.game.id}
                onClick={() => onSelectGame(item.game.id)}
              />
            ))}
          </div>
        </section>
      )}

      {finalGames.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Final ({finalGames.length})
          </h2>
          <div className="space-y-2">
            {finalGames.map((item) => (
              <GameCard
                key={item.game.id}
                game={item.game}
                watchScore={item.watchScore}
                rank={0}
                isSelected={selectedGameId === item.game.id}
                onClick={() => onSelectGame(item.game.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
