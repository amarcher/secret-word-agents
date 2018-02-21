import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Route } from 'react-router';
import { ConnectedRouter } from 'react-router-redux';

import EnterGame from './components/enter-game';
import NoResults from './components/no-results';

import { store, history } from './stores';


function registerApp() {
	render(
		(
			<Provider store={store}>
				<ConnectedRouter history={history}>
					<div>
						<Route path="/" component={EnterGame} />
						<Route path="*" component={NoResults} />
					</div>
				</ConnectedRouter>
			</Provider>
		), window.document.getElementsByClassName('app')[0],
	);
}

document.addEventListener('DOMContentLoaded', () => {
	registerApp();
});
