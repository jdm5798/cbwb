"use client";

import { DataStatus } from "@/components/admin/DataStatus";
import { ResetDataButton } from "@/components/admin/ResetDataButton";
import { WeightEditor } from "@/components/admin/WeightEditor";
import { AgentRunHistory } from "@/components/admin/AgentRunHistory";

export default function AdminPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 mb-1">Admin</h1>
        <p className="text-sm text-zinc-500">
          Data status, Watch Score tuning, and ingestion controls.
        </p>
      </div>

      {/* Data status */}
      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Data Status
        </h2>
        <DataStatus />
      </section>

      {/* Danger Zone */}
      <section className="bg-zinc-900 border border-red-900/40 rounded-lg p-5">
        <h2 className="text-xs font-semibold text-red-500/70 uppercase tracking-wider mb-3">
          Danger Zone
        </h2>
        <ResetDataButton />
      </section>

      {/* Watch Score weights */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <WeightEditor />
      </section>

      {/* Agent runs */}
      <section>
        <AgentRunHistory />
      </section>
    </div>
  );
}
