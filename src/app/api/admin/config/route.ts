import { NextRequest, NextResponse } from "next/server";
import {
  getWatchScoreConfig,
  saveWatchScoreConfig,
  WatchScoreConfig,
} from "@/lib/config/watchscoreConfig";

export async function GET() {
  try {
    const config = getWatchScoreConfig();
    return NextResponse.json({ config });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to read config", details: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const incoming = body.config as Partial<WatchScoreConfig>;

    const current = getWatchScoreConfig();

    // Merge weights carefully — validate they are numbers
    const newWeights = { ...current.weights };
    if (incoming.weights) {
      for (const [key, val] of Object.entries(incoming.weights)) {
        if (typeof val === "number" && val >= 0 && val <= 1) {
          (newWeights as Record<string, number>)[key] = val;
        }
      }
    }

    const updated: WatchScoreConfig = {
      ...current,
      weights: newWeights,
      thresholds: incoming.thresholds ?? current.thresholds,
    };

    saveWatchScoreConfig(updated);

    return NextResponse.json({ success: true, config: updated });
  } catch (err) {
    console.error("[POST /api/admin/config] Error:", err);
    return NextResponse.json(
      { error: "Failed to save config", details: String(err) },
      { status: 500 }
    );
  }
}
