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

 		const gameId = parsedData.gameId;
	 	if (gameId) {
	 		if (ws._gameId && ws._gameId !== gameId && sockets[ws._gameId]) {
		 		// player has joined a different game, so we boot them from their existing game
		 		handlePlayerLeft(ws);
	 		}

	 		if (!sockets[gameId] || !sockets[gameId].has(ws)) {
		 		handlePlayerJoined(ws, gameId);
	 		}
	 	}
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
})

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


// ROUTES

app.post('/words', (req, res) => {
	const gameId = req.body.gameId || DEFAULT_GAME_ID;
	const game = getOrCreateGame(gameId);
	const player = PLAYERS[req.body.player];
	const view = player ? game.getViewForPlayer(player) : game.getWords();

	res.send({
		gameId,
		words: view,
	});
});

app.post('/guess', (req, res) => {
	const gameId = req.body.gameId || DEFAULT_GAME_ID;
	const word = req.body.word;
	const game = getOrCreateGame(gameId);
	const guess = game.guess(word);

	const payload = {
		gameId,
		word: guess.word,
		roleRevealedForClueGiver: guess.roleRevealedForClueGiver,
		guessesLeft: guess.guessesLeft
	};

	res.send(payload);

	broadcast(gameId, { type: 'guess', payload: payload });
});

app.all('*', (req, res) => {
	res.render('layout');
});
