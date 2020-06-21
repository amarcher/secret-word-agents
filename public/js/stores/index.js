import { createStore, combineReducers, applyMiddleware } from 'redux';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction';
import thunkMiddleware from 'redux-thunk';
import createHistory from 'history/createBrowserHistory';

import {
	addOrReplaceGame,
	updateWordInGame,
	updateTurnsLeft,
	updateClue,
	updateGuessesLeft,
	updateAgentsLeft,
	incrementPlayerCount,
	decrementPlayerCount,
	clearPlayers,
	setTeamId,
	setPlayerId,
} from './actions';
import gameReducer, { enterGame, getActiveGameId } from './game-store';
import playersReducer from './players-store';
import turnsReducer from './turns-store';
import teamIdReducer from './team-id-store';
import playerNameReducer from './player-name-store';
import { sendNotification } from '../utils/notifications';
import { addCallbacks as addWsCallbacks } from '../utils/ws';

export const history = createHistory();
const middleware = routerMiddleware(history);
const composeEnhancers = composeWithDevTools({});

export const store = createStore(
	combineReducers({
		game: gameReducer,
		turns: turnsReducer,
		players: playersReducer,
		teamId: teamIdReducer,
		playerName: playerNameReducer,
		router: routerReducer,
	}),
	composeEnhancers(applyMiddleware(thunkMiddleware, middleware)),
);

export function onWsEvent(data) {
	const { type, payload: payloadWithoutGameId, gameId } = data;
	const payload = { ...payloadWithoutGameId, gameId };

	switch (type) {
	case 'words':
		return store.dispatch(addOrReplaceGame(payload));
	case 'guess':
		sendNotification('A guess has been made in your game!');

		store.dispatch(updateWordInGame(payload));
		store.dispatch(updateAgentsLeft(payload));
		return store.dispatch(updateGuessesLeft(payload));
	case 'playerLeft':
		return store.dispatch(decrementPlayerCount(payload));
	case 'playerJoined':
		return store.dispatch(incrementPlayerCount(payload));
	case 'playerChanged':
		return store.dispatch(setPlayerId(payload));
	case 'teamChanged':
		return store.dispatch(setTeamId(payload));
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
	const gameId = getActiveGameId(state);

	if (!gameId) return;

	store.dispatch(clearPlayers({ gameId }));
	store.dispatch(enterGame({ gameId }));
}

addWsCallbacks({ onWsEvent, onWsConnected });


export default store;
