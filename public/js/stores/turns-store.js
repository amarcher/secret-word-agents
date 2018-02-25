import { createAction, createReducer } from 'redux-act';

export const updateTurns = createAction('Update count of players connected to the game');

const INITIAL_STATE = {
	turnsLeft: 9,
};

const reducer = createReducer({
	[updateTurns]: (state, payload) => ({
		...state,
		turnsLeft: payload,
	}),
}, INITIAL_STATE);

// Selectors
export const getTurnsLeft = state => state && state.turns.turnsLeft;

export default reducer;
