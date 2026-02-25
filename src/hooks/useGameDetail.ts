"use client";

import useSWR from "swr";
import { GameWithState } from "@/types/game";

interface GameDetailResponse {
  game: GameWithState;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<GameDetailResponse>;
  });

export function useGameDetail(gameId: string | null) {
  const { data, error, isLoading } = useSWR<GameDetailResponse>(
    gameId ? `/api/games/${gameId}` : null,
    fetcher,
    {
      refreshInterval: 30_000,
      refreshWhenHidden: false,
      dedupingInterval: 25_000,
      keepPreviousData: true,
    }
  );

  return {
    game: data?.game ?? null,
    error,
    isLoading,
  };
}
