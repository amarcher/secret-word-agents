import { post } from './utils/ajax';
import { start } from './utils/ws';

export function fetchGame({ gameId } = {}) {
	start(gameId);

	return post('/words', { gameId });
}

export function guess({ gameId, word } = {}) {
	return post('/guess', { gameId, word });
}
