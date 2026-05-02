import { WORDS } from './words.js';
import type {
  CurrentTurn,
  GameInit,
  GameResult,
  GuessOutcome,
  PlayerView,
  Role,
  Square,
  TeamId,
  WordMap,
} from './types.js';

export const COUNTS = {
  WORDS: 25,
  AGENTS_PER_PLAYER: 9,
  ASSASSINS_PER_PLAYER: 3,
  /** Distinct agents across the board (team1 + team2 minus overlap). */
  TOTAL_AGENTS: 15,
  TURNS: 9,
} as const;

const OVERLAPPING_AGENTS = COUNTS.AGENTS_PER_PLAYER * 2 - COUNTS.TOTAL_AGENTS;

function shuffle<T>(array: T[]): T[] {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function pickWords(): string[] {
  return shuffle([...WORDS]).slice(0, COUNTS.WORDS);
}

interface RoleSlot {
  roleForTeam1?: Role;
  roleForTeam2?: Role;
}

function generateBoard(): RoleSlot[] {
  const slots: RoleSlot[] = [];

  for (let i = 0; i < OVERLAPPING_AGENTS; i++) {
    slots.push({ roleForTeam1: 'AGENT', roleForTeam2: 'AGENT' });
  }
  const uniquePerTeam = COUNTS.AGENTS_PER_PLAYER - OVERLAPPING_AGENTS;
  for (let i = 0; i < uniquePerTeam; i++) {
    slots.push({ roleForTeam1: 'AGENT' });
    slots.push({ roleForTeam2: 'AGENT' });
  }
  for (let i = 0; i < COUNTS.WORDS - COUNTS.TOTAL_AGENTS; i++) {
    slots.push({});
  }

  let placed = shuffle(slots);

  let team1Assassins = 0;
  for (const slot of placed) {
    if (slot.roleForTeam1) continue;
    if (team1Assassins < COUNTS.ASSASSINS_PER_PLAYER) {
      slot.roleForTeam1 = 'ASSASSIN';
      team1Assassins++;
    } else {
      slot.roleForTeam1 = 'NON_AGENT';
    }
  }

  placed = shuffle(placed);

  let team2Assassins = 0;
  for (const slot of placed) {
    if (slot.roleForTeam2) continue;
    if (team2Assassins < COUNTS.ASSASSINS_PER_PLAYER) {
      slot.roleForTeam2 = 'ASSASSIN';
      team2Assassins++;
    } else {
      slot.roleForTeam2 = 'NON_AGENT';
    }
  }

  return shuffle(placed);
}

function buildWordMap(): WordMap {
  const words = pickWords();
  const board = generateBoard();
  const wordMap: WordMap = {};
  words.forEach((word, index) => {
    const slot = board[index]!;
    wordMap[word] = {
      roleForTeam1: slot.roleForTeam1!,
      roleForTeam2: slot.roleForTeam2!,
      revealedOnTeam1: null,
      revealedOnTeam2: null,
    };
  });
  return wordMap;
}

const otherTeam = (team: TeamId): TeamId => (team === 1 ? 2 : 1);

export class Game {
  private wordMap: WordMap;
  private agentsLeftTeam1: number;
  private agentsLeftTeam2: number;
  private turnsLeft: number;
  private currentTurn?: CurrentTurn;

  constructor(init: GameInit = {}) {
    this.wordMap = init.wordMap ?? buildWordMap();
    this.agentsLeftTeam1 = init.agentsLeftTeam1 ?? COUNTS.AGENTS_PER_PLAYER;
    this.agentsLeftTeam2 = init.agentsLeftTeam2 ?? COUNTS.AGENTS_PER_PLAYER;
    this.turnsLeft = init.turnsLeft ?? COUNTS.TURNS;
    this.currentTurn = init.currentTurn;
  }

  giveClue(team: TeamId, clueWord: string, count: number): CurrentTurn {
    if (this.currentTurn && this.currentTurn.guessesLeft > 0) {
      // Mid-turn clue forfeit — partner abandoned remaining guesses.
      this.turnsLeft -= 1;
    }
    this.currentTurn = {
      clueGiverTeam: team,
      clueWord,
      guessesLeft: count,
    };
    return this.currentTurn;
  }

  /**
   * Guesser clicks a word. The role is evaluated against the OPPOSITE team's
   * grid (the clue-giver's grid).
   */
  guess(word: string, guesserTeam: TeamId): GuessOutcome | null {
    const square = this.wordMap[word];
    if (!square) return null;

    const clueGiverTeam = otherTeam(guesserTeam);
    const role = roleOnGrid(square, clueGiverTeam);

    if (revealedOnGrid(square, clueGiverTeam) !== null) {
      // Already revealed on the clue-giver's grid — no-op.
      return null;
    }

    // If there's no active turn (e.g. someone clicked without a clue), spin one
    // up so the rest of the bookkeeping is uniform. Matches the legacy fallback.
    if (!this.currentTurn) {
      this.currentTurn = {
        clueGiverTeam,
        clueWord: '',
        guessesLeft: this.totalAgentsLeft(),
      };
    } else if (this.currentTurn.clueGiverTeam !== clueGiverTeam) {
      // The other team was mid-turn but this guess belongs to a fresh turn
      // from the opposite side. Forfeit the prior turn.
      this.turnsLeft -= 1;
      this.currentTurn = {
        clueGiverTeam,
        clueWord: '',
        guessesLeft: this.totalAgentsLeft(),
      };
    }

    setRevealedOnGrid(square, clueGiverTeam, role);

    let overlappingAgent = false;
    let turnEnded = false;

    if (role === 'AGENT') {
      this.decrementAgents(clueGiverTeam);
      // Codenames Duet rule: when an overlapping agent is found, it counts
      // for BOTH grids. Mark it revealed on the guesser's grid too.
      const guesserGridRole = roleOnGrid(square, guesserTeam);
      if (guesserGridRole === 'AGENT' && revealedOnGrid(square, guesserTeam) === null) {
        setRevealedOnGrid(square, guesserTeam, 'AGENT');
        this.decrementAgents(guesserTeam);
        overlappingAgent = true;
      }
      this.currentTurn.guessesLeft -= 1;
      if (this.currentTurn.guessesLeft <= 0) {
        this.currentTurn = undefined;
        this.turnsLeft -= 1;
        turnEnded = true;
      }
    } else if (role === 'NON_AGENT') {
      this.currentTurn = undefined;
      this.turnsLeft -= 1;
      turnEnded = true;
    } else {
      // ASSASSIN — game over
      this.currentTurn = undefined;
      this.turnsLeft = 0;
      turnEnded = true;
    }

    return {
      word,
      role,
      overlappingAgent,
      guessesLeft: this.currentTurn?.guessesLeft ?? 0,
      turnsLeft: this.turnsLeft,
      agentsLeftTeam1: this.agentsLeftTeam1,
      agentsLeftTeam2: this.agentsLeftTeam2,
      turnEnded,
      result: this.getResult(),
    };
  }

  endTurn(): void {
    if (this.currentTurn) {
      this.currentTurn = undefined;
      this.turnsLeft -= 1;
    }
  }

  getResult(): GameResult | null {
    if (this.agentsLeftTeam1 === 0 && this.agentsLeftTeam2 === 0) return 'win';
    // Assassin path: turnsLeft was hard-zeroed by an assassin reveal.
    if (this.turnsLeft <= 0) {
      // Distinguish assassin from turn exhaustion by scanning reveals.
      for (const square of Object.values(this.wordMap)) {
        if (square.revealedOnTeam1 === 'ASSASSIN' || square.revealedOnTeam2 === 'ASSASSIN') {
          return 'loss-assassin';
        }
      }
      return 'loss-turns';
    }
    return null;
  }

  isOver(): boolean {
    return this.getResult() !== null;
  }

  getCurrentClue(): CurrentTurn | null {
    if (this.currentTurn && this.currentTurn.guessesLeft > 0) {
      return this.currentTurn;
    }
    return null;
  }

  getTurnsLeft(): number {
    return this.turnsLeft;
  }

  getAgentsLeft(): { team1: number; team2: number } {
    return { team1: this.agentsLeftTeam1, team2: this.agentsLeftTeam2 };
  }

  /**
   * Per-player view. Only includes role for the requesting team's grid —
   * the partner's role assignments are NEVER leaked.
   */
  getViewForPlayer(team: TeamId): PlayerView {
    const words: Record<string, PlayerView['words'][string]> = {};
    for (const [word, square] of Object.entries(this.wordMap)) {
      words[word] = {
        myRole: roleOnGrid(square, team),
        revealedOnMine: revealedOnGrid(square, team),
        revealedOnTheirs: revealedOnGrid(square, otherTeam(team)),
      };
    }
    const clue = this.getCurrentClue();
    return {
      words,
      agentsLeftTeam1: this.agentsLeftTeam1,
      agentsLeftTeam2: this.agentsLeftTeam2,
      turnsLeft: this.turnsLeft,
      currentClue: clue
        ? { fromTeam: clue.clueGiverTeam, word: clue.clueWord, guessesLeft: clue.guessesLeft }
        : null,
      result: this.getResult(),
    };
  }

  /** Words on the board (deterministic order, useful for tests / debugging). */
  getWords(): string[] {
    return Object.keys(this.wordMap);
  }

  private totalAgentsLeft(): number {
    // Used as the upper bound on legacy-fallback guessesLeft. Approximates
    // "you have at most this many guesses to find every remaining agent."
    return Math.max(this.agentsLeftTeam1, this.agentsLeftTeam2);
  }

  private decrementAgents(team: TeamId): void {
    if (team === 1) {
      this.agentsLeftTeam1 = Math.max(0, this.agentsLeftTeam1 - 1);
    } else {
      this.agentsLeftTeam2 = Math.max(0, this.agentsLeftTeam2 - 1);
    }
  }
}

function roleOnGrid(square: Square, team: TeamId): Role {
  return team === 1 ? square.roleForTeam1 : square.roleForTeam2;
}

function revealedOnGrid(square: Square, team: TeamId): Role | null {
  return team === 1 ? square.revealedOnTeam1 : square.revealedOnTeam2;
}

function setRevealedOnGrid(square: Square, team: TeamId, role: Role): void {
  if (team === 1) {
    square.revealedOnTeam1 = role;
  } else {
    square.revealedOnTeam2 = role;
  }
}
