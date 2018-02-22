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
 	let count = 0;
 	wss.clients.forEach(function(client, index) { count++ });
 	console.log('we now have this many clients: ', count);

 	ws.on('message', function(data) {
 		// TODO do something with incoming messages
	 	console.log('websocket message', JSON.parse(data));
 	});

 	ws.on('close', function(info) {
 		// TODO do something with incoming messages
		console.log('websocket connection close')
 	});

 	ws.on('error', function(info) {
 		// NOTE: Unhandled errors cause the app to crash... So we need this!
		console.log('websocket error', info.message);
	});
})


function broadcast(data) {
	wss.clients.forEach(function(client) {
		// TODO: Check the gameId for each client before broadcasting
		if (client.readyState === 1) {
			client.send(JSON.stringify(data));
		}
	});
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

	broadcast({ type: 'guess', payload: payload });
});

app.all('*', (req, res) => {
	res.render('layout');
});
