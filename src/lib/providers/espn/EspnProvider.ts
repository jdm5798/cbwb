import { IDataProvider } from "../IDataProvider";
import { CanonicalGame, CanonicalLiveState } from "@/types/game";
import { fetchEspnScoreboard, fetchEspnGameSummary } from "./espnClient";
import {
  normalizeScoreboard,
  normalizeSummaryToLiveState,
} from "./espnNormalizer";

export class EspnProvider implements IDataProvider {
  readonly name = "espn";

  async fetchGames(date: string): Promise<CanonicalGame[]> {
    const raw = await fetchEspnScoreboard(date);
    // Convert YYYYMMDD → YYYY-MM-DD for the normalizer
    const isoDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
    return normalizeScoreboard(raw, isoDate);
  }

  async fetchLiveState(externalId: string): Promise<CanonicalLiveState | null> {
    const raw = await fetchEspnGameSummary(externalId);
    return normalizeSummaryToLiveState(raw);
  }
}
