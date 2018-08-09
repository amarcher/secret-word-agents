import { createReducer } from 'redux-act';
import { updateAgentsLeft, clearPlayers, updateGames, addOrReplaceGame, updateWordInGame, updateTurnsLeft, updateClue, setTeamId } from './actions';
import { fetchGame, guess, startNewGame, fetchGames } from '../fetchers';
import { AGENTS_PER_PLAYER, TOTAL_AGENTS } from '../rules/game';
import { isAgent } from '../rules/words';

const reducer = createReducer({
	[updateGames]: (state, games) => {
		if (!games) return state;

		return games;
	},

	[addOrReplaceGame]: (state, {
		gameId, words, agentsLeftTeamOne, agentsLeftTeamTwo,
	} = {}) => {
		if (!gameId) return state;

		const newState = { ...state, [gameId]: { gameId, words } };
		if (agentsLeftTeamOne >= 0) newState[gameId].agentsLeftTeamOne = agentsLeftTeamOne;
		if (agentsLeftTeamTwo >= 0) newState[gameId].agentsLeftTeamTwo = agentsLeftTeamTwo;

		return newState;
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

	[updateAgentsLeft]: (state, { gameId, agentsLeftTeamOne, agentsLeftTeamTwo } = {}) => {
		if (!state[gameId]) return state;

		return {
			...state,
			[gameId]: {
				...state[gameId],
				agentsLeftTeamOne,
				agentsLeftTeamTwo,
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
export const getAgentsLeftForGameIdAndTeamId = (state, gameId, teamId) => {
	if (!(gameId && teamId && state && state.game && state.game[gameId] && state.game[gameId].words)) return AGENTS_PER_PLAYER;
	return state.game[gameId][`${teamId === 1 ? 'agentsLeftTeamOne' : 'agentsLeftTeamTwo'}`];
};

// Thunks
export function enterGame({ gameId }) {
	return (dispatch, getState) => {
		// replace the game with an dummy game (just an id)
		// until we have a full game object from web socket
		if (!getGameById(getState(), gameId)) dispatch(addOrReplaceGame({ gameId }));
		const state = getState();
		const playerId = state && state.playerName && state.playerName.playerId;
		const playerName = state && state.playerName && state.playerName.playerName;
		const facebookId = state && state.playerName && state.playerName.facebookId;
		const facebookImage = state && state.playerName && state.playerName.facebookImage;
		const teamId = state && state.teamId && state.teamId[gameId] && state.teamId[gameId].teamId;
		return fetchGame({
			gameId,
			playerId,
			playerName,
			facebookId,
			facebookImage,
			teamId,
		});
	};
}

export function makeGuess({ word }) {
	return (dispatch, getState) => {
		const state = getState();
		const gameId = getActiveGameId(state);
		const teamId = state && state.teamId && state.teamId[gameId] && state.teamId[gameId].teamId;
		return guess({ gameId, word, teamId });
	};
}

export function getGamesViaApi() {
	return (dispatch, getState) => {
		const state = getState();
		const facebookId = state && state.playerName && state.playerName.facebookId;

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
					dispatch(updateAgentsLeft({ gameId, ...game }));
				});
			}
		});
	};
}

export function startNew() {
	return (dispatch, getState) => startNewGame({ gameId: getActiveGameId(getState()) });
}

export default reducer;
