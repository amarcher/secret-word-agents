import { wsEvent } from '../stores';

const HOST = window.location.origin.replace(/^http/, 'ws');

let ws;

export function send(data) {
	return ws.send(JSON.stringify(data));
}

function onConnect(gameId) {
	console.log('ws connected'); // eslint-disable-line no-console
	send({ gameId });
}

function onMessage({ data } = {}) {
	const parsedData = JSON.parse(data);
	console.log('ws event received', parsedData); // eslint-disable-line no-console
	wsEvent(parsedData);
}

function onClose() {
	ws.removeEventListener('open', onConnect);
	ws.removeEventListener('message', onMessage);
	ws.removeEventListener('close', onClose);
}


export function start(gameId) {
	ws = ws || new WebSocket(HOST);

	ws.addEventListener('open', onConnect.bind(undefined, gameId));
	ws.addEventListener('message', onMessage);
	ws.addEventListener('close', onClose);
}
