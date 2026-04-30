export type Role = 'AGENT' | 'NON_AGENT' | 'ASSASSIN';

export type TeamId = 1 | 2;

export interface Square {
  roleForTeam1: Role;
  roleForTeam2: Role;
  /** What was revealed on team 1's grid (set when team 2 guessed this word). */
  revealedOnTeam1: Role | null;
  /** What was revealed on team 2's grid (set when team 1 guessed this word). */
  revealedOnTeam2: Role | null;
}

export type WordMap = Record<string, Square>;

export interface CurrentTurn {
  /** The team that gave the clue. The OTHER team is the guesser. */
  clueGiverTeam: TeamId;
  clueWord: string;
  guessesLeft: number;
}

/** What a single client sees about one word. */
export interface WordView {
  /** Role on this player's grid. */
  myRole: Role;
  /** What's been revealed on my own grid (from my partner's guesses). */
  revealedOnMine: Role | null;
  /** What's been revealed on my partner's grid (from my guesses). */
  revealedOnTheirs: Role | null;
}

/** The view sent to a single client. */
export interface PlayerView {
  words: Record<string, WordView>;
  agentsLeftTeam1: number;
  agentsLeftTeam2: number;
  turnsLeft: number;
  currentClue:
    | {
        fromTeam: TeamId;
        word: string;
        guessesLeft: number;
      }
    | null;
  result: GameResult | null;
}

export type GameResult = 'win' | 'loss-assassin' | 'loss-turns';

export interface GuessOutcome {
  word: string;
  /** The role revealed (against the clue-giver's grid). */
  role: Role;
  /** True if this guess was against an agent on BOTH grids; reveals on both. */
  overlappingAgent: boolean;
  guessesLeft: number;
  turnsLeft: number;
  agentsLeftTeam1: number;
  agentsLeftTeam2: number;
  turnEnded: boolean;
  result: GameResult | null;
}

export interface GameInit {
  wordMap?: WordMap;
  agentsLeftTeam1?: number;
  agentsLeftTeam2?: number;
  turnsLeft?: number;
  currentTurn?: CurrentTurn;
}
