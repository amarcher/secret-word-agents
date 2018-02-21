import { get } from './utils/ajax';

export function fetchGame({ key } = {}) {
	return get(`/words?gameId=${key}`);
}
