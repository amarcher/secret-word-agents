const WORDS = require('./words');

const COUNTS = {
	WORDS: 25,
	AGENTS: 15,
	AGENTS_PER_PLAYER: 9,
	ASSASINS_PER_PLAYER: 3,
	PLAYERS: 2,
	TURNS: 9,
};

const ROLES = {
	ASSASIN: 'ASSASIN',
	AGENT: 'AGENT',
	NON_AGENT: 'NON_AGENT',
};

COUNTS.OVERLAPPING_AGENTS = COUNTS.PLAYERS * COUNTS.AGENTS_PER_PLAYER - COUNTS.AGENTS;

function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}

	return array;
}

function getRandomizedWords() {
	return shuffle(WORDS.slice()).slice(0, COUNTS.WORDS);
}

function getGameboard() {
	const overlappingAgents = [];
	const playerOneAgents = [];
	const playerTwoAgents = [];
	const nonAgents = [];

	for (let i = 0; i < COUNTS.OVERLAPPING_AGENTS; i++) {
		overlappingAgents.push({
			playerOne: ROLES.AGENT,
			playerTwo: ROLES.AGENT,
		});
	}

	for (let j = 0; j < (COUNTS.AGENTS_PER_PLAYER - COUNTS.OVERLAPPING_AGENTS); j++) {
		playerOneAgents.push({
			playerOne: ROLES.AGENT,
		});

		playerTwoAgents.push({
			playerTwo: ROLES.AGENT,
		});
	}

	for (let k = 0; k < (COUNTS.WORDS - COUNTS.AGENTS); k++) {
		nonAgents.push({});
	}

	let playerOneAssasins = 0;
	let playerTwoAssasins = 0;
	let gameboard = shuffle(overlappingAgents.concat(nonAgents, playerOneAgents, playerTwoAgents));
	gameboard.forEach((square) => {
		if (!square.playerOne) {
			if (playerOneAssasins < COUNTS.ASSASINS_PER_PLAYER) {
				square.playerOne = ROLES.ASSASIN;
				playerOneAssasins++;
			} else {
				square.playerOne = ROLES.NON_AGENT;
			}
		}
	});
	gameboard = shuffle(gameboard);
	gameboard.forEach((square) => {
		if (!square.playerTwo) {
			if (playerTwoAssasins < COUNTS.ASSASINS_PER_PLAYER) {
				square.playerTwo = ROLES.ASSASIN;
				playerTwoAssasins++;
			} else {
				square.playerTwo = ROLES.NON_AGENT;
			}
		}
	});

	return shuffle(gameboard);
}

function getWordMap() {
	const words = getRandomizedWords();
	const gameboard = getGameboard();

	const wordMap = {};

	words.forEach((word, index) => {
		wordMap[word] = Object.assign({}, gameboard[index], { roleRevealedForClueGiver: {} });
	});

	return wordMap;
}

function Game() {
	this.wordMap = getWordMap();
	this.agentsLeft = COUNTS.AGENTS;
	this.turnsLeft = COUNTS.TURNS;

	// TODO: remove
	this.giveClueForTurn('playerOne', 'infinity', COUNTS.WORDS);
}

Game.prototype.giveClueForTurn = function (playerGivingClue, clueWord, guessesLeft) {
	if (this.currentTurn && this.currentTurn.guessesLeft > 0) {
		throw new Error(`There are still ${this.currentTurn.guessesLeft}guesses left in the current turn`);
	}

	this.currentTurn = {
		playerGivingClue,
		guessesLeft,
		clueWord,
	};

	return this.currentTurn;
};

Game.prototype.guess = function (word, player) {
	const square = this.wordMap[word];
	let playerGivingClue = player === 'one' ? 'playerTwo' : 'playerOne';

	if (!player) {
		console.log('No player provided.');
		playerGivingClue = this.currentTurn.playerGivingClue;
	}

	const role = square[playerGivingClue];


	if (!square) {
		console.log(`The word "${word}"" is not on the board.`);
		return;
	}

	if (square.roleRevealedForClueGiver[playerGivingClue]) {
		console.log(`The word "${word}" was already revealed to be: ${role} for this clue-giver.`);
		return;
	}

	square.roleRevealedForClueGiver[playerGivingClue] = role;

	if (role === ROLES.AGENT) {
		this.agentsLeft--;
		this.currentTurn.guessesLeft--;
	}

	if (square[playerGivingClue] !== ROLES.AGENT || this.currentTurn.guessesLeft < 1) {
		this.currentTurn.guessesLeft = 0;
		this.turnsLeft--;
	}

	return {
		word: word,
		roleRevealedForClueGiver: square.roleRevealedForClueGiver,
		guessesLeft: this.currentTurn.guessesLeft,
	};
};

Game.prototype.getWordsOfEntityTypeForPlayer = function (entityType, player) {
	return Object.keys(this.wordMap).filter(function (word) {
		return this.wordMap[word][player] === entityType;
	}, this);
};

Game.prototype.getWords = function () {
	const words = {};

	Object.keys(this.wordMap).forEach(function (word) {
		words[word] = {
			roleRevealedForClueGiver: this.wordMap[word].roleRevealedForClueGiver,
		};
	}, this);

	return words;
};

Game.prototype.getViewForPlayer = function (player) {
	if (!player) return this.getWords();

	const words = {};
	const playerNumber = player === 'one' ? 'playerOne' : 'playerTwo';

	Object.keys(this.wordMap).forEach(function (word) {
		words[word] = {
			role: this.wordMap[word][playerNumber],
			roleRevealedForClueGiver: this.wordMap[word].roleRevealedForClueGiver,
		};
	}, this);

	return words;
};

module.exports = Game;
