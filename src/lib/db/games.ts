import { prisma } from "./prisma";
import { CanonicalGame } from "@/types/game";
import { GameWithState } from "@/types/game";

/**
 * Upsert a list of canonical games (and their live states) into the database.
 * Teams are upserted by ESPN ID; if a team is unknown it is created on the fly.
 */
export async function upsertGames(games: CanonicalGame[]): Promise<void> {
  for (const game of games) {
    // Upsert home team
    const homeTeam = await prisma.team.upsert({
      where: { espnId: game.homeTeam.externalId },
      update: {
        logoUrl: game.homeTeam.logoUrl ?? undefined,
      },
      create: {
        canonicalName: game.homeTeam.name,
        aliases: [game.homeTeam.name, game.homeTeam.abbreviation].filter(
          Boolean
        ) as string[],
        espnId: game.homeTeam.externalId,
        logoUrl: game.homeTeam.logoUrl ?? null,
        conference: game.homeTeam.conference ?? null,
      },
    });

    // Upsert away team
    const awayTeam = await prisma.team.upsert({
      where: { espnId: game.awayTeam.externalId },
      update: {
        logoUrl: game.awayTeam.logoUrl ?? undefined,
      },
      create: {
        canonicalName: game.awayTeam.name,
        aliases: [game.awayTeam.name, game.awayTeam.abbreviation].filter(
          Boolean
        ) as string[],
        espnId: game.awayTeam.externalId,
        logoUrl: game.awayTeam.logoUrl ?? null,
        conference: game.awayTeam.conference ?? null,
      },
    });

    // Upsert game
    const dbGame = await prisma.game.upsert({
      where: { espnId: game.externalId },
      update: {
        gameDate: game.gameDate,
        status: game.status,
        tvNetwork: game.tvNetwork ?? undefined,
        homeTeamRanking: game.homeTeam.ranking ?? null,
        awayTeamRanking: game.awayTeam.ranking ?? null,
        spread: game.spread ?? null,
        overUnder: game.overUnder ?? null,
        updatedAt: new Date(),
      },
      create: {
        espnId: game.externalId,
        gameDate: game.gameDate,
        scheduledAt: game.scheduledAt,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        tvNetwork: game.tvNetwork ?? null,
        homeTeamRanking: game.homeTeam.ranking ?? null,
        awayTeamRanking: game.awayTeam.ranking ?? null,
        spread: game.spread ?? null,
        overUnder: game.overUnder ?? null,
        status: game.status,
      },
    });

    // Upsert live state if present
    if (game.liveState) {
      await prisma.liveGameState.upsert({
        where: { gameId: dbGame.id },
        update: {
          homeScore: game.liveState.homeScore,
          awayScore: game.liveState.awayScore,
          period: game.liveState.period,
          clockDisplay: game.liveState.clockDisplay ?? null,
          leadChanges: game.liveState.leadChanges,
          winProbHome: game.liveState.winProbHome ?? null,
          possession: game.liveState.possession ?? null,
        },
        create: {
          gameId: dbGame.id,
          homeScore: game.liveState.homeScore,
          awayScore: game.liveState.awayScore,
          period: game.liveState.period,
          clockDisplay: game.liveState.clockDisplay ?? null,
          leadChanges: game.liveState.leadChanges,
          winProbHome: game.liveState.winProbHome ?? null,
          possession: game.liveState.possession ?? null,
        },
      });
    }
  }
}

/**
 * Fetch all games for a date from the DB with their live states and teams.
 */
export async function getGamesForDate(date: string): Promise<GameWithState[]> {
  const rows = await prisma.game.findMany({
    where: { gameDate: date },
    include: {
      homeTeam: true,
      awayTeam: true,
      liveState: true,
    },
    orderBy: { scheduledAt: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    espnId: row.espnId,
    gameDate: row.gameDate,
    scheduledAt: row.scheduledAt.toISOString(),
    homeTeam: {
      id: row.homeTeam.id,
      canonicalName: row.homeTeam.canonicalName,
      espnId: row.homeTeam.espnId,
      logoUrl: row.homeTeam.logoUrl,
      conference: row.homeTeam.conference,
    },
    awayTeam: {
      id: row.awayTeam.id,
      canonicalName: row.awayTeam.canonicalName,
      espnId: row.awayTeam.espnId,
      logoUrl: row.awayTeam.logoUrl,
      conference: row.awayTeam.conference,
    },
    tvNetwork: row.tvNetwork,
    status: row.status as GameWithState["status"],
    homeTeamRanking: row.homeTeamRanking ?? null,
    awayTeamRanking: row.awayTeamRanking ?? null,
    spread: row.spread ?? null,
    overUnder: row.overUnder ?? null,
    liveState: row.liveState
      ? {
          homeScore: row.liveState.homeScore,
          awayScore: row.liveState.awayScore,
          period: row.liveState.period,
          clockDisplay: row.liveState.clockDisplay,
          leadChanges: row.liveState.leadChanges,
          winProbHome: row.liveState.winProbHome,
          possession: row.liveState.possession,
        }
      : null,
  }));
}

/**
 * Get a single game by DB ID.
 */
export async function getGameById(id: string): Promise<GameWithState | null> {
  const row = await prisma.game.findUnique({
    where: { id },
    include: { homeTeam: true, awayTeam: true, liveState: true },
  });
  if (!row) return null;

  return {
    id: row.id,
    espnId: row.espnId,
    gameDate: row.gameDate,
    scheduledAt: row.scheduledAt.toISOString(),
    homeTeam: {
      id: row.homeTeam.id,
      canonicalName: row.homeTeam.canonicalName,
      espnId: row.homeTeam.espnId,
      logoUrl: row.homeTeam.logoUrl,
      conference: row.homeTeam.conference,
    },
    awayTeam: {
      id: row.awayTeam.id,
      canonicalName: row.awayTeam.canonicalName,
      espnId: row.awayTeam.espnId,
      logoUrl: row.awayTeam.logoUrl,
      conference: row.awayTeam.conference,
    },
    tvNetwork: row.tvNetwork,
    status: row.status as GameWithState["status"],
    homeTeamRanking: row.homeTeamRanking ?? null,
    awayTeamRanking: row.awayTeamRanking ?? null,
    spread: row.spread ?? null,
    overUnder: row.overUnder ?? null,
    liveState: row.liveState
      ? {
          homeScore: row.liveState.homeScore,
          awayScore: row.liveState.awayScore,
          period: row.liveState.period,
          clockDisplay: row.liveState.clockDisplay,
          leadChanges: row.liveState.leadChanges,
          winProbHome: row.liveState.winProbHome,
          possession: row.liveState.possession,
        }
      : null,
  };
}
