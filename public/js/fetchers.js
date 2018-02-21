import { post } from './utils/ajax';

export function fetchGame({ gameId } = {}) {
	return post('/words', { gameId });
}
