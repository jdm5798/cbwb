import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GameCard } from "@/components/now/GameCard";
import { GameWithState } from "@/types/game";
import { WatchScoreResult } from "@/types/watchscore";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseTeamAway = {
  id: "team-1",
  canonicalName: "Duke Blue Devils",
  espnId: "150",
  logoUrl: "https://example.com/duke.png",
  conference: "ACC",
};

const baseTeamHome = {
  id: "team-2",
  canonicalName: "NC State Wolfpack",
  espnId: "152",
  logoUrl: "https://example.com/ncstate.png",
  conference: "ACC",
};

const baseWatchScore: WatchScoreResult = {
  score: 82,
  factorContributions: {
    closeness: 20,
    time_remaining: 15,
    lead_changes: 10,
    upset_likelihood: 12,
    ranked_stakes: 15,
    tourney_implications: 10,
  },
  factorScores: {
    closeness: 0.7,
    time_remaining: 0.6,
    lead_changes: 0.5,
    upset_likelihood: 0.6,
    ranked_stakes: 0.8,
    tourney_implications: 0.7,
  },
  explanation: "Top-10 matchup with tournament implications on the line.",
  modelVersion: "watchscore_v1",
};

function makeGame(overrides: Partial<GameWithState> = {}): GameWithState {
  return {
    id: "game-1",
    espnId: "401234567",
    gameDate: "2026-02-25",
    scheduledAt: "2026-02-25T23:00:00.000Z",
    homeTeam: baseTeamHome,
    awayTeam: baseTeamAway,
    tvNetwork: "ESPN",
    status: "SCHEDULED",
    liveState: null,
    homeTeamRanking: 12,
    awayTeamRanking: 5,
    spread: 4,
    overUnder: 140,
    homeTeamRecord: { wins: 18, losses: 7 },
    awayTeamRecord: { wins: 22, losses: 4 },
    pregamePrediction: {
      homeScore: 68,
      awayScore: 72,
      thrillScore: 75,
      whyItMatters: "Top-10 matchup with tournament implications on the line.",
    },
    liveContext: null,
    ...overrides,
  };
}

function makeSelectedProps(overrides: Partial<GameWithState> = {}) {
  return {
    game: makeGame(overrides),
    watchScore: baseWatchScore,
    rank: 1,
    isSelected: false,
    onClick: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// 3a — Always-visible elements
// ---------------------------------------------------------------------------

describe("GameCard — always-visible elements", () => {
  it("renders the away team logo", () => {
    render(<GameCard {...makeSelectedProps()} />);
    const imgs = screen.getAllByRole("img");
    const awayLogo = imgs.find(
      (img) => (img as HTMLImageElement).src.includes("duke")
    );
    expect(awayLogo).toBeDefined();
  });

  it("renders the home team logo", () => {
    render(<GameCard {...makeSelectedProps()} />);
    const imgs = screen.getAllByRole("img");
    const homeLogo = imgs.find(
      (img) => (img as HTMLImageElement).src.includes("ncstate")
    );
    expect(homeLogo).toBeDefined();
  });

  it("renders the away team name", () => {
    render(<GameCard {...makeSelectedProps()} />);
    expect(screen.getByText(/Duke Blue Devils/i)).toBeInTheDocument();
  });

  it("renders the home team name", () => {
    render(<GameCard {...makeSelectedProps()} />);
    expect(screen.getByText(/NC State Wolfpack/i)).toBeInTheDocument();
  });

  it("renders the away team ranking when ranked", () => {
    render(<GameCard {...makeSelectedProps()} />);
    expect(screen.getByText(/#5/)).toBeInTheDocument();
  });

  it("renders the home team ranking when ranked", () => {
    render(<GameCard {...makeSelectedProps()} />);
    expect(screen.getByText(/#12/)).toBeInTheDocument();
  });

  it("does NOT render a ranking prefix when team is unranked", () => {
    render(
      <GameCard
        {...makeSelectedProps({
          awayTeamRanking: null,
          homeTeamRanking: null,
        })}
      />
    );
    expect(screen.queryByText(/#\d+/)).not.toBeInTheDocument();
  });

  it("renders the TV channel badge", () => {
    render(<GameCard {...makeSelectedProps()} />);
    expect(screen.getByText("ESPN")).toBeInTheDocument();
  });

  it("renders the away team record", () => {
    render(<GameCard {...makeSelectedProps()} />);
    // away: 22-4
    expect(screen.getByText("22-4")).toBeInTheDocument();
  });

  it("renders the home team record", () => {
    render(<GameCard {...makeSelectedProps()} />);
    // home: 18-7
    expect(screen.getByText("18-7")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 3e — Team records: fallback + BT rank
// ---------------------------------------------------------------------------

describe("GameCard — team records and BT rank", () => {
  it("falls back to ESPN record when BartTorvik record is null", () => {
    render(
      <GameCard
        {...makeSelectedProps({
          homeTeamRecord: null,
          awayTeamRecord: null,
          homeTeamEspnRecord: { wins: 14, losses: 10 },
          awayTeamEspnRecord: { wins: 19, losses: 5 },
        })}
      />
    );
    expect(screen.getByText("14-10")).toBeInTheDocument();
    expect(screen.getByText("19-5")).toBeInTheDocument();
  });

  it("hides record slot when both BartTorvik and ESPN records are null", () => {
    render(
      <GameCard
        {...makeSelectedProps({
          homeTeamRecord: null,
          awayTeamRecord: null,
          homeTeamEspnRecord: null,
          awayTeamEspnRecord: null,
        })}
      />
    );
    const records = screen.queryAllByTestId("team-record");
    expect(records).toHaveLength(0);
  });

  it("prefers BartTorvik record over ESPN record when both exist", () => {
    render(
      <GameCard
        {...makeSelectedProps({
          homeTeamRecord: { wins: 18, losses: 7 },
          homeTeamEspnRecord: { wins: 17, losses: 7 },
        })}
      />
    );
    expect(screen.getByText("18-7")).toBeInTheDocument();
    // ESPN record (different) should NOT appear
    expect(screen.queryByText("17-7")).not.toBeInTheDocument();
  });

  it("renders BT rank when provided", () => {
    render(
      <GameCard
        {...makeSelectedProps({
          homeBtRank: 14,
          awayBtRank: 8,
        })}
      />
    );
    const btRanks = screen.getAllByTestId("bt-rank");
    expect(btRanks[0].textContent).toBe("T8");
    expect(btRanks[1].textContent).toBe("T14");
  });

  it("does not render BT rank when not provided", () => {
    render(<GameCard {...makeSelectedProps({ homeBtRank: null, awayBtRank: null })} />);
    expect(screen.queryAllByTestId("bt-rank")).toHaveLength(0);
  });

  it("renders both AP rank and BT rank when both exist", () => {
    render(
      <GameCard
        {...makeSelectedProps({
          awayTeamRanking: 5,
          awayBtRank: 8,
        })}
      />
    );
    expect(screen.getByText(/#5/)).toBeInTheDocument();
    const btRanks = screen.getAllByTestId("bt-rank");
    const awayBtRank = btRanks.find((el) => el.textContent === "T8");
    expect(awayBtRank).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 3b — Pre-game card (status = SCHEDULED)
// ---------------------------------------------------------------------------

describe("GameCard — pre-game state (SCHEDULED)", () => {
  it("does NOT render live score", () => {
    render(<GameCard {...makeSelectedProps()} />);
    // Live score pattern "XX–YY" should not be present as a standalone score
    expect(screen.queryByTestId("live-score")).not.toBeInTheDocument();
  });

  it("shows a formatted start time", () => {
    render(<GameCard {...makeSelectedProps()} />);
    // The card must render a time string (e.g. "6:00 PM" or "7:00 PM")
    const timeEl = screen.getByTestId("pregame-time");
    expect(timeEl).toBeInTheDocument();
    expect(timeEl.textContent).toMatch(/\d+:\d{2}\s*(AM|PM)/i);
  });

  it("shows the predicted away score", () => {
    render(<GameCard {...makeSelectedProps()} />);
    const predicted = screen.getByTestId("pregame-prediction");
    expect(predicted.textContent).toContain("72");
  });

  it("shows the predicted home score", () => {
    render(<GameCard {...makeSelectedProps()} />);
    const predicted = screen.getByTestId("pregame-prediction");
    expect(predicted.textContent).toContain("68");
  });

  it("shows the pregame thrill score from pregamePrediction", () => {
    render(<GameCard {...makeSelectedProps()} />);
    const thrill = screen.getByTestId("thrill-score");
    expect(thrill.textContent).toContain("75");
  });

  it("labels the pregame badge as Projected Thrill Score", () => {
    render(<GameCard {...makeSelectedProps()} />);
    const thrill = screen.getByTestId("thrill-score");
    expect(thrill.textContent).toContain("Projected Thrill Score");
  });

  it("shows the why-it-matters text", () => {
    render(<GameCard {...makeSelectedProps()} />);
    expect(
      screen.getByText(/tournament implications on the line/i)
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 3c — Live card (status = IN_PROGRESS)
// ---------------------------------------------------------------------------

describe("GameCard — live state (IN_PROGRESS)", () => {
  const liveProps = makeSelectedProps({
    status: "IN_PROGRESS",
    liveState: {
      homeScore: 42,
      awayScore: 39,
      period: 2,
      clockDisplay: "14:32",
      leadChanges: 8,
      winProbHome: 0.58,
      possession: "home",
    },
    pregamePrediction: null,
    liveContext: {
      whyItMatters: "Duke extending lead after second-half run.",
    },
  });

  it("shows the current away score", () => {
    render(<GameCard {...liveProps} />);
    const score = screen.getByTestId("live-score");
    expect(score.textContent).toContain("39");
  });

  it("shows the current home score", () => {
    render(<GameCard {...liveProps} />);
    const score = screen.getByTestId("live-score");
    expect(score.textContent).toContain("42");
  });

  it("shows the period label", () => {
    render(<GameCard {...liveProps} />);
    expect(screen.getByTestId("live-period").textContent).toMatch(/2nd/i);
  });

  it("shows the clock display", () => {
    render(<GameCard {...liveProps} />);
    expect(screen.getByTestId("live-period").textContent).toContain("14:32");
  });

  it("shows live why-it-matters text", () => {
    render(<GameCard {...liveProps} />);
    expect(
      screen.getByText(/second-half run/i)
    ).toBeInTheDocument();
  });

  it("does NOT show pregame start time", () => {
    render(<GameCard {...liveProps} />);
    expect(screen.queryByTestId("pregame-time")).not.toBeInTheDocument();
  });

  it("shows the live thrill score using watchScore.score", () => {
    render(<GameCard {...liveProps} />);
    const thrill = screen.getByTestId("thrill-score");
    expect(thrill.textContent).toContain("82");
  });

  it("labels the live badge as Live Thrill Score", () => {
    render(<GameCard {...liveProps} />);
    const thrill = screen.getByTestId("thrill-score");
    expect(thrill.textContent).toContain("Live Thrill Score");
  });
});

// ---------------------------------------------------------------------------
// 3d — Visual / selection state
// ---------------------------------------------------------------------------

describe("GameCard — selection state", () => {
  it("selected card has orange border class", () => {
    const props = { ...makeSelectedProps(), isSelected: true };
    const { container } = render(<GameCard {...props} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("border-orange-500/60");
  });

  it("unselected card has default zinc border class", () => {
    const props = { ...makeSelectedProps(), isSelected: false };
    const { container } = render(<GameCard {...props} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("border-zinc-800");
  });
});
