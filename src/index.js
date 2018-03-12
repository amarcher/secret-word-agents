const Game = require('./game');
const iosNotificationService = require('./pushNotifications');
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

// START SERVER

const server = http.createServer(app);
const wss = new WebSocketServer({ server: server, clientTracking: true });
server.listen(port, function() {
	console.log('Server with web socket capabilities listening on port ' + port);
});


// Ping all active clients every thirty seconds
const noop = function() {};
const interval = setInterval(function ping() {
	wss.clients.forEach(function each(ws) {
		if (ws.isAlive === false) return ws.terminate();

		ws.isAlive = false;
		ws.ping(noop);
	});
}, 30000);


// HANDLE INCOMING CONNECTIONS

wss.on('connection', function(ws) {
	ws.isAlive = true;
 	console.log('new websocket connection open');

 	// TODO: Remove this counting
 	console.log('we now have ' + wss.clients.size + ' total clients');

	ws.on('pong', function() {
		ws.isAlive = true;
	});

 	ws.on('message', function(data) {
 		const parsedData = JSON.parse(data);
	 	console.log('websocket message', parsedData);
	 	handleRequest(ws, parsedData);
 	});

 	ws.on('close', function(info) {
		console.log('websocket connection close')
 		if (ws._gameId && sockets[ws._gameId]) {
 			handlePlayerLeft(ws);
 		}
 	});

 	ws.on('error', function(info) {
 		// NOTE: Unhandled errors cause the app to crash... So we need this!
		console.log('websocket error', info.message);
	});
});

function handleRequest(ws, data) {
	const gameId = data.gameId;
	const type = data.type;
	const payload = data.payload || {};

	if (!gameId) return;

	if (ws._gameId && ws._gameId !== gameId && sockets[ws._gameId]) {
		// player has joined a different game, so we boot them from their existing game
		handlePlayerLeft(ws);
	}

	if (!sockets[gameId] || !sockets[gameId].has(ws)) {
		// player has entered game they were not in before
		handlePlayerJoined(ws, gameId, payload.playerName, payload.token);
	}

	switch(type) {
	case 'words':
		sendWholeGameState(ws, gameId);
		break;
	case 'guess':
		makeGuess(gameId, payload.word, payload.player);
		break;
	case 'changePlayer':
		handlePlayerChanged(ws, payload.player, payload.playerName, payload.token);
		break;
	case 'giveClue':
		giveClue(gameId, payload.player, payload.word, payload.number);
		break;
	case 'endTurn':
		endTurn(gameId);
		break;
	case 'startNewGame':
		const game = getOrCreateGame(gameId);

		if (game && game.getTurnsLeft() < 1) {
			games[gameId] = new Game();

			sockets[gameId].forEach(function(ws) {
				game.setPlayerName(ws._playerName, ws._player);
				sendWholeGameState(ws, gameId);
			});
		}

		break;
	default:
		break;
	}
}

function handlePlayerLeft(ws) {
	sockets[ws._gameId].delete(ws);

	broadcast(ws._gameId, {
		type: 'playerLeft',
		payload: {
			count: sockets[ws._gameId].size,
			playerName: ws._playerName,
		},
	});

	// Make the player's slot available again, unless we have a token!
	if (!getOrCreateGame(ws._gameId).getTokenForPlayer(ws._player)) {
		getOrCreateGame(ws._gameId).setPlayerName('', ws._player);
	}

	ws._gameId = undefined;
	ws._player = undefined;
	ws._playerName = undefined;
}

function handlePlayerJoined(ws, gameId, playerName, token) {
	if (sockets[gameId]) {
		// Tell the client who else is connected
		sockets[gameId].forEach(function(client) {
			if (client.readyState === 1) {
				send(ws, {
					type: 'playerJoined',
					payload: {
						count: sockets[gameId].size,
						playerName: client._playerName,
						player: client._player,
					},
				});
			}
		});

		sockets[gameId].add(ws);
	} else {
		sockets[gameId] = new Set([ws]);
	}

	ws._gameId = gameId;
	ws._playerName = playerName;

	const player = getOrCreateGame(gameId).setPlayerName(playerName, undefined, token);

	broadcast(gameId, {
		type: 'playerJoined',
		payload: {
			count: sockets[gameId].size,
			playerName,
			player,
		},
	});

	if (ws._player !== player) {
		ws._player = player;

		send(ws, {
			type: 'playerChanged',
			payload: {
				player,
			},
		});
	}
}

function handlePlayerChanged(ws, player, playerName, token) {
	if (ws._playerName === playerName && player === ws._player) return;

	if (typeof playerName !== 'undefined') {
		broadcast(ws._gameId, {
			type: 'playerLeft',
			payload: {
				count: sockets[ws._gameId].size,
				playerName: ws._playerName,
			},
		});

		const game = getOrCreateGame(ws._gameId);
		player = game.setPlayerName(playerName, ws._player, token);

		ws._playerName = playerName;

		broadcast(ws._gameId, {
			type: 'playerJoined',
			payload: {
				count: sockets[ws._gameId].size,
				playerName: ws._playerName,
			},
		});
	}

	ws._player = player;

	send(ws, {
		type: 'playerChanged',
		payload: {
			player: player,
		},
	});

	send(ws, {
		type: 'words',
		payload: {
			gameId: ws._gameId,
			words: getWordsForPlayer(ws._gameId, ws._player),
		},
	});
}

function send(client, data) {
	if (client.readyState === 1) {
		client.send(JSON.stringify(data));
	}
};

function broadcast(gameId, data) {
	if (sockets[gameId]) {
		sockets[gameId].forEach(function(client) {
			if (client.readyState === 1) {
				client.send(JSON.stringify(data));
			}
		});
	}
};

function iOSNotify(gameId, playerId, data) {
	const dataToSend = Object.assign({}, data, {
		topic: 'org.reactjs.native.example.Dooler',
	});

	const game = getOrCreateGame(gameId);
	const registrationIds = playerId ?
		game.getTokenForPlayer(playerId) :
		[game.getTokenForPlayer('one'), game.getTokenForPlayer('two')].filter(token => !!token);

	iosNotificationService.send(registrationIds, dataToSend);
}


// GAME DATA

const games = {};
const sockets = {};

function getOrCreateGame(hash) {
	if (games[hash]) {
		return games[hash];
	}

	games[hash] = new Game();

	return games[hash];
}

function giveClue(gameId, player, word, number) {
	const game = getOrCreateGame(gameId);
	const turnsLeftBefore = game.getTurnsLeft();
	const clue = game.giveClueForTurn(player, word, number);
	const turnsLeftAfter = game.getTurnsLeft();

	if (turnsLeftBefore !== turnsLeftAfter) {
		broadcast(gameId, {
			type: 'turns',
			payload: turnsLeftAfter,
		});
	}

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
			payload: turnsLeftAfter,
		});
	}
}

function getWordsForPlayer(gameId, player) {
	const game = getOrCreateGame(gameId);
	return player ? game.getViewForPlayer(player) : game.getWords();
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
			payload: turnsLeftBefore - 1,
		});
	}

	broadcast(gameId, {
		type: 'guess',
		payload: Object.assign({}, guess, { gameId: gameId }),
	});

	const otherPlayer = player === 'one' ? 'two' : 'one';

	iOSNotify(gameId, otherPlayer, {
		title: 'A guess has been made in your game',
		body: `${game.getPlayerName(player)} guessed "${word}" for the clue "${clueWord}"`,
	});

	if ((guess && !guess.playerGuessingChanged && turnsLeftBefore !== turnsLeftAfter) ||
		turnsLeftBefore - 1 > turnsLeftAfter) {
		broadcast(gameId, {
			type: 'turns',
			payload: turnsLeftAfter,
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
			gameId: gameId,
			words: getWordsForPlayer(gameId, ws._player),
		},
	});
	send(ws, {
		type: 'turns',
		payload: getOrCreateGame(gameId).getTurnsLeft(),
	});
	maybeSendCurrentClue(ws, gameId);
}

// ROUTES

app.use(function(req, res, next) {
	const protocol = req.get('X-Forwarded-Proto');
	const host = req.get('Host');
	if (protocol !== 'https' && host && host.indexOf('localhost') === -1) {
		res.redirect('https://' + req.get('Host') + req.url);
	} else {
		next();
	}
});

app.get('*\.(gif|png|jpe?g|svg|ico|app|ipa)', express.static('public/img'));

app.get('/.well-known/acme-challenge/xLHu4WPs9klKrGFJiPRKhEr68Fp1nGwwT57sMu5kSvU', function(req, res) {
	res.send('xLHu4WPs9klKrGFJiPRKhEr68Fp1nGwwT57sMu5kSvU.wcyPaoYEfPqL-uVIHthYuQAf46zGDhI2Dt6L-aP4veQ')
});

app.all('*', (req, res) => {
	res.render('layout');
});
