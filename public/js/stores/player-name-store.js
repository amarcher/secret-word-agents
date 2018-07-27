import { createAction, createReducer } from 'redux-act';

export const setPlayerName = createAction('Set player name');
export const setFacebookId = createAction('Set Facebook id');

const reducer = createReducer({
	[setPlayerName]: (state, payload) => ({ ...state, playerName: payload.playerName }),
	[setFacebookId]: (state, { playerName, facebookId, facebookImage } = {}) => ({
		...state,
		playerName,
		facebookId,
		facebookImage,
	}),
}, {});


// Selectors
export const getPlayerName = state => state && state.playerName && state.playerName.playerName;
export const getFacebookId = state => state && state.playerName && state.playerName.facebookId;
export const getFacebookImage = state => state && state.playerName && state.playerName.facebookImage;

export default reducer;
