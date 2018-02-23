import { createStore, combineReducers, applyMiddleware } from 'redux';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import thunkMiddleware from 'redux-thunk';
import createHistory from 'history/createBrowserHistory';

import gameReducer, { addOrReplaceGame, updateWordInGame } from './game-store';
import playersReducer, { updatePlayerCount } from './players-store';
import playerIdReducer, { setPlayerId } from './player-id-store';

export const history = createHistory();
const middleware = routerMiddleware(history);

export const store = createStore(
	combineReducers({
		game: gameReducer,
		players: playersReducer,
		playerId: playerIdReducer,
		router: routerReducer,
	}),
	applyMiddleware(thunkMiddleware, middleware),
);

export function wsEvent(data) {
	const { type, payload } = data;

	switch (type) {
	case 'words':
		return store.dispatch(addOrReplaceGame(payload));
	case 'guess':
		return store.dispatch(updateWordInGame(payload));
	case 'playerLeft':
	case 'playerJoined':
		return store.dispatch(updatePlayerCount(payload));
	case 'playerChanged':
		return store.dispatch(setPlayerId(payload));
	default:
		return null;
	}
}

export default store;
