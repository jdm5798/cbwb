import { CanonicalGame, CanonicalLiveState } from "@/types/game";

export interface IDataProvider {
  /** Provider identifier for logging */
  readonly name: string;

  /**
   * Fetch all games for a given date.
   * @param date - YYYYMMDD format
   */
  fetchGames(date: string): Promise<CanonicalGame[]>;

  /**
   * Fetch live state for a single game by its external (ESPN) ID.
   * Returns null if game not found or not in progress.
   */
  fetchLiveState(externalId: string): Promise<CanonicalLiveState | null>;
}
