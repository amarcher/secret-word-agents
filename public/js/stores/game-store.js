import { createAction, createReducer } from 'redux-act';
import { fetchGame, guess } from '../fetchers';
import { updateTurnsLeft } from './turns-store';

export const addOrReplaceGame = createAction('Add or replace game');
export const updateWordInGame = createAction('Update roleRevealedForClueGiver for a word in a game');

const reducer = createReducer({
	[addOrReplaceGame]: (state, game) => {
		if (!game) return state;

		return game;
	},

	[updateWordInGame]: (state, { gameId, word, roleRevealedForClueGiver }) => {
		if (gameId !== state.gameId) return state;

		return {
			...state,
			words: {
				...state.words,
				[word]: {
					...state.words[word],
					roleRevealedForClueGiver,
					guessedThisTurn: true,
				},
			},
		};
	},

	[updateTurnsLeft]: (state) => {
		const words = Object.keys(state.words).reduce((allWords, word) => ({
			...allWords,
			[word]: {
				...state.words[word],
				guessedThisTurn: undefined,
			},
		}), {});

		return {
			...state,
			words,
		};
	},
}, {});

// Selectors
export const getGame = state => state && state.game;
export const getGameId = state => state && state.game && state.game.gameId;

// Thunks
export function enterGame({ gameId }) {
	return () => fetchGame({ gameId });
}

export function makeGuess({ word }) {
	return (dispatch, getState) => {
		const { gameId } = getState().game;
		const { playerId } = getState();
		return guess({ gameId, word, player: playerId });
	};
}

export default reducer;
