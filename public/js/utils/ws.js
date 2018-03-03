import { wsEvent, wsConnected } from '../stores';

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
		start();
	}
}

function onConnect() {
	console.log('ws connected'); // eslint-disable-line no-console
	wsConnected();
}

function onMessage({ data } = {}) {
	const parsedData = JSON.parse(data);
	console.log('ws event received', parsedData); // eslint-disable-line no-console
	wsEvent(parsedData);
}

function onError(err) {
	console.log('error', err); // eslint-disable-line no-console

	if (ws && ws.readyState === READY_STATES.OPEN) {
		ws.close();
	}
}

function onClose() {
	console.log('closing connection'); // eslint-disable-line no-console

	ws.removeEventListener('message', onMessage);
	ws.removeEventListener('close', onClose);
	ws.removeEventListener('error', onError);

	ws = undefined;

	// eslint-disable-next-line no-use-before-define
	start();
}

export function start() {
	let error;
	let open;

	connectingPromise = connectingPromise || new Promise((resolve, reject) => {
		ws = new WebSocket(HOST);
		open = resolve;
		error = reject;

		ws.addEventListener('open', open);
		ws.addEventListener('error', error);
	}).then(() => {
		// Web socket has connected
		ws.removeEventListener('open', open);
		ws.removeEventListener('error', error);

		ws.addEventListener('message', onMessage);
		ws.addEventListener('close', onClose);
		ws.addEventListener('error', onError);

		connectingPromise = undefined;

		onConnect();
	}).catch(() => {
		// Web socket failed to connect
		console.log('reconnecting'); // eslint-disable-line no-console
		ws = undefined;

		return new Promise(resolve => setTimeout(resolve, RECONNECT_INTERVAL)).then(() => {
			connectingPromise = undefined;
			return start();
		});
	});

	return connectingPromise;
}
