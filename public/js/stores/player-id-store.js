import { createAction, createReducer } from 'redux-act';
import { changePlayer } from '../fetchers';
import { getGameId } from './game-store';

export const setPlayerId = createAction('Set player id');
export const setPlayerName = createAction('Set player name');

const reducer = createReducer({
	[setPlayerId]: (state, payload) => ({ ...state, id: payload.player }),
	[setPlayerName]: (state, payload) => ({ ...state, playerName: payload.playerName }),
}, {});


// Selectors
export const getPlayerId = state => state && state.playerId && state.playerId.id;
export const getPlayerName = state => state && state.playerId && state.playerId.playerName;

// Thunks
export function changePlayerId({ playerId }) {
	return (dispatch, getState) => {
		const state = getState();

		return changePlayer({
			gameId: getGameId(state),
			player: playerId,
			playerName: getPlayerName(state),
		});
	};
}

export default reducer;
