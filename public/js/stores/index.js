import { createStore, combineReducers, applyMiddleware } from 'redux';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import thunkMiddleware from 'redux-thunk';
import createHistory from 'history/createBrowserHistory';

import gameReducer, { enterGame, getGameId, addOrReplaceGame, updateWordInGame } from './game-store';
import playersReducer, { incrementPlayerCount, decrementPlayerCount, clearPlayers } from './players-store';
import turnsReducer, { updateTurnsLeft, updateClue, updateGuessesLeft } from './turns-store';
import playerIdReducer, { setPlayerId, getPlayerName } from './player-id-store';
import { sendNotification } from '../utils/notifications';
import { addCallbacks as addWsCallbacks } from '../utils/ws';

export const history = createHistory();
const middleware = routerMiddleware(history);

export const store = createStore(
	combineReducers({
		game: gameReducer,
		turns: turnsReducer,
		players: playersReducer,
		playerId: playerIdReducer,
		router: routerReducer,
	}),
	applyMiddleware(thunkMiddleware, middleware),
);

export function onWsEvent(data) {
	const { type, payload } = data;

	switch (type) {
	case 'words':
		return store.dispatch(addOrReplaceGame(payload));
	case 'guess':
		sendNotification('A guess has been made in your game!');

		store.dispatch(updateWordInGame(payload));
		return store.dispatch(updateGuessesLeft(payload));
	case 'playerLeft':
		return store.dispatch(decrementPlayerCount(payload));
	case 'playerJoined':
		return store.dispatch(incrementPlayerCount(payload));
	case 'playerChanged':
		return store.dispatch(setPlayerId(payload));
	case 'turns':
		return store.dispatch(updateTurnsLeft(payload));
	case 'clueGiven':
		sendNotification('A clue has been given in your game!');

		return store.dispatch(updateClue(payload));
	default:
		return null;
	}
}

export function onWsConnected() {
	const state = store.getState();
	const gameId = getGameId(state);
	const playerName = getPlayerName(state);

	store.dispatch(clearPlayers());
	return store.dispatch(enterGame({ gameId, playerName }));
}

addWsCallbacks({ onWsEvent, onWsConnected });


export default store;
