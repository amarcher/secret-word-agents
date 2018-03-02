import { wsEvent, store } from '../stores';
import { getGameId } from '../stores/game-store';

let connectingPromise;
let ws;

const HOST = window.location.origin.replace(/^http/, 'ws');
const RECONNECT_INTERVAL = 5000;
const READY_STATES = {
	CONNECTING: 0,
	OPEN: 1,
	CLOSING: 3,
	CLOSED: 3,
};

export function send(data) {
	if (ws && ws.readyState === READY_STATES.OPEN) {
		ws.send(JSON.stringify(data));
	} else {
		// eslint-disable-next-line no-use-before-define
		start().then(() => send(data));
	}
}

function onConnect(gameId) {
	console.log('ws connected'); // eslint-disable-line no-console
	send({ type: 'words', gameId });
}

function onMessage({ data } = {}) {
	const parsedData = JSON.parse(data);
	console.log('ws event received', parsedData); // eslint-disable-line no-console
	wsEvent(parsedData);
}

function onClose() {
	console.log('closing connection'); // eslint-disable-line no-console

	ws.removeEventListener('message', onMessage);
	ws.removeEventListener('close', onClose);

	ws = undefined;

	// eslint-disable-next-line no-use-before-define
	start();
}

export function start(gameId = getGameId(store.getState())) {
	connectingPromise = connectingPromise || new Promise((resolve, reject) => {
		ws = new WebSocket(HOST);

		ws.addEventListener('open', resolve);
		ws.addEventListener('error', reject);
	}).then(() => {
		// Web socket has connected
		ws.addEventListener('message', onMessage);
		ws.addEventListener('close', onClose);

		connectingPromise = undefined;

		onConnect(gameId);
	}).catch(() => {
		// Web socket failed to connect
		console.log('reconnecting'); // eslint-disable-line no-console
		ws = undefined;

		return new Promise(resolve => setTimeout(resolve, RECONNECT_INTERVAL)).then(() => {
			connectingPromise = undefined;
			return start(gameId);
		});
	});

	return connectingPromise;
}
