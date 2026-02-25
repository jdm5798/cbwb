"use client";

import useSWR from "swr";
import { GameWithState } from "@/types/game";

interface GamesResponse {
  games: GameWithState[];
  date: string;
  fetchedAt: string;
  fromCache: boolean;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<GamesResponse>;
  });

export function useGames(date?: string) {
  const url = date ? `/api/games?date=${date}` : "/api/games";

  const { data, error, isLoading, mutate } = useSWR<GamesResponse>(
    url,
    fetcher,
    {
      refreshInterval: 30_000,
      refreshWhenHidden: false,
      dedupingInterval: 25_000,
      revalidateOnFocus: true,
      keepPreviousData: true,
    }
  );

  return {
    games: data?.games ?? [],
    fetchedAt: data?.fetchedAt,
    fromCache: data?.fromCache,
    error,
    isLoading,
    refresh: mutate,
  };
}
