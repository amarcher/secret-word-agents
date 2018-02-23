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
					words: getWordsForPlayer(gameId, ws._player),
				},
			});
			break;
		case 'guess':
			broadcast(gameId, {
				type: 'guess',
				payload: Object.assign({ gameId: gameId }, makeGuess(gameId, data.payload.word, data.payload.player)),
			});
			break;
		case 'changePlayer':
			handlePlayerChanged(ws, data.payload.player);
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

function handlePlayerChanged(ws, player) {
	ws._player = player;

	send(ws, {
		type: 'playerChanged',
		payload: {
			player: player,
		}
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

function makeGuess(gameId, word, player) {
	const game = getOrCreateGame(gameId);
	return game.guess(word, player);
}

// ROUTES

app.all('*', (req, res) => {
	res.render('layout');
});
