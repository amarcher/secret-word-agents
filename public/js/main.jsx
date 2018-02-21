import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Route, Switch } from 'react-router';
import { ConnectedRouter } from 'react-router-redux';

import EnterGame from './components/enter-game';
import GameView from './components/game-view';
import NoResults from './components/no-results';

import { store, history } from './stores';


function registerApp() {
	render(
		(
			<Provider store={store}>
				<ConnectedRouter history={history}>
					<Switch>
						<Route path="/" exact component={EnterGame} />
						<Route path="/:gameId" component={GameView} />
						<Route component={NoResults} />
					</Switch>
				</ConnectedRouter>
			</Provider>
		), window.document.getElementsByClassName('app')[0],
	);
}

document.addEventListener('DOMContentLoaded', () => {
	registerApp();
});
