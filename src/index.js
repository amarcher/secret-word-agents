const Game = require('./game');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const games = {};
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

app.get('/words', (req, res) => {
	const gameId = req.query.gameId || DEFAULT_GAME_ID;
	const game = getOrCreateGame(gameId);
	const player = PLAYERS[req.query.player];
	const view = player ? game.getViewForPlayer(player) : game.getWords();

	res.send(view);
});

app.all('*', (req, res) => {
	res.render('layout');
});

app.listen(process.env.PORT || 3000, () => console.log('Secret Word Agent running on localhost:3000/words?gameId=blah !!!'));
