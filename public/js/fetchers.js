import { start, send } from './utils/ws';

export function fetchGame({ gameId } = {}) {
	start(gameId);
}

export function guess({ gameId, word, player } = {}) {
	send({
		gameId,
		type: 'guess',
		payload: { word, player },
	});
}

export function changePlayer({ gameId, player }) {
	send({
		gameId,
		type: 'changePlayer',
		payload: { player },
	});
}
