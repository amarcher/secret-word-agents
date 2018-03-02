import { createAction, createReducer } from 'redux-act';
import { endTurn as submitEndTurn, giveClue as submitGiveClue } from '../fetchers';
import { getPlayerId } from './player-id-store';
import { getGameId } from './game-store';
import { AGENTS_PER_PLAYER } from '../rules/game';

export const updateTurnsLeft = createAction('Update remaining turns left in the game');
export const updateClue = createAction('Update the current clue and player giving clue');
export const updateGuessesLeft = createAction('Update the current guesses left for the clue');

const INITIAL_STATE = {
	turnsLeft: AGENTS_PER_PLAYER,
	wordsGuessedThisTurn: [],
};

const reducer = createReducer({
	[updateTurnsLeft]: (state, payload) => ({
		...state,
		turnsLeft: payload,
		playerGivingClue: undefined,
		clue: undefined,
		guessesLeft: undefined,
	}),
	[updateClue]: (state, { word, number, playerGivingClue }) => ({
		...state,
		playerGivingClue,
		clue: {
			word,
			number: window.parseInt(number, 10),
		},
		guessesLeft: window.parseInt(number, 10),
	}),
	[updateGuessesLeft]: (state, { guessesLeft } = {}) => ({
		...state,
		guessesLeft,
	}),
}, INITIAL_STATE);

// Selectors
export const getTurnsLeft = state => state && state.turns && state.turns.turnsLeft;
export const getClue = state => state && state.turns && state.turns.clue;
export const getGuessesLeft = state => state && state.turns && state.turns.guessesLeft;

// Thunks
export function giveClue({ word, number }) {
	return (dispatch, getState) => (
		submitGiveClue({
			gameId: getGameId(getState()),
			player: getPlayerId(getState()),
			word,
			number,
		})
	);
}

export function endTurn() {
	return (dispatch, getState) => (
		submitEndTurn({
			gameId: getGameId(getState()),
		})
	);
}

export default reducer;
