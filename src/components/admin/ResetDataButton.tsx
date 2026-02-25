"use client";

import { useState } from "react";

function getTodayDate(): string {
  return new Date().toISOString().substring(0, 10);
}

export function ResetDataButton() {
  const [date, setDate] = useState(getTodayDate());
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: true; summary: string } | { ok: false; error: string } | null>(null);

  async function handleClick() {
    if (!confirming) {
      setConfirming(true);
      setResult(null);
      return;
    }

    setConfirming(false);
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, error: data.details ?? data.error ?? "Unknown error" });
      } else {
        setResult({ ok: true, summary: data.summary });
      }
    } catch (err) {
      setResult({ ok: false, error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setConfirming(false);
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-zinc-200 mb-1">Clear &amp; Re-fetch Games</p>
        <p className="text-xs text-zinc-500">
          Deletes all games for the selected date from the database, then re-fetches fresh data
          from ESPN. Use this to fix games stored under the wrong date.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setConfirming(false);
            setResult(null);
          }}
          disabled={loading}
          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
        />

        {!confirming ? (
          <button
            onClick={handleClick}
            disabled={loading || !date}
            className="px-4 py-1.5 rounded text-sm font-medium bg-red-900/40 border border-red-800/60 text-red-300 hover:bg-red-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Working…" : "Clear & Re-fetch"}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleClick}
              className="px-4 py-1.5 rounded text-sm font-medium bg-red-600 text-white hover:bg-red-500 transition-colors"
            >
              Confirm — delete &amp; refetch {date}
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 rounded text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {confirming && (
        <p className="text-xs text-red-400">
          ⚠ This will permanently delete all games for {date} and re-fetch from ESPN.
        </p>
      )}

      {result && (
        <p className={`text-xs ${result.ok ? "text-green-400" : "text-red-400"}`}>
          {result.ok ? `✓ ${result.summary}` : `✗ ${result.error}`}
        </p>
      )}
    </div>
  );
}
