import { NextRequest, NextResponse } from "next/server";
import { getGameById } from "@/lib/db/games";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const game = await getGameById(id);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    return NextResponse.json({ game });
  } catch (err) {
    console.error(`[GET /api/games/${id}] Error:`, err);
    return NextResponse.json(
      { error: "Failed to fetch game", details: String(err) },
      { status: 500 }
    );
  }
}
