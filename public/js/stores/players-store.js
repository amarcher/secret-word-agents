import { createAction, createReducer } from 'redux-act';

export const incrementPlayerCount = createAction('Increment count of players connected to the game');
export const decrementPlayerCount = createAction('Decrement count of players connected to the game');
export const clearPlayers = createAction('Remove all players from the game');

const initialPlayersState = { count: 0, teamOne: [], teamTwo: [] };

const reducer = createReducer({
	[incrementPlayerCount]: (state, {
		gameId, count, playerId, playerName, teamId, facebookImage,
	}) => {
		if (!gameId) return state;

		const prevPlayerCount = state[gameId] || initialPlayersState;
		const teamProperty = `team${parseInt(teamId, 10) === 1 ? 'One' : 'Two'}`;

		return {
			...state,
			[gameId]: {
				...prevPlayerCount,
				count,
				[teamProperty]: [
					...prevPlayerCount[teamProperty],
					{ playerId, playerName, facebookImage },
				],
			},
		};
	},
	[decrementPlayerCount]: (state, { gameId, count, playerId }) => {
		if (!gameId) return state;

		const prevPlayerCount = state[gameId] || initialPlayersState;

		const playerIndex = prevPlayerCount.connectedPlayerNames.findIndex(player => player.playerId === playerId);

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
export const getConnectedPlayerNamesForGameId = (state, gameId) => {
	if (!(state && state.players && state.players[gameId])) return { teamOne: [], teamTwo: [] };

	const { teamOne, teamTwo } = state.players[gameId];
	return { teamOne, teamTwo };
};

export default reducer;
