import { createAction, createReducer } from 'redux-act';
import { changePlayer } from '../fetchers';
import { getActiveGameId } from './game-store';
import { getPlayerName, getFacebookId } from './player-name-store';

export const setPlayerId = createAction('Set player id');
export const setPlayerName = createAction('Set player name');
export const setFacebookId = createAction('Set Facebook id');

const reducer = createReducer({
	[setPlayerId]: (state, { gameId, player }) => {
		if (!gameId) return state;

		return {
			...state,
			[gameId]: {
				id: player,
			},
		};
	},
}, {});

// Selectors
export const getPlayerId = (state, gameId) => state && state.playerId && state.playerId[gameId]
	&& state.playerId[gameId].id;

// Thunks
export function changePlayerId({ playerId }) {
	return (dispatch, getState) => {
		const state = getState();

		return changePlayer({
			gameId: getActiveGameId(state),
			player: playerId,
			playerName: getPlayerName(state),
			facebookId: getFacebookId(state),
		});
	};
}

export default reducer;
