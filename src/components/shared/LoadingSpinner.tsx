export function LoadingSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-2 border-zinc-700 border-t-orange-400 rounded-full animate-spin" />
      <p className="text-zinc-500 text-sm">{label}</p>
    </div>
  );
}
