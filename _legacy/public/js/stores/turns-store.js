import { createReducer } from 'redux-act';
import { endTurn as submitEndTurn, giveClue as submitGiveClue } from '../fetchers';
import { updateTurnsLeft, updateClue, updateGuessesLeft } from './actions';
import { getTeamId } from './team-id-store';
import { getActiveGameId, getGameById } from './game-store';
import { AGENTS_PER_PLAYER } from '../rules/game';

const INITIAL_STATE = {
	turnsLeft: AGENTS_PER_PLAYER,
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
export const getPlayerGivingClueForGameId = (state, gameId) => state && state.turns && state.turns[gameId] && state.turns[gameId].playerGivingClue;
export const getGuessesLeftForGameId = (state, gameId) => state && state.turns && state.turns[gameId] && state.turns[gameId].guessesLeft;
export const isActiveGuesserForGameId = (state, gameId) => {
	const playerGivingClue = getPlayerGivingClueForGameId(state, gameId);
	const teamId = getTeamId(state, gameId);
	const game = getGameById(state, gameId);
	const hasGuessedWordThisTurn = teamId && Object.values(game.words).some(word => (
		word.guessedThisTurn && word.roleRevealedForClueGiver[`${teamId === 1 ? 'playerOne' : 'playerTwo'}`] === 'AGENT'
	));
	return hasGuessedWordThisTurn || (playerGivingClue && teamId && playerGivingClue.toLowerCase().indexOf(teamId) === -1);
};

// Thunks
export function giveClue({ word, number }) {
	return (dispatch, getState) => {
		const gameId = getActiveGameId(getState());

		return submitGiveClue({
			gameId,
			teamId: getTeamId(getState(), gameId),
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
