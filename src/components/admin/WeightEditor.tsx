"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { WatchScoreConfig } from "@/lib/config/watchscoreConfig";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const WEIGHT_LABELS: Record<string, string> = {
  closeness: "Closeness",
  time_remaining: "Time Remaining",
  lead_changes: "Lead Changes",
  upset_likelihood: "Upset Likelihood",
  ranked_stakes: "Ranked Stakes",
  tourney_implications: "Tourney Implications",
};

export function WeightEditor() {
  const { data, mutate } = useSWR<{ config: WatchScoreConfig }>(
    "/api/admin/config",
    fetcher
  );

  const [weights, setWeights] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.config?.weights) {
      setWeights({ ...data.config.weights });
    }
  }, [data]);

  const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: { weights } }),
      });
      if (res.ok) {
        await mutate();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (data?.config?.weights) setWeights({ ...data.config.weights });
  }

  if (!data) {
    return <p className="text-zinc-600 text-sm">Loading config…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Watch Score Weights</h3>
          <p className="text-xs text-zinc-500">
            Model: {data.config.model_version} · Sum: {weightSum.toFixed(2)}{" "}
            {Math.abs(weightSum - 1) > 0.01 && (
              <span className="text-yellow-500">(weights should sum to ~1.0)</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1 border border-zinc-700 rounded"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-3 py-1 rounded font-semibold"
          >
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(weights).map(([key, val]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-sm text-zinc-300">
                {WEIGHT_LABELS[key] ?? key}
              </label>
              <span className="text-sm font-mono text-zinc-400 w-10 text-right">
                {val.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.01}
              value={val}
              onChange={(e) =>
                setWeights((prev) => ({
                  ...prev,
                  [key]: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-orange-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
