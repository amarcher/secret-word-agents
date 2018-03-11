import { createAction, createReducer } from 'redux-act';

export const incrementPlayerCount = createAction('Increment count of players connected to the game');
export const decrementPlayerCount = createAction('Decrement count of players connected to the game');

const initialState = { count: 0, connectedPlayerNames: [] };

const reducer = createReducer({
	[incrementPlayerCount]: (state, { count, playerName }) => {
		if (!count) return state;

		return {
			...state,
			count,
			connectedPlayerNames: [
				...state.connectedPlayerNames,
				playerName,
			],
		};
	},
	[decrementPlayerCount]: (state, { count, playerName }) => {
		if (!count) return state;

		const playerIndex = state.connectedPlayerNames.indexOf(playerName);

		return {
			...state,
			count,
			connectedPlayerNames: [
				...state.connectedPlayerNames.slice(0, playerIndex),
				...state.connectedPlayerNames.slice(playerIndex + 1),
			],
		};
	},
}, initialState);

// Selectors
export const getPlayers = state => state && state.players && state.players.count;
export const getConnectedPlayerNames = state => state && state.players && state.players.connectedPlayerNames;

export default reducer;
