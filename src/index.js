const Game = require('./game');
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
const wss = new WebSocketServer({ server: server });
server.listen(port, function() {
	console.log('Server with web socket capabilities listening on port ' + port);
});

// HANDLE INCOMING CONNECTIONS

wss.on('connection', function(ws) {
 	console.log('new websocket connection open');

 	// TODO: Remove this counting
 	console.log('we now have ' + wss.clients.size + ' total clients');

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

	if (!gameId) return;

	if (ws._gameId && ws._gameId !== gameId && sockets[ws._gameId]) {
 		// player has joined a different game, so we boot them from their existing game
 		handlePlayerLeft(ws);
	}

	if (!sockets[gameId] || !sockets[gameId].has(ws)) {
 		handlePlayerJoined(ws, gameId);
	}

	switch(type) {
		case 'words':
			send(ws, {
				type: type,
				payload: {
					gameId: gameId,
					words: getWordsForPlayer(gameId),
				},
			});
			break;
		case 'guess':
			broadcast(gameId, {
				type: 'guess',
				payload: Object.assign({ gameId: gameId }, makeGuess(gameId, data.payload.word)),
			});
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
		}
	});

	ws._gameId = undefined;
}

function handlePlayerJoined(ws, gameId) {
	if (sockets[gameId]) {
		sockets[gameId].add(ws);
	} else {
		sockets[gameId] = new Set([ws]);
	}

	ws._gameId = gameId;

	broadcast(gameId, {
		type: 'playerJoined',
		payload: {
			count: sockets[gameId].size,
		}
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


// GAME DATA

const games = {};
const sockets = {};
const DEFAULT_GAME_ID = 'AAAA';
const PLAYERS = {
	one: 'playerOne',
	two: 'playerTwo',
};

function getOrCreateGame(hash) {
	if (games[hash]) {
		return games[hash];
	}

	games[hash] = new Game();

	return games[hash];
}

function getWordsForPlayer(gameId, player) {
	const game = getOrCreateGame(gameId);
	return player ? game.getViewForPlayer(player) : game.getWords();
}

function makeGuess(gameId, word) {
	const game = getOrCreateGame(gameId);
	return game.guess(word);
}

// ROUTES

app.all('*', (req, res) => {
	res.render('layout');
});
