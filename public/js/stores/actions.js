import { createAction } from 'redux-act';

// game-store

export const updateGames = createAction('Update games');
export const addOrReplaceGame = createAction('Add or replace game');
export const updateWordInGame = createAction('Update roleRevealedForClueGiver for a word in a game');
export const updateAgentsLeft = createAction('Update remaining agents for each team');

// turns-store

export const updateTurnsLeft = createAction('Update remaining turns left in the game');
export const updateClue = createAction('Update the current clue and player giving clue');
export const updateGuessesLeft = createAction('Update the current guesses left for the clue');

// team-id-store

export const setTeamId = createAction('Set team id');

// players-store

export const incrementPlayerCount = createAction('Increment count of players connected to the game');
export const decrementPlayerCount = createAction('Decrement count of players connected to the game');
export const clearPlayers = createAction('Remove all players from the game');

// player-name-store

export const setPlayerId = createAction('Set player id');
export const setPlayerName = createAction('Set player name');
export const setFacebookId = createAction('Set Facebook id');
