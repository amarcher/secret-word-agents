/* eslint-disable no-console, no-use-before-define, no-param-reassign */

const iosNotificationService = require('./push-notifications');
const express = require('express');
const bodyParser = require('body-parser');
const WebSocketServer = require('ws').Server;
const http = require('http');
const Game = require('./game');
const RedisClient = require('./redis');

const app = express();
const port = process.env.PORT || 3000;
const db = new RedisClient();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * ACTIVE CONNECTIONS
 *
 * In addition to its own properties, each web socket connection (or "ws" for short)
 * may have the following additional proprerties stored on it for convenience:
 *
 * ws.gameId		-- the gameId the socket is subscribed to
 * ws.playerId		-- the playerId from our Redis store of the connected player
 * ws.teamId		-- the teamId (either: 1 or 2 if defined)
 * ws.facebookId	-- the facebookId for the player
 * ws.playerName	-- the name of the player
*/

const sockets = {};


// START SERVER

const server = http.createServer(app);
const wss = new WebSocketServer({ server, clientTracking: true });
server.listen(port, () => {
	console.log(`Server with web socket capabilities listening on port ${port}`);
});


/**
 * PING ALL ACTIVE CONNECTIONS EVERY 30 SECONDS
 *
 * Many browsers self-close web sockets, but pinging them every thirty seconds keeps them open.
 * If the client disappears without closing our connection, we'll be able to close it if we don't get a pong back.
 */


const noop = () => {};
const THIRTY_SECONDS = 30 * 1000;
setInterval(() => {
	wss.clients.forEach((ws) => {
		if (ws.isAlive === false) {
			ws.terminate();
			return;
		}

		ws.isAlive = false;
		ws.ping(noop);
	});
}, THIRTY_SECONDS);


/**
 * HANDLE INCOMING CONNECTIONS
 *
 * Set up listeners for events (pong, message, close, and error) so that we can respond to requests over the socket.
 */

wss.on('connection', (ws) => {
	ws.isAlive = true;
	console.log('new websocket connection open');
	console.log(`after connection we now have ${wss.clients.size} total clients`);

	ws.on('pong', () => {
		ws.isAlive = true;
	});

	ws.on('message', (data) => {
		const parsedData = JSON.parse(data);
		console.log(`websocket message: ${data}`);
		handleInitialRequest(ws, parsedData)
			.then(() => handleRequest(ws, parsedData)); // eslint-disable-line no-use-before-define
	});

	ws.on('close', (reasonCode, description) => {
		console.log(`websocket connection closed with reasonCode: ${reasonCode} and description: ${description}`);
		console.log(`after disconnect we now have ${wss.clients.size} total clients`);
		if (ws.gameId && sockets[ws.gameId]) {
			sockets[ws.gameId].delete(ws);

			handlePlayerLeft(ws);

			ws.gameId = undefined;
			ws.playerName = undefined;
			ws.token = undefined;
			ws.playerId = undefined;
			ws.teamId = undefined;
		}
	});

	ws.on('error', (info) => {
		// NOTE: Unhandled errors cause the whole app to crash... So we need this!
		console.log('websocket error', info && info.message);
	});
});


/**
 * HANDLE WEB SOCKET REQUESTS
 */

/**
 * Handle possible initial request (the first one after connection)
 * @param  {Object} ws - the web socket object itself
 * @param  {Object} data - the data that came in with the request
 * @param  {String} data.gameId - gameId this request is about
 * @param  {String} data.type - type of request, valid types are enumerated in the switch statement
 * @param  {Object} data.payload - payload of info pertaining to the request
 * @return {Promise} a promise that resolves when the game has been created (if necessary)
 */
async function handleInitialRequest(ws, data) {
	const { gameId, payload, type } = data;
	if (!gameId) return Promise.resolve();

	// If we don't have attributes assigned to this web socket connection, assign them now.
	if (!ws.gameId) ws.gameId = gameId;

	return new Promise((resolve) => {
		if (!sockets[gameId]) {
			sockets[gameId] = new Set([ws]);
			// Because we have no socket for this gameId, it's possible that we've never
			// created a game for the gameId either. Create one if we need to before continuing.
			getOrCreateGame(gameId).then(resolve);
		} else if (!sockets[gameId].has(ws)) {
			// We have other connected users, so replay those other players "joining"
			sockets[gameId].forEach((client) => {
				if (client.readyState === 1) {
					send(ws, {
						type: 'playerJoined',
						payload: {
							count: sockets[gameId].size,
							playerName: client.playerName,
							teamId: client.teamId === 1 ? 'one' : 'two',
						},
					});
				}
			});
			// Then add this connection
			sockets[gameId].add(ws);
			resolve();
		} else {
			resolve();
		}
	}).then(() => {
		const {
			token,
			playerName,
			facebookId,
			facebookImage,
		} = payload;

		if (token && !ws.token) ws.token = token;

		const isImplicitPlayerChange = type !== 'playerChange' && (ws.playerName !== playerName || ws.facebookId !== facebookId);
		if (isImplicitPlayerChange) return handlePlayerChanged(ws, playerName, facebookId, facebookImage);

		return Promise.resolve();
	});
}

/**
 * Handle requests beyond the initial request
 * @param  {Object} ws - the web socket object itself
 * @param  {Object} data - the data that came in with the request
 * @param  {String} data.gameId - gameId this request is about
 * @param  {String} data.type - type of request, valid types are enumerated in the switch statement
 * @param  {Object} data.payload - payload of info pertaining to the request
 * @return {void}
 */
async function handleRequest(ws, data) {
	const { gameId, type, payload = {} } = data;
	if (!gameId) return;

	const {
		teamId,
		playerName,
		facebookId,
		facebookImage,
		word,
		number,
	} = payload;

	switch (type) {
	case 'words':
		sendWholeGameState(ws);
		break;
	case 'changePlayer':
		handlePlayerChanged(ws, playerName, facebookId, facebookImage);
		break;
	case 'changeTeam':
		handleTeamChanged(ws, teamId === 'one' ? 1 : 2);
		break;
	case 'guess':
		makeGuess(ws, word);
		break;
	case 'giveClue':
		giveClue(ws, word, number);
		break;
	case 'endTurn':
		endTurn(gameId);
		break;
	case 'startNewGame':
		handleStartNewGame(ws);
		break;
	default:
		break;
	}
}

async function handleStartNewGame(ws) {
	const game = new Game();
	return db.setGame(ws.gameId, game).then(async () => {
		if (sockets[ws.gameId]) {
			sockets[ws.gameId].forEach((client) => {
				sendWholeGameState(client);
			});
		}

		const otherTeamId = ws.teamId === 1 ? 2 : 1;
		const tokens = await db.getTokensOnTeam(ws.gameId, otherTeamId);

		iOSNotify(ws.gameId, tokens, {
			title: 'A new game has started',
			body: `${ws.playerName} started a new game with you at "${ws.gameId}"`,
		});
	});
}

async function handlePlayerLeft(ws) {
	if (sockets[ws.gameId].size) {
		broadcast(ws.gameId, {
			type: 'playerLeft',
			payload: {
				count: sockets[ws.gameId].size,
				playerName: ws.playerName,
				playerId: ws.playerId,
			},
		});
	}

	const promise = Promise.resolve();

	if (ws.teamId && !ws.facebookId && !ws.token) {
		promise.then(() => db.removePlayerFromTeam(ws.gameId, ws.playerId, ws.teamId));
	}

	return promise;
}

async function handlePlayerChanged(ws, playerName, facebookId, facebookUrl) {
	const previousPlayerId = ws.playerId;
	const playerId = await db.setPlayer(playerName, facebookId, facebookUrl);

	if (playerId === previousPlayerId) return Promise.resolve();

	const promise = Promise.resolve();

	if (previousPlayerId) {
		// Let all clients know that player left
		promise.then(() => handlePlayerLeft(ws));
	}

	return promise.then(async () => {
		// Change the player details for this web socket
		ws.playerId = playerId;
		ws.playerName = playerName;
		ws.facebookId = facebookId;
		ws.facebookUrl = facebookUrl;

		// Attempt to get the team for this player
		const teamIdForPlayerId = await db.getTeamIdForPlayerId(ws.gameId, playerId);

		// If they are not on a team already or the team does not match that for this web socket
		// handle the change in teamId.
		if (!teamIdForPlayerId || ws.teamId !== teamIdForPlayerId) {
			return handleTeamChanged(ws, teamIdForPlayerId);
		}

		// Otherwise, just broadcast the new player joining
		broadcast(ws.gameId, {
			type: 'playerJoined',
			payload: {
				count: sockets[ws.gameId].size,
				playerName: ws.playerName,
				teamId: teamIdForPlayerId === 1 ? 'one' : 'two',
			},
		});

		return Promise.resolve();
	});
}

async function handleTeamChanged(ws, teamId) {
	const teamIdForPlayerId = await db.getTeamIdForPlayerId(ws.gameId, ws.playerId);
	// The desiredTeamId will be...
	// 1) The teamId argument (if set) OR
	// 2) The existing team for this player (if set) OR
	// 3) An arbitrary team that will be assigned by calling db.addPlayerToTeam without a teamID
	const desiredTeamId = teamId || teamIdForPlayerId;

	const promise = Promise.resolve();

	if (ws.teamId && ws.teamId !== desiredTeamId) {
		promise.then(() => db.removePlayerFromTeam(ws.gameId, ws.playerId, ws.teamId, ws.token));
	}

	return promise.then(async () => {
		const nextTeamId = await db.addPlayerToTeam(ws.gameId, ws.playerId, ws.token, desiredTeamId);

		if (nextTeamId !== ws.teamId) {
			ws.teamId = nextTeamId;

			broadcast(ws.gameId, {
				type: 'playerJoined',
				payload: {
					count: sockets[ws.gameId].size,
					playerName: ws.playerName,
					teamId: ws.teamId === 1 ? 'one' : 'two',
				},
			});

			send(ws, {
				type: 'teamChanged',
				payload: {
					teamId: ws.teamId === 1 ? 'one' : 'two',
				},
			});

			send(ws, {
				type: 'words',
				payload: {
					gameId: ws.gameId,
					words: await db.getWords(ws.gameId, ws.teamId),
				},
			});
		}
	});
}

// NOTIFICATIONS (SENT SYNCRONOUSLY OVER WEB SOCKET & IOS PUSH NOTIFICATIONS SERVICE)

function send(client, data) {
	console.log('sending', data.type);
	if (client.readyState === 1) {
		client.send(JSON.stringify(Object.assign({ gameId: client.gameId }, data)));
	}
}

function broadcast(gameId, data) {
	if (sockets[gameId]) {
		sockets[gameId].forEach((client) => {
			if (client.readyState === 1) {
				client.send(JSON.stringify(Object.assign({ gameId }, data)));
			}
		});
	}
}

function iOSNotify(gameId, tokens, data) {
	if (!tokens || !tokens.length) return;

	const dataToSend = Object.assign({}, data, {
		topic: 'org.reactjs.native.example.Dooler',
		badge: 1,
		sound: 'default',
		custom: { gameId },
	});

	iosNotificationService.send(tokens, dataToSend);
}


// UTILITY FUNCTIONS

async function getOrCreateGame(gameId) {
	const gameData = await db.getGame(gameId);
	const game = new Game(gameData);

	if (!gameData) {
		return db.setGame(gameId, game).then(() => game);
	}

	return game;
}


// ACTION HANDLERS

async function giveClue(ws, clueWord, clueNumber) {
	const turnsLeftBefore = await db.getTurnsLeft(ws.gameId);
	const turnsLeftAfter = await db.setTurn(ws.gameId, ws.teamId, clueWord, clueNumber, clueNumber)
		.then(() => db.getTurnsLeft(ws.gameId));

	if (turnsLeftBefore !== turnsLeftAfter) {
		broadcast(ws.gameId, {
			type: 'turns',
			payload: {
				turnsLeft: turnsLeftAfter,
			},
		});
	}

	const otherTeamId = ws.teamId === 'one' ? 2 : 1;
	const tokens = await db.getTokensOnTeam(ws.gameId, otherTeamId);

	iOSNotify(ws.gameId, tokens, {
		title: 'A clue has been given in your game',
		body: `${ws.playerName} gave the clue "${clueWord}" - ${clueNumber}`,
	});

	broadcast(ws.gameId, {
		type: 'clueGiven',
		payload: {
			playerGivingClue: otherTeamId === 1 ? 'playerOne' : 'playerTwo',
			number: clueNumber,
			word: clueWord,
		},
	});
}

async function endTurn(gameId) {
	const turnsLeft = await db.getTurnsLeft(gameId);
	return db.setTurnsLeft(gameId, turnsLeft - 1)
		.then(() => db.setTurn(gameId))
		.then(() => broadcast(gameId, {
			type: 'turns',
			payload: {
				turnsLeft: turnsLeft - 1,
			},
		}));
}

async function getGameForPlayerId(gameId, playerId) {
	const teamId = await db.getTeamIdForPlayerId(gameId, playerId);
	const words = await db.getWords(gameId, teamId);
	let team;
	if (teamId) {
		team = teamId === 1 ? 'playerOne' : 'playerTwo';
	}

	return {
		words,
		teamId: team,
		turnsLeft: await db.getTurnsLeft(gameId),
	};
}

async function makeGuess(ws, word) {
	const { clueWord } = await db.getTurn(ws.gameId);
	const turnsLeft = await db.getTurnsLeft(ws.gameId);
	const guess = await db.makeGuess(ws.gameId, ws.teamId, word);

	if (!guess) return;

	broadcast(ws.gameId, {
		type: 'guess',
		payload: Object.assign({}, guess, { gameId: ws.gameId }),
	});

	const clueText = clueWord ? ` for the clue "${clueWord}"` : '';
	const otherTeamId = ws.teamId === 1 ? 2 : 1;
	const tokens = await db.getTokensOnTeam(ws.gameId, otherTeamId);
	const { playerName } = await db.getPlayer(ws.playerId);

	iOSNotify(ws.gameId, tokens, {
		title: 'A guess has been made in your game',
		body: `${playerName} guessed "${word}"${clueText}`,
	});

	if (turnsLeft !== guess.turnsLeft) {
		broadcast(ws.gameId, {
			type: 'turns',
			payload: {
				turnsLeft: guess.turnsLeft,
			},
		});
	}
}

async function maybeSendCurrentClue(ws) {
	const { clueGiverTeamId, clueWord, guessesLeft } = await db.getTurn(ws.gameId) || {};

	if (!clueWord) return;

	const playerGivingClue = clueGiverTeamId === 1 ? 'playerOne' : 'playerTwo';

	send(ws, {
		type: 'clueGiven',
		payload: {
			playerGivingClue,
			number: guessesLeft,
			word: clueWord,
		},
	});
}

async function sendWholeGameState(ws) {
	send(ws, {
		type: 'words',
		payload: {
			gameId: ws.gameId,
			words: await db.getWords(ws.gameId, ws.teamId),
		},
	});
	send(ws, {
		type: 'turns',
		payload: {
			turnsLeft: await db.getTurnsLeft(ws.gameId),
		},
	});
	maybeSendCurrentClue(ws);
}

// ROUTES

app.use((req, res, next) => {
	const protocol = req.get('X-Forwarded-Proto');
	const host = req.get('Host');
	if (protocol !== 'https' && host && host.indexOf('localhost') === -1) {
		res.redirect(`https://${req.get('Host')}${req.url}`);
	} else {
		next();
	}
});

app.get('*.(gif|png|jpe?g|svg|ico|app|ipa|plist)', express.static('public/img'));

app.get('/games', async (req, res) => {
	const { facebookId } = req.query;

	if (!facebookId) {
		return Promise.resolve(res.send([]));
	}

	const playerId = await db.getPlayerIdForFacebookId(facebookId);

	if (!playerId) {
		console.log(`Found no playerId for facebookId ${facebookId}`);
		return Promise.resolve(res.send([]));
	}

	const gameIds = await db.getGamesForPlayer(playerId);

	console.log(`Found ${gameIds.length} games for facebookId ${facebookId}`);

	const gameInfo = await gameIds.reduce(async (allGames, gameId) => {
		allGames[gameId] = await getGameForPlayerId(gameId, playerId);
		return allGames;
	}, {});

	return Promise.resolve(res.send(gameInfo));
});

app.get('/.well-known/acme-challenge/xLHu4WPs9klKrGFJiPRKhEr68Fp1nGwwT57sMu5kSvU', (req, res) => {
	res.send('xLHu4WPs9klKrGFJiPRKhEr68Fp1nGwwT57sMu5kSvU.wcyPaoYEfPqL-uVIHthYuQAf46zGDhI2Dt6L-aP4veQ');
});

app.get('/.well-known/acme-challenge/*', (req, res) => {
	res.send('7BzyK3d9TEVxUwq-TuKShYGQpV90f6nHF1duQ2_30tE.wcyPaoYEfPqL-uVIHthYuQAf46zGDhI2Dt6L-aP4veQ');
});

app.all('*', (req, res) => {
	res.render('layout');
});
