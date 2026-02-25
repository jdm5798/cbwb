import fs from "fs";
import path from "path";

export interface WatchScoreConfig {
  model_version: string;
  weights: {
    closeness: number;
    time_remaining: number;
    lead_changes: number;
    upset_likelihood: number;
    ranked_stakes: number;
    tourney_implications: number;
  };
  thresholds: {
    close_game_margin: number;
    close_game_clock_seconds: number;
    upset_win_prob_threshold: number;
    lead_changes_burst_half: number;
    blowout_margin: number;
  };
}

const CONFIG_PATH = path.join(process.cwd(), "config", "watchscore.json");

let cached: WatchScoreConfig | null = null;

export function getWatchScoreConfig(): WatchScoreConfig {
  // In production, cache the config in memory.
  // In development, re-read on every call so edits take effect immediately.
  if (cached && process.env.NODE_ENV === "production") return cached;

  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  cached = JSON.parse(raw) as WatchScoreConfig;
  return cached;
}

export function saveWatchScoreConfig(config: WatchScoreConfig): void {
  const json = JSON.stringify(config, null, 2);
  fs.writeFileSync(CONFIG_PATH, json, "utf-8");
  cached = config; // update in-memory cache immediately
}
