/* eslint-disable no-console, no-use-before-define, no-param-reassign */

const Game = require('./game');
const iosNotificationService = require('./push-notifications');
const express = require('express');
const bodyParser = require('body-parser');
const WebSocketServer = require('ws').Server;
const http = require('http');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// GAME DATA

const games = {};
const sockets = {};
const facebookIds = {};


// START SERVER

const server = http.createServer(app);
const wss = new WebSocketServer({ server, clientTracking: true });
server.listen(port, () => {
	console.log(`Server with web socket capabilities listening on port ${port}`);
});


// Ping all active clients every thirty seconds
const noop = () => {};
setInterval(() => {
	wss.clients.forEach((ws) => {
		if (ws.isAlive === false) {
			ws.terminate();
			return;
		}

		ws.isAlive = false;
		ws.ping(noop);
	});
}, 30000);


// HANDLE INCOMING CONNECTIONS

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
		handleRequest(ws, parsedData); // eslint-disable-line no-use-before-define
	});

	ws.on('close', (reasonCode, description) => {
		console.log(`websocket connection closed with reasonCode: ${reasonCode} and description: ${description}`);
		console.log(`after disconnect we now have ${wss.clients.size} total clients`);
		if (ws.gameId && sockets[ws.gameId]) {
			handlePlayerLeft(ws);
		}
	});

	ws.on('error', (info) => {
		// NOTE: Unhandled errors cause the app to crash... So we need this!
		console.log('websocket error', info && info.message);
	});
});

function handleRequest(ws, data) {
	const { gameId, type, payload = {} } = data;
	if (!gameId) return;

	const isDifferentGameId = ws.gameId && ws.gameId !== gameId && sockets[ws.gameId];
	if (isDifferentGameId) {
		// player has joined a different game, so we boot them from their existing game
		handlePlayerLeft(ws);
	}

	if (!sockets[gameId] || !sockets[gameId].has(ws)) {
		// player has entered game they were not in before
		handlePlayerJoined(ws, gameId, payload.playerName, payload.token, payload.facebookId);
	}

	switch (type) {
	case 'words':
		handlePlayerChanged(ws, payload.player, payload.playerName, payload.token, payload.facebookId);
		sendWholeGameState(ws, gameId);
		break;
	case 'guess':
		makeGuess(gameId, payload.word, payload.player);
		break;
	case 'changePlayer':
		handlePlayerChanged(ws, payload.player, payload.playerName, payload.token, payload.facebookId);
		break;
	case 'giveClue':
		giveClue(gameId, payload.player, payload.word, payload.number);
		break;
	case 'endTurn':
		endTurn(gameId);
		break;
	case 'startNewGame':
		handleStartNewGame(gameId);
		break;
	default:
		break;
	}
}

function handleStartNewGame(gameId) {
	const game = getOrCreateGame(gameId);
	const playerOneName = game.getPlayerName('one');
	const playerTwoName = game.getPlayerName('two');
	const playerOneToken = playerOneName && game.getTokenForPlayer('one');
	const playerTwoToken = playerTwoName && game.getTokenForPlayer('two');
	const playerOneFacebookId = playerOneName && game.getFacebookIdForPlayer('one');
	const playerTwoFacebookId = playerTwoName && game.getFacebookIdForPlayer('two');

	games[gameId] = new Game();

	if (playerOneName) games[gameId].setPlayerName(playerOneName, 'one', playerOneToken, playerOneFacebookId);
	if (playerTwoToken) games[gameId].setPlayerName(playerTwoName, 'two', playerTwoToken, playerTwoFacebookId);

	sockets[gameId].forEach((client) => {
		sendWholeGameState(client, gameId);
	});
}

function handlePlayerLeft(ws) {
	sockets[ws.gameId].delete(ws);

	broadcast(ws.gameId, {
		type: 'playerLeft',
		payload: {
			count: sockets[ws.gameId].size,
			playerName: ws.playerName,
		},
	});

	// Make the player's slot available again, unless we have a token or a facebook id!
	if (!getOrCreateGame(ws.gameId).getTokenForPlayer(ws.player) && !getOrCreateGame(ws.gameId).getFacebookIdForPlayer(ws.player)) {
		getOrCreateGame(ws.gameId).setPlayerName('', ws.player);
	}

	ws.gameId = undefined;
	ws.player = undefined;
	ws.playerName = undefined;
}

function handlePlayerJoined(ws, gameId, playerName, token, facebookId) {
	if (sockets[gameId]) {
		// Tell the client who else is connected
		sockets[gameId].forEach((client) => {
			if (client.readyState === 1) {
				send(ws, {
					type: 'playerJoined',
					payload: {
						count: sockets[gameId].size,
						playerName: client.playerName,
						player: client.player,
					},
				});
			}
		});

		sockets[gameId].add(ws);
	} else {
		sockets[gameId] = new Set([ws]);
	}

	ws.gameId = gameId;
	ws.playerName = playerName;

	if (facebookIds[facebookId]) {
		facebookIds[facebookId].add(gameId);
	} else if (facebookId) {
		facebookIds[facebookId] = new Set([gameId]);
	}


	const player = getOrCreateGame(gameId).setPlayerName(playerName, undefined, token, facebookId);

	broadcast(gameId, {
		type: 'playerJoined',
		payload: {
			count: sockets[gameId].size,
			playerName,
			player,
		},
	});

	if (ws.player !== player) {
		ws.player = player;

		send(ws, {
			type: 'playerChanged',
			payload: {
				player,
			},
		});
	}
}

function handlePlayerChanged(ws, player, playerName, token, facebookId) {
	const game = getOrCreateGame(ws.gameId);

	if (ws.playerName === playerName && player === ws.player && facebookId === game.getFacebookIdForPlayer(player)) return;

	if (typeof playerName !== 'undefined') {
		broadcast(ws.gameId, {
			type: 'playerLeft',
			payload: {
				count: sockets[ws.gameId].size,
				playerName: ws.playerName,
			},
		});

		player = game.setPlayerName(playerName, ws.player, token, facebookId);

		if (facebookIds[facebookId]) {
			facebookIds[facebookId].add(ws.gameId);
		} else if (facebookId) {
			facebookIds[facebookId] = new Set([ws.gameId]);
		}

		ws.playerName = playerName;

		broadcast(ws.gameId, {
			type: 'playerJoined',
			payload: {
				count: sockets[ws.gameId].size,
				playerName: ws.playerName,
			},
		});
	}

	ws.player = player;

	send(ws, {
		type: 'playerChanged',
		payload: {
			player,
		},
	});

	send(ws, {
		type: 'words',
		payload: {
			gameId: ws.gameId,
			words: getWordsForPlayer(ws.gameId, ws.player),
		},
	});
}

function send(client, data) {
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

function iOSNotify(gameId, playerId, data) {
	const dataToSend = Object.assign({}, data, {
		topic: 'org.reactjs.native.example.Dooler',
		badge: 1,
		sound: 'default',
		custom: { gameId },
	});

	const game = getOrCreateGame(gameId);
	const registrationIds = playerId ?
		game.getTokenForPlayer(playerId) :
		[game.getTokenForPlayer('one'), game.getTokenForPlayer('two')].filter(token => !!token);

	iosNotificationService.send(registrationIds, dataToSend);
}

function getOrCreateGame(gameId) {
	if (games[gameId]) {
		return games[gameId];
	}

	games[gameId] = new Game();

	return games[gameId];
}

function giveClue(gameId, player, word, number) {
	const game = getOrCreateGame(gameId);
	const turnsLeftBefore = game.getTurnsLeft();
	const clue = game.giveClueForTurn(player, word, number);
	const turnsLeftAfter = game.getTurnsLeft();

	if (turnsLeftBefore !== turnsLeftAfter) {
		broadcast(gameId, {
			type: 'turns',
			payload: {
				turnsLeft: turnsLeftAfter,
			},
		});
	}

	const otherPlayer = player === 'one' ? 'two' : 'one';
	iOSNotify(gameId, otherPlayer, {
		title: 'A clue has been given in your game',
		body: `${game.getPlayerName(player)} gave the clue "${word}" - ${number}`,
	});

	broadcast(gameId, {
		type: 'clueGiven',
		payload: {
			playerGivingClue: clue.playerGivingClue,
			number: clue.guessesLeft,
			word: clue.clueWord,
		},
	});
}

function endTurn(gameId) {
	const game = getOrCreateGame(gameId);
	const turnsLeftBefore = game.getTurnsLeft();
	game.endTurn();
	const turnsLeftAfter = game.getTurnsLeft();

	if (turnsLeftBefore !== turnsLeftAfter) {
		broadcast(gameId, {
			type: 'turns',
			payload: {
				turnsLeft: turnsLeftAfter,
			},
		});
	}
}

function getWordsForPlayer(gameId, player) {
	const game = getOrCreateGame(gameId);
	return player ? game.getViewForPlayer(player) : game.getWords();
}

function getGameForFacebookId(gameId, facebookId) {
	const game = getOrCreateGame(gameId);
	const player = game.getPlayerWithFacebookId(facebookId);
	const words = player ? game.getViewForPlayer(player) : game.getWords();

	return {
		words,
		player,
		turnsLeft: game.getTurnsLeft(),
	};
}

function makeGuess(gameId, word, player) {
	const game = getOrCreateGame(gameId);

	const clueWord = game.currentTurn && game.currentTurn.clueWord;
	const turnsLeftBefore = game.getTurnsLeft();
	const guess = game.guess(word, player);
	const turnsLeftAfter = game.getTurnsLeft();

	if (guess && guess.playerGuessingChanged) {
		broadcast(gameId, {
			type: 'turns',
			payload: {
				turnsLeft: turnsLeftBefore - 1,
			},
		});
	}

	broadcast(gameId, {
		type: 'guess',
		payload: Object.assign({}, guess, { gameId }),
	});

	const otherPlayer = player === 'one' ? 'two' : 'one';
	const clueText = clueWord ? ` for the clue "${clueWord}"` : '';
	iOSNotify(gameId, otherPlayer, {
		title: 'A guess has been made in your game',
		body: `${game.getPlayerName(player)} guessed "${word}"${clueText}`,
	});

	if ((guess && !guess.playerGuessingChanged && turnsLeftBefore !== turnsLeftAfter) ||
		turnsLeftBefore - 1 > turnsLeftAfter) {
		broadcast(gameId, {
			type: 'turns',
			payload: {
				turnsLeft: turnsLeftAfter,
			},
		});
	}
}

function maybeSendCurrentClue(ws, gameId) {
	const game = getOrCreateGame(gameId);
	const clue = game.getCurrentClue();

	if (!clue) return;

	send(ws, {
		type: 'clueGiven',
		payload: {
			playerGivingClue: clue.playerGivingClue,
			number: clue.guessesLeft,
			word: clue.clueWord,
		},
	});
}

function sendWholeGameState(ws, gameId) {
	send(ws, {
		type: 'words',
		payload: {
			gameId,
			words: getWordsForPlayer(gameId, ws.player),
		},
	});
	send(ws, {
		type: 'turns',
		payload: {
			turnsLeft: getOrCreateGame(gameId).getTurnsLeft(),
		},
	});
	maybeSendCurrentClue(ws, gameId);
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

app.get('/games', (req, res) => {
	const { facebookId } = req.query;

	let gameIds = [];
	if (facebookIds[facebookId]) {
		gameIds = Array.from(facebookIds[facebookId]);
	}

	console.log(`found ${gameIds.length} games for facebookId ${facebookId}`);

	const gameInfo = gameIds.reduce((allGames, gameId) => {
		allGames[gameId] = getGameForFacebookId(gameId, facebookId);
		return allGames;
	}, {});

	res.send(gameInfo);
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
