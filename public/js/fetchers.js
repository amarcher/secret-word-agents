import { send } from './utils/ws';
import { get } from './utils/ajax';

export function fetchGame({ gameId, playerName, facebookId } = {}) {
	send({
		type: 'words',
		gameId,
		payload: { playerName, facebookId },
	});
}

export function guess({ gameId, word, player } = {}) {
	send({
		gameId,
		type: 'guess',
		payload: { word, player },
	});
}

export function changePlayer({
	gameId,
	player,
	playerName,
	facebookId,
}) {
	send({
		gameId,
		type: 'changePlayer',
		payload: { player, playerName, facebookId },
	});
}

export function endTurn({ gameId } = {}) {
	send({
		gameId,
		type: 'endTurn',
		payload: {},
	});
}

export function giveClue({
	gameId, player, word, number,
} = {}) {
	send({
		gameId,
		type: 'giveClue',
		payload: { player, word, number },
	});
}

export function startNewGame({
	gameId,
} = {}) {
	send({
		gameId,
		type: 'startNewGame',
		payload: {},
	});
}


/* HTTPS Fetchers */

export function fetchGames({ facebookId } = {}) {
	return get('/games', { facebookId });
}
