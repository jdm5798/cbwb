import { clsx } from "clsx";

interface FactorChipProps {
  label: string;
  value: number; // contribution points (0–100 scale piece)
}

const LABELS: Record<string, string> = {
  closeness: "Close",
  time_remaining: "Late",
  lead_changes: "Lead Chgs",
  upset_likelihood: "Upset",
  ranked_stakes: "Ranked",
  tourney_implications: "Tourney",
};

function chipColor(value: number): string {
  if (value >= 15) return "bg-red-900/50 text-red-300 border-red-700/50";
  if (value >= 10) return "bg-orange-900/50 text-orange-300 border-orange-700/50";
  if (value >= 5) return "bg-yellow-900/50 text-yellow-300 border-yellow-700/50";
  return "bg-zinc-800/50 text-zinc-500 border-zinc-700/50";
}

export function FactorChip({ label, value }: FactorChipProps) {
  if (value < 1) return null; // hide negligible factors
  const display = LABELS[label] ?? label;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border",
        chipColor(value)
      )}
      title={`${display}: ${value.toFixed(1)} pts`}
    >
      {display}
      <span className="font-bold">{value.toFixed(0)}</span>
    </span>
  );
}
