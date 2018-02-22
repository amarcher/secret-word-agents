const HOST = window.location.origin.replace(/^http/, 'ws');

let ws;

function onConnect() {
	console.log('ws connected'); // eslint-disable-line no-console
}

function onMessage({ data } = {}) {
	const parsedData = JSON.parse(data);
	console.log('ws event received', parsedData); // eslint-disable-line no-console
}

function onClose() {
	ws.removeEventListener('open', onConnect);
	ws.removeEventListener('message', onMessage);
	ws.removeEventListener('close', onClose);
}


export function start() {
	ws = new WebSocket(HOST);

	ws.addEventListener('open', onConnect);
	ws.addEventListener('message', onMessage);
	ws.addEventListener('close', onClose);
}

export function send(data) {
	return ws.send(data);
}
