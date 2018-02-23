import { start, send } from './utils/ws';

export function fetchGame({ gameId } = {}) {
	start(gameId);
}

export function guess({ gameId, word } = {}) {
	send({
		gameId,
		type: 'guess',
		payload: { word },
	});
}
