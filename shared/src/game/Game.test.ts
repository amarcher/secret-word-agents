import { describe, expect, it } from 'vitest';
import { COUNTS, Game } from './Game.js';
import type { Role, WordMap } from './types.js';

function makeWord(roleForTeam1: Role, roleForTeam2: Role): WordMap[string] {
  return { roleForTeam1, roleForTeam2, revealedOnTeam1: null, revealedOnTeam2: null };
}

function makeBoard(entries: Array<[string, Role, Role]>): WordMap {
  const map: WordMap = {};
  for (const [word, t1, t2] of entries) {
    map[word] = makeWord(t1, t2);
  }
  return map;
}

describe('Game.guess', () => {
  it('reveals an AGENT on the clue-giver grid and decrements that team only when not overlapping', () => {
    const game = new Game({
      wordMap: makeBoard([
        ['SPY', 'AGENT', 'NON_AGENT'],
        ['DUMMY', 'NON_AGENT', 'NON_AGENT'],
      ]),
      agentsLeftTeam1: 1,
      agentsLeftTeam2: 1,
    });
    game.giveClue(1, 'OBSERVE', 1);

    const out = game.guess('SPY', 2);
    expect(out).not.toBeNull();
    expect(out!.role).toBe('AGENT');
    expect(out!.overlappingAgent).toBe(false);
    expect(out!.agentsLeftTeam1).toBe(0);
    expect(out!.agentsLeftTeam2).toBe(1);
  });

  it('decrements BOTH teams on an overlapping AGENT and marks revealed on both grids', () => {
    const game = new Game({
      wordMap: makeBoard([['DOUBLE', 'AGENT', 'AGENT']]),
      agentsLeftTeam1: 5,
      agentsLeftTeam2: 5,
    });
    game.giveClue(1, 'BOTH', 1);

    const out = game.guess('DOUBLE', 2);
    expect(out!.role).toBe('AGENT');
    expect(out!.overlappingAgent).toBe(true);
    expect(out!.agentsLeftTeam1).toBe(4);
    expect(out!.agentsLeftTeam2).toBe(4);

    // Both grids reflect the reveal.
    const view1 = game.getViewForPlayer(1);
    const view2 = game.getViewForPlayer(2);
    expect(view1.words.DOUBLE!.revealedOnMine).toBe('AGENT');
    expect(view2.words.DOUBLE!.revealedOnMine).toBe('AGENT');
  });

  it('ends the turn and decrements turnsLeft on a NON_AGENT guess', () => {
    const game = new Game({
      wordMap: makeBoard([['BYSTANDER', 'NON_AGENT', 'AGENT']]),
      turnsLeft: 5,
    });
    game.giveClue(1, 'CIVIL', 1);

    const out = game.guess('BYSTANDER', 2);
    expect(out!.role).toBe('NON_AGENT');
    expect(out!.turnEnded).toBe(true);
    expect(out!.turnsLeft).toBe(4);
    expect(game.getCurrentClue()).toBeNull();
  });

  it('zeroes turnsLeft and reports loss-assassin on an ASSASSIN guess', () => {
    const game = new Game({
      wordMap: makeBoard([['TRAP', 'ASSASSIN', 'AGENT']]),
      turnsLeft: 7,
    });
    game.giveClue(1, 'CARELESS', 1);

    const out = game.guess('TRAP', 2);
    expect(out!.role).toBe('ASSASSIN');
    expect(out!.turnsLeft).toBe(0);
    expect(out!.result).toBe('loss-assassin');
    expect(game.isOver()).toBe(true);
    expect(game.getResult()).toBe('loss-assassin');
  });

  it('does not end the turn on AGENT until guessesLeft hits 0', () => {
    const game = new Game({
      wordMap: makeBoard([
        ['ALPHA', 'AGENT', 'NON_AGENT'],
        ['BETA', 'AGENT', 'NON_AGENT'],
      ]),
      agentsLeftTeam1: 2,
      agentsLeftTeam2: 0,
      turnsLeft: 5,
    });
    game.giveClue(1, 'GREEK', 2);

    const first = game.guess('ALPHA', 2);
    expect(first!.turnEnded).toBe(false);
    expect(first!.turnsLeft).toBe(5);
    expect(game.getCurrentClue()?.guessesLeft).toBe(1);

    const second = game.guess('BETA', 2);
    expect(second!.turnEnded).toBe(true);
    expect(second!.turnsLeft).toBe(4);
  });

  it('returns null for an already-revealed word on the clue-giver grid', () => {
    const game = new Game({
      wordMap: makeBoard([['ECHO', 'AGENT', 'NON_AGENT']]),
      agentsLeftTeam1: 1,
    });
    game.giveClue(1, 'SOUND', 1);
    expect(game.guess('ECHO', 2)).not.toBeNull();
    // Now team 2 cannot guess ECHO again — revealed on team 1's grid.
    game.giveClue(1, 'AGAIN', 1);
    expect(game.guess('ECHO', 2)).toBeNull();
  });

  it('returns null for an unknown word', () => {
    const game = new Game({
      wordMap: makeBoard([['KNOWN', 'AGENT', 'NON_AGENT']]),
    });
    game.giveClue(1, 'X', 1);
    expect(game.guess('UNKNOWN', 2)).toBeNull();
  });
});

describe('Game.giveClue', () => {
  it('decrements turnsLeft when a previous turn still had guesses left (mid-turn forfeit)', () => {
    const game = new Game({
      wordMap: makeBoard([
        ['A', 'AGENT', 'NON_AGENT'],
        ['B', 'AGENT', 'NON_AGENT'],
      ]),
      turnsLeft: 5,
    });
    game.giveClue(1, 'FIRST', 3);
    // Partner only used 1 of 3 guesses — but team 1 issues a new clue anyway.
    game.giveClue(1, 'SECOND', 2);
    expect(game.getTurnsLeft()).toBe(4);
  });

  it('does not decrement turnsLeft on the very first clue', () => {
    const game = new Game({
      wordMap: makeBoard([['X', 'AGENT', 'NON_AGENT']]),
      turnsLeft: 9,
    });
    game.giveClue(1, 'OPENER', 1);
    expect(game.getTurnsLeft()).toBe(9);
  });
});

describe('Game.getViewForPlayer', () => {
  it('only exposes the requesting team\'s role — never the partner\'s', () => {
    const game = new Game({
      wordMap: makeBoard([
        ['ROLE', 'AGENT', 'ASSASSIN'],
        ['CIVIL', 'NON_AGENT', 'AGENT'],
      ]),
    });

    const v1 = game.getViewForPlayer(1);
    expect(v1.words.ROLE!.myRole).toBe('AGENT');
    expect(v1.words.CIVIL!.myRole).toBe('NON_AGENT');
    // The view object must not contain any field naming team 2's role.
    const serialized = JSON.stringify(v1);
    expect(serialized.includes('ASSASSIN')).toBe(false);

    const v2 = game.getViewForPlayer(2);
    expect(v2.words.ROLE!.myRole).toBe('ASSASSIN');
    expect(v2.words.CIVIL!.myRole).toBe('AGENT');
  });

  it('exposes reveals on both grids so each player sees outcomes', () => {
    const game = new Game({
      wordMap: makeBoard([['SHARED', 'AGENT', 'AGENT']]),
      agentsLeftTeam1: 1,
      agentsLeftTeam2: 1,
    });
    game.giveClue(1, 'X', 1);
    game.guess('SHARED', 2);

    const v2 = game.getViewForPlayer(2);
    // Team 2 guessed SHARED. It revealed on team 1's grid (the clue giver)
    // and — because it was an overlap — also on team 2's own grid.
    expect(v2.words.SHARED!.revealedOnTheirs).toBe('AGENT');
    expect(v2.words.SHARED!.revealedOnMine).toBe('AGENT');
  });
});

describe('Game.endTurn', () => {
  it('decrements turnsLeft only when there is an active turn', () => {
    const game = new Game({
      wordMap: makeBoard([['X', 'AGENT', 'NON_AGENT']]),
      turnsLeft: 3,
    });
    game.endTurn();
    expect(game.getTurnsLeft()).toBe(3);

    game.giveClue(1, 'C', 2);
    game.endTurn();
    expect(game.getTurnsLeft()).toBe(2);
  });
});

describe('Game.getResult', () => {
  it('returns "win" when both teams\' agent counts hit 0', () => {
    const game = new Game({
      wordMap: makeBoard([['LAST', 'AGENT', 'AGENT']]),
      agentsLeftTeam1: 1,
      agentsLeftTeam2: 1,
    });
    expect(game.getResult()).toBeNull();
    game.giveClue(1, 'GO', 1);
    game.guess('LAST', 2);
    expect(game.getResult()).toBe('win');
  });

  it('returns "loss-turns" when turnsLeft hits 0 without any assassin reveal', () => {
    const game = new Game({
      wordMap: makeBoard([['X', 'NON_AGENT', 'NON_AGENT']]),
      turnsLeft: 1,
    });
    game.giveClue(1, 'C', 1);
    game.guess('X', 2);
    expect(game.getResult()).toBe('loss-turns');
  });

  it('returns null while the game is in progress', () => {
    const game = new Game({
      wordMap: makeBoard([['X', 'AGENT', 'NON_AGENT']]),
      agentsLeftTeam1: 5,
      agentsLeftTeam2: 5,
      turnsLeft: 3,
    });
    expect(game.getResult()).toBeNull();
  });
});

describe('default board generation', () => {
  it('produces 25 distinct words and the canonical role distribution', () => {
    const game = new Game();
    const words = game.getWords();
    expect(words).toHaveLength(COUNTS.WORDS);
    expect(new Set(words).size).toBe(COUNTS.WORDS);

    let team1Agents = 0;
    let team2Agents = 0;
    let team1Assassins = 0;
    let team2Assassins = 0;
    let overlappingAgents = 0;

    for (const w of words) {
      const v1 = game.getViewForPlayer(1).words[w]!;
      const v2 = game.getViewForPlayer(2).words[w]!;
      if (v1.myRole === 'AGENT') team1Agents++;
      if (v2.myRole === 'AGENT') team2Agents++;
      if (v1.myRole === 'ASSASSIN') team1Assassins++;
      if (v2.myRole === 'ASSASSIN') team2Assassins++;
      if (v1.myRole === 'AGENT' && v2.myRole === 'AGENT') overlappingAgents++;
    }

    expect(team1Agents).toBe(COUNTS.AGENTS_PER_PLAYER);
    expect(team2Agents).toBe(COUNTS.AGENTS_PER_PLAYER);
    expect(team1Assassins).toBe(COUNTS.ASSASSINS_PER_PLAYER);
    expect(team2Assassins).toBe(COUNTS.ASSASSINS_PER_PLAYER);
    expect(team1Agents + team2Agents - overlappingAgents).toBe(COUNTS.TOTAL_AGENTS);
  });
});
