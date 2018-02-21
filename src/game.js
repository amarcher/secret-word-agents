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

const WORDS = [
	'battleship',
	'bee',
	'honey',
	'winter',
	'key',
	'celebrate',
	'waver',
	'jump',
	'cactus',
	'manatee',
	'poodle',
	'kitten',
	'explosion',
	'trip',
	'phone',
	'kuala',
	'suculent',
	'computer',
	'email',
	'airplane',
	'fence',
	'gastropub',
	'salsa',
	'guacamole',
	'fondue',
	'cheese',
	'berry',
	'martini',
	'moscow',
	'ruler',
	'bandaid',
	'toilet',
	'nuclear',
	'dynomite',
	'popcorn',
];

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

Game.prototype.guess = function (word) {
	const square = this.wordMap[word];
	const player = this.currentTurn && this.currentTurn.playerGivingClue;
	const role = square[player];

	if (!player) {
		throw new Error('No one has given a clue yet.');
	}

	if (!square) {
		throw new Error(`The word "${word}"" is not on the board.`);
	}

	if (square.roleRevealedForClueGiver[player]) {
		throw new Error(`The word "${word}" was already revealed to be: ${role} for this clue-giver.`);
	}

	square.roleRevealedForClueGiver[player] = role;

	if (role === ROLES.AGENT) {
		this.agentsLeft--;
		this.currentTurn.guessesLeft--;
	}

	if (square[player] !== ROLES.AGENT || this.currentTurn.guessesLeft < 1) {
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

Game.prototype.getWords = function (player) {
	const words = {};

	Object.keys(this.wordMap).forEach(function (word) {
		words[word] = {
			roleRevealedForClueGiver: this.wordMap[word].roleRevealedForClueGiver,
		};
	}, this);

	return words;
};

Game.prototype.getViewForPlayer = function (player) {
	const assasins = this.getWordsOfEntityTypeForPlayer(ROLES.ASSASIN, player);
	const agents = this.getWordsOfEntityTypeForPlayer(ROLES.AGENT, player);
	const nonAgents = this.getWordsOfEntityTypeForPlayer(ROLES.NON_AGENT, player);

	return {
		agents,
		nonAgents,
		assasins,
	};
};

module.exports = Game;
