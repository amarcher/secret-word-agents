import { createAction, createReducer } from 'redux-act';

export const updatePlayerCount = createAction('Update count of players connected to the game');

const reducer = createReducer({
	[updatePlayerCount]: (state, payload) => {
		if (!payload.count) return state;
		return payload.count;
	},
}, 0);

// Selectors
export const getPlayers = state => state && state.players;

export default reducer;
