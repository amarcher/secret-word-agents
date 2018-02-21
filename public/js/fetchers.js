import { post } from './utils/ajax';

export function fetchGame({ gameId } = {}) {
	return post('/words', { gameId });
}

export function guess({ gameId, word } = {}) {
	return post('/guess', { gameId, word });
}
