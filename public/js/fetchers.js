import { send } from './utils/ws';
import { get } from './utils/ajax';

export function fetchGame({
	gameId,
	playerId,
	playerName,
	facebookId,
	facebookImage,
	teamId,
} = {}) {
	send({
		type: 'words',
		gameId,
		payload: {
			playerId, playerName, facebookId, facebookImage, teamId,
		},
	});
}

export function guess({ gameId, word, teamId } = {}) {
	send({
		gameId,
		type: 'guess',
		payload: { word, teamId },
	});
}

export function changeTeam({
	gameId,
	teamId,
	playerName,
	facebookId,
}) {
	send({
		gameId,
		type: 'changeTeam',
		payload: { teamId, playerName, facebookId },
	});
}

export function changePlayer({
	gameId,
	playerName,
	facebookId,
	facebookImage,
}) {
	send({
		gameId,
		type: 'changePlayer',
		payload: {
			gameId,
			playerName,
			facebookId,
			facebookImage,
		},
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
	gameId, teamId, word, number,
} = {}) {
	send({
		gameId,
		type: 'giveClue',
		payload: { teamId, word, number },
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

export function checkIfGameExists({ gameId } = {}) {
	return get('/exists', { gameId });
}
