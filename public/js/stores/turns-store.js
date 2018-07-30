import { createAction, createReducer } from 'redux-act';
import { endTurn as submitEndTurn, giveClue as submitGiveClue } from '../fetchers';
import { getPlayerId } from './player-id-store';
import { getActiveGameId } from './game-store';
import { AGENTS_PER_PLAYER } from '../rules/game';

export const updateTurnsLeft = createAction('Update remaining turns left in the game');
export const updateClue = createAction('Update the current clue and player giving clue');
export const updateGuessesLeft = createAction('Update the current guesses left for the clue');

const INITIAL_STATE = {
	turnsLeft: AGENTS_PER_PLAYER,
	wordsGuessedThisTurn: [],
};

export const reducer = createReducer({
	[updateTurnsLeft]: (state, { gameId, turnsLeft }) => {
		if (!gameId) return state;

		const {
			playerGivingClue, clue, guessesLeft, ...prevGameState
		} = state[gameId] || INITIAL_STATE;

		return {
			...state,
			[gameId]: {
				...prevGameState,
				turnsLeft,
			},
		};
	},
	[updateClue]: (state, {
		gameId, word, number, playerGivingClue,
	}) => {
		if (!gameId) return state;

		const prevGameState = state[gameId] || INITIAL_STATE;

		return {
			...state,
			[gameId]: {
				...prevGameState,
				playerGivingClue,
				clue: {
					word,
					number: window.parseInt(number, 10),
				},
				guessesLeft: window.parseInt(number, 10),
			},
		};
	},
	[updateGuessesLeft]: (state, { gameId, guessesLeft } = {}) => {
		if (!gameId) return state;

		const prevGameState = state[gameId] || INITIAL_STATE;

		return {
			...state,
			[gameId]: {
				...prevGameState,
				guessesLeft,
			},
		};
	},
}, {});

// Selectors
export const getTurnsLeftForGameId = (state, gameId) => {
	const turnsLeft = state && state.turns && state.turns[gameId] && state.turns[gameId].turnsLeft;
	return (typeof turnsLeft === 'number') ? turnsLeft : INITIAL_STATE.turnsLeft;
};
export const getClueForGameId = (state, gameId) => state && state.turns && state.turns[gameId] && state.turns[gameId].clue;
export const getGuessesLeftForGameId = (state, gameId) => state && state.turns && state.turns[gameId] && state.turns[gameId].guessesLeft;

// Thunks
export function giveClue({ word, number }) {
	return (dispatch, getState) => {
		const gameId = getActiveGameId(getState());

		return submitGiveClue({
			gameId,
			player: getPlayerId(getState(), gameId),
			word,
			number,
		});
	};
}

export function endTurn() {
	return (dispatch, getState) => (
		submitEndTurn({
			gameId: getActiveGameId(getState()),
		})
	);
}

export default reducer;
