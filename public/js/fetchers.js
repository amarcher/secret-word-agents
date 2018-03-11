import { send } from './utils/ws';

export function fetchGame({ gameId, playerName } = {}) {
	send({
		type: 'words',
		gameId,
		payload: { playerName },
	});
}

export function guess({ gameId, word, player } = {}) {
	send({
		gameId,
		type: 'guess',
		payload: { word, player },
	});
}

export function changePlayer({ gameId, player, playerName }) {
	send({
		gameId,
		type: 'changePlayer',
		payload: { player, playerName },
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
