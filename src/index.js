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

	res.send({
		gameId,
		word: guess.word,
		roleRevealedForClueGiver: guess.roleRevealedForClueGiver,
		guessesLeft: guess.guessesLeft
	});
});


app.all('*', (req, res) => {
	res.render('layout');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Secret Word Agent running on ${port}!`));
