import { createStore, combineReducers, applyMiddleware } from 'redux';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import thunkMiddleware from 'redux-thunk';
import createHistory from 'history/createBrowserHistory';

import gameReducer from './game-store';

export const history = createHistory();
const middleware = routerMiddleware(history);

export const store = createStore(
	combineReducers({
		game: gameReducer,
		router: routerReducer,
	}),
	applyMiddleware(thunkMiddleware, middleware),
);

export default store;
