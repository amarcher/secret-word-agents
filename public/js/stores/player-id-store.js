import { createAction, createReducer } from 'redux-act';
import { changePlayer } from '../fetchers';

export const setPlayerId = createAction('Set player id');

const reducer = createReducer({
	[setPlayerId]: (state, payload) => payload.player,
}, '');


// Selectors
export const getPlayerId = state => state && state.playerId;

// Thunks
export function changePlayerId({ playerId }) {
	return (dispatch, getState) => (
		changePlayer({
			gameId: getState().game.gameId,
			player: playerId,
		})
	);
}

export default reducer;
