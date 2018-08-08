import { createAction, createReducer } from 'redux-act';
import { fetchGame, guess, startNewGame, fetchGames } from '../fetchers';
import { updateTurnsLeft, updateClue } from './turns-store';
import { clearPlayers } from './players-store';
import { getTeamId, setTeamId } from './team-id-store';
import { getFacebookId } from './player-name-store';
import { TOTAL_AGENTS } from '../rules/game';
import { isAgent } from '../rules/words';

export const updateGames = createAction('Update games');
export const addOrReplaceGame = createAction('Add or replace game');
export const updateWordInGame = createAction('Update roleRevealedForClueGiver for a word in a game');

const reducer = createReducer({
	[updateGames]: (state, games) => {
		if (!games) return state;

		return games;
	},

	[addOrReplaceGame]: (state, { gameId, words } = {}) => {
		if (!gameId) return state;

		return { ...state, [gameId]: { gameId, words } };
	},

	[updateWordInGame]: (state, { gameId, word, roleRevealedForClueGiver }) => {
		if (!state[gameId]) return state;

		return {
			...state,
			[gameId]: {
				...state[gameId],
				words: {
					...state[gameId].words,
					[word]: {
						...state[gameId].words[word],
						roleRevealedForClueGiver,
						guessedThisTurn: true,
					},
				},
			},
		};
	},

	[updateTurnsLeft]: (state, { gameId }) => {
		if (!state[gameId]) return state;

		const words = Object.keys(state[gameId].words).reduce((allWords, word) => ({
			...allWords,
			[word]: {
				...state[gameId].words[word],
				guessedThisTurn: undefined,
			},
		}), {});

		return {
			...state,
			[gameId]: {
				...state[gameId],
				words,
			},
		};
	},
}, {});

// Selectors
export const getGames = state => state && state.game && Object.keys(state.game);
export const getGameById = (state, gameId) => state && state.game && state.game[gameId];
export const getActiveGameId = state => state && state.router && state.router.location && state.router.location.pathname
	&& state.router.location.pathname.replace('/', '');
export const getAgentsLeftForGameId = (state, gameId) => gameId && state && state.game && state.game[gameId] && state.game[gameId].words &&
	Object.values(state.game[gameId].words).reduce((count, word) => (isAgent(word) ? count - 1 : count), TOTAL_AGENTS);

// Thunks
export function enterGame({ gameId, playerName }) {
	return (dispatch, getState) => {
		// replace the game with an dummy game (just an id)
		// until we have a full game object from web socket
		if (!getGameById(getState(), gameId)) dispatch(addOrReplaceGame({ gameId }));
		const facebookId = getFacebookId(getState());
		const teamId = getTeamId(getState(), gameId);
		return fetchGame({
			gameId,
			playerName,
			facebookId,
			teamId,
		});
	};
}

export function makeGuess({ word }) {
	return (dispatch, getState) => {
		const state = getState();
		const gameId = getActiveGameId(state);
		const teamId = getTeamId(state, gameId);
		return guess({ gameId, word, teamId });
	};
}

export function getGamesViaApi() {
	return (dispatch, getState) => {
		const state = getState();
		const facebookId = getFacebookId(state);

		if (!facebookId) {
			return Promise.resolve(dispatch(updateGames({})));
		}

		return fetchGames({
			facebookId,
		}).then((games) => {
			if (games) {
				dispatch(updateGames(games));
				Object.keys(games).forEach((gameId) => {
					const game = games[gameId];
					dispatch(setTeamId({ gameId, ...game }));
					dispatch(updateTurnsLeft({ gameId, ...game }));
					dispatch(updateClue({ gameId, ...game }));
					dispatch(clearPlayers({ gameId, ...game }));
				});
			}
		});
	};
}

export function startNew() {
	return (dispatch, getState) => startNewGame({ gameId: getActiveGameId(getState()) });
}

export default reducer;
