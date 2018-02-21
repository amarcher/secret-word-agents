import { createAction, createReducer } from 'redux-act';
import { fetchGame } from '../fetchers';

const addOrReplaceGame = createAction('Add or replace game');

const reducer = createReducer({
	[addOrReplaceGame]: (state, game) => {
		if (!game) return state;

		return game;
	},
}, {});

// Selectors
export const getGame = state => state && state.game;

// Thunks
export function enterGame({ gameId }) {
	return dispatch => fetchGame({ gameId }).then((game) => {
		dispatch(addOrReplaceGame(game));
	});
}

export default reducer;
