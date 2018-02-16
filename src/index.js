const Game = require('./game');
const express = require('express');
const app = express();
// TODO store games in a hash -- reference them by id (maybe we don't need a DB?)
const games = {};
const DEFAULT_GAME_ID = 'AAAA';
const PLAYERS = {
	one: 'playerOne',
	two: 'playerTwo',
};

function getOrCreateGame(hash) {
	games[hash] = games[hash] || new Game();
	return games[hash];
}

app.get('/', (req, res) => {
	res.send('Secret Agent Words!');
});

app.get('/words', (req, res) => {
	const gameId = req.query.gameId || DEFAULT_GAME_ID;
	const game = getOrCreateGame(gameId);
	const player = PLAYERS[req.query.player];
	const view = player ? game.getViewForPlayer(player) : game.getWords('playerOne');

	res.send(view);
});

app.listen(process.env.PORT || 3000, () => console.log('Secret Word Agent running on localhost:3000/words?gameId=blah !!!'));
