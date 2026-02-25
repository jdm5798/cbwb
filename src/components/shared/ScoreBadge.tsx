import { clsx } from "clsx";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-red-400 border-red-500/50 bg-red-950/30";
  if (score >= 60) return "text-orange-400 border-orange-500/50 bg-orange-950/30";
  if (score >= 40) return "text-yellow-400 border-yellow-500/50 bg-yellow-950/30";
  return "text-zinc-400 border-zinc-600/50 bg-zinc-900/30";
}

const SIZE_CLASSES = {
  sm: "w-10 h-10 text-sm",
  md: "w-14 h-14 text-lg",
  lg: "w-20 h-20 text-2xl",
};

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center rounded-full border font-bold tabular-nums",
        scoreColor(score),
        SIZE_CLASSES[size]
      )}
      title={`Watch Score: ${score}`}
    >
      {score}
    </div>
  );
}
