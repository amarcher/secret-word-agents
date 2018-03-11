import { createAction, createReducer } from 'redux-act';
import { fetchGame, guess, startNewGame } from '../fetchers';
import { updateTurnsLeft } from './turns-store';
import { TOTAL_AGENTS } from '../rules/game';
import { isAgent } from '../rules/words';

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
export const getAgentsLeft = state => (
	state && state.game && state.game.words && Object.values(state.game.words).reduce((count, word) => (
		isAgent(word) ? count - 1 : count
	), TOTAL_AGENTS)
);

// Thunks
export function enterGame({ gameId, playerName }) {
	return (dispatch) => {
		// replace the game with an dummy game (just an id)
		// until we have a full game object from web socket
		dispatch(addOrReplaceGame({ gameId }));
		return fetchGame({ gameId, playerName });
	};
}

export function makeGuess({ word }) {
	return (dispatch, getState) => {
		const { gameId } = getState().game;
		const { playerId } = getState();
		return guess({ gameId, word, player: playerId });
	};
}

export function startNew() {
	return (dispatch, getState) => startNewGame({ gameId: getGameId(getState()) });
}

export default reducer;
