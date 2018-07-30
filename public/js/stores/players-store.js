import { createAction, createReducer } from 'redux-act';

export const incrementPlayerCount = createAction('Increment count of players connected to the game');
export const decrementPlayerCount = createAction('Decrement count of players connected to the game');
export const clearPlayers = createAction('Remove all players from the game');

const initialPlayersState = { count: 0, connectedPlayerNames: [] };

const reducer = createReducer({
	[incrementPlayerCount]: (state, { gameId, count, playerName }) => {
		if (!count || !gameId) return state;

		const prevPlayerCount = state[gameId] || initialPlayersState;

		return {
			...state,
			[gameId]: {
				...prevPlayerCount,
				count,
				connectedPlayerNames: [
					...prevPlayerCount.connectedPlayerNames,
					playerName,
				],
			},
		};
	},
	[decrementPlayerCount]: (state, { gameId, count, playerName }) => {
		if (!count || !gameId) return state;

		const prevPlayerCount = state[gameId] || initialPlayersState;

		const playerIndex = prevPlayerCount.connectedPlayerNames.indexOf(playerName);

		return {
			...state,
			[gameId]: {
				...prevPlayerCount,
				count,
				connectedPlayerNames: [
					...prevPlayerCount.connectedPlayerNames.slice(0, playerIndex),
					...prevPlayerCount.connectedPlayerNames.slice(playerIndex + 1),
				],
			},
		};
	},
	[clearPlayers]: (state, { gameId }) => {
		if (!gameId) return state;

		return {
			...state,
			[gameId]: initialPlayersState,
		};
	},
}, {});

// Selectors
export const getPlayersForGameId = (state, gameId) => (state && state.players && state.players[gameId] && state.players[gameId].count)
	|| initialPlayersState.count;
export const getConnectedPlayerNamesForGameId = (state, gameId) => (state && state.players && state.players[gameId]
	&& state.players[gameId].connectedPlayerNames) || initialPlayersState.connectedPlayerNames;

export default reducer;
