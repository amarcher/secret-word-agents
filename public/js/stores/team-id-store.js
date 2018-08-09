import { createReducer } from 'redux-act';
import { changeTeam } from '../fetchers';
import { setTeamId } from './actions';
import { getActiveGameId } from './game-store';
import { getPlayerName, getFacebookId, getFacebookImage } from './player-name-store';

const reducer = createReducer({
	[setTeamId]: (state, { gameId, teamId }) => {
		if (!gameId) return state;

		return {
			...state,
			[gameId]: {
				teamId,
			},
		};
	},
}, {});

// Selectors
export const getTeamId = (state, gameId) => state && state.teamId && state.teamId[gameId]
	&& state.teamId[gameId].teamId;

// Thunks
export function changeTeamId({ teamId }) {
	return (dispatch, getState) => {
		const state = getState();

		return changeTeam({
			gameId: getActiveGameId(state),
			teamId,
			playerName: getPlayerName(state),
			facebookId: getFacebookId(state),
			facebookImage: getFacebookImage(state),
		});
	};
}

export default reducer;
