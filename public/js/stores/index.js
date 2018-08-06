import { createStore, combineReducers, applyMiddleware } from 'redux';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction';
import thunkMiddleware from 'redux-thunk';
import createHistory from 'history/createBrowserHistory';

import gameReducer, { enterGame, getActiveGameId, addOrReplaceGame, updateWordInGame } from './game-store';
import playersReducer, { incrementPlayerCount, decrementPlayerCount, clearPlayers } from './players-store';
import turnsReducer, { updateTurnsLeft, updateClue, updateGuessesLeft } from './turns-store';
import teamIdReducer, { setTeamId } from './team-id-store';
import playerNameReducer, { getPlayerName } from './player-name-store';
import { sendNotification } from '../utils/notifications';
import { addCallbacks as addWsCallbacks } from '../utils/ws';

export const history = createHistory();
const middleware = routerMiddleware(history);
// eslint-disable-next-line no-underscore-dangle
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
		return store.dispatch(updateGuessesLeft(payload));
	case 'playerLeft':
		return store.dispatch(decrementPlayerCount(payload));
	case 'playerJoined':
		return store.dispatch(incrementPlayerCount(payload));
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
	const playerName = getPlayerName(state);

	store.dispatch(clearPlayers({ gameId }));
	return store.dispatch(enterGame({ gameId, playerName }));
}

addWsCallbacks({ onWsEvent, onWsConnected });


export default store;
