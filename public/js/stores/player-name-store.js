import { createReducer } from 'redux-act';
import { getActiveGameId } from './game-store';
import { setPlayerId, setPlayerName, setFacebookId } from './actions';
import { changePlayer } from '../fetchers';

const reducer = createReducer({
	[setPlayerName]: (state, payload) => ({ ...state, playerName: payload.playerName }),
	[setFacebookId]: (state, { playerName, facebookId, facebookImage } = {}) => ({
		...state,
		playerName,
		facebookId,
		facebookImage,
	}),
	[setPlayerId]: (state, { playerId } = {}) => {
		if (playerId === state.playerId || typeof playerId !== 'number') return state;

		return {
			...state,
			playerId,
		};
	},
}, {});


// Thunks
export function changePlayerDetails({ playerName, facebookImage, facebookId }) {
	return (dispatch, getState) => {
		const state = getState();

		return changePlayer({
			gameId: getActiveGameId(state),
			playerName,
			facebookId,
			facebookImage,
		});
	};
}


// Selectors
export const getPlayerId = state => state && state.playerName && state.playerName.playerId;
export const getPlayerName = state => state && state.playerName && state.playerName.playerName;
export const getFacebookId = state => state && state.playerName && state.playerName.facebookId;
export const getFacebookImage = state => state && state.playerName && state.playerName.facebookImage;

export default reducer;
