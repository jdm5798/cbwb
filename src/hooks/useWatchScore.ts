"use client";

import useSWR from "swr";
import { WatchScoreResponse } from "@/types/watchscore";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<WatchScoreResponse>;
  });

export function useWatchScore(date?: string) {
  const url = date ? `/api/watchscore?date=${date}` : "/api/watchscore";

  const { data, error, isLoading, mutate } = useSWR<WatchScoreResponse>(
    url,
    fetcher,
    {
      refreshInterval: 30_000,       // Poll every 30s
      refreshWhenHidden: false,       // Pause when tab is hidden
      dedupingInterval: 25_000,       // Don't fire if last req < 25s ago
      revalidateOnFocus: true,
      keepPreviousData: true,         // Show stale data while refreshing
    }
  );

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
    isStale: !!data && !isLoading && !!error,
  };
}
