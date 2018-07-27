/* eslint-disable no-console, no-use-before-define, no-param-reassign, no-plusplus */

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

COUNTS.OVERLAPPING_AGENTS = (COUNTS.PLAYERS * COUNTS.AGENTS_PER_PLAYER) - COUNTS.AGENTS;

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

class Game {
	constructor() {
		this.wordMap = getWordMap();
		this.agentsLeft = COUNTS.AGENTS;
		this.turnsLeft = COUNTS.TURNS;
		this.playerOne = {};
		this.playerTwo = {};
	}

	giveClueForTurn(player, clueWord, guessesLeft) {
		const playerGivingClue = player === 'one' ? 'playerOne' : 'playerTwo';

		if (this.currentTurn && this.currentTurn.guessesLeft > 0) {
			console.log(`There were still ${this.currentTurn.guessesLeft} guesses left in the current turn, but we got a new clue`);

			this.turnsLeft -= 1;
		}

		this.currentTurn = {
			playerGivingClue,
			guessesLeft,
			clueWord,
		};

		return this.currentTurn;
	}

	getCurrentClue() {
		if (this.currentTurn && this.currentTurn.guessesLeft > 0) {
			return this.currentTurn;
		}

		return null;
	}

	guess(word, player) {
		const square = this.wordMap[word];
		const playerGivingClue = player === 'one' ? 'playerTwo' : 'playerOne';
		let playerGuessingChanged = false;

		// Play is proceeding without using input
		if (!this.currentTurn) {
			this.currentTurn = {
				playerGivingClue,
				guessesLeft: this.agentsLeft,
				clueWord: '',
			};
		} else if (this.currentTurn.playerGivingClue !== playerGivingClue) {
			this.turnsLeft -= 1;

			this.currentTurn = {
				playerGivingClue,
				guessesLeft: this.agentsLeft,
				clueWord: '',
			};

			playerGuessingChanged = true;
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

		if (square[playerGivingClue] === ROLES.NON_AGENT || (square[playerGivingClue] === ROLES.AGENT && this.currentTurn.guessesLeft < 1)) {
			this.currentTurn = undefined;
			this.turnsLeft--;
		}

		if (square[playerGivingClue] === ROLES.ASSASIN) {
			this.currentTurn = undefined;
			this.turnsLeft = 0;
		}

		// eslint-disable-next-line consistent-return
		return {
			word,
			roleRevealedForClueGiver: square.roleRevealedForClueGiver,
			guessesLeft: (this.currentTurn && this.currentTurn.guessesLeft) || 0,
			playerGuessingChanged,
		};
	}

	endTurn() {
		if (this.currentTurn) {
			this.turnsLeft -= 1;
			this.currentTurn = undefined;
		}
	}

	getWordsOfEntityTypeForPlayer(entityType, player) {
		return Object.keys(this.wordMap).filter(word => (
			this.wordMap[word][player] === entityType
		), this);
	}

	getWords() {
		const words = {};

		Object.keys(this.wordMap).forEach((word) => {
			words[word] = {
				roleRevealedForClueGiver: this.wordMap[word].roleRevealedForClueGiver,
			};
		}, this);

		return words;
	}

	getTurnsLeft() {
		return this.turnsLeft;
	}

	getViewForPlayer(player) {
		if (!player) return this.getWords();

		const words = {};
		const playerNumber = player === 'one' ? 'playerOne' : 'playerTwo';

		Object.keys(this.wordMap).forEach((word) => {
			words[word] = {
				role: this.wordMap[word][playerNumber],
				roleRevealedForClueGiver: this.wordMap[word].roleRevealedForClueGiver,
			};
		}, this);

		return words;
	}

	setPlayerName(name, playerId, token, facebookId) {
		if (!name) {
			if (playerId === 'one') {
				this.playerOne.name = '';
				this.playerOne.token = undefined;
				this.playerOne.facebookId = undefined;
			}

			if (playerId === 'two') {
				this.playerTwo.name = '';
				this.playerTwo.token = undefined;
				this.playerTwo.facebookId = undefined;
			}

			return '';
		} else if (name && playerId) {
			if (playerId === 'one' && (!this.playerOne.name || name === this.playerOne.name)) {
				this.playerOne.name = name;
				if (token) this.playerOne.token = token;
				if (facebookId) this.playerOne.facebookId = facebookId;
				return 'one';
			} else if (playerId === 'two' && (!this.playerTwo.name || name === this.playerTwo.name)) {
				this.playerTwo.name = name;
				if (token) this.playerTwo.token = token;
				if (facebookId) this.playerTwo.facebookId = facebookId;
				return 'two';
			}

			return '';
		}

		// both player slots are taken
		if (this.playerOne.name && this.playerOne.name !== name && this.playerTwo.name && this.playerTwo.name !== name) return '';

		if (this.playerOne.name === name) {
			if (token) this.playerOne.token = token;
			if (facebookId) this.playerOne.facebookId = facebookId;
			return 'one';
		}

		if (this.playerTwo.name === name) {
			if (token) this.playerTwo.token = token;
			if (facebookId) this.playerTwo.facebookId = facebookId;
			return 'two';
		}

		if (!this.playerOne.name) {
			this.playerOne.name = name;
			if (facebookId) this.playerOne.facebookId = facebookId;
			if (token) this.playerOne.token = token;
			return 'one';
		}

		this.playerTwo.name = name;
		if (token) this.playerTwo.token = token;
		if (facebookId) this.playerTwo.facebookId = facebookId;
		return 'two';
	}

	getPlayerName(playerId) {
		if (playerId === 'one') return this.playerOne.name;
		if (playerId === 'two') return this.playerTwo.name;
		return '';
	}

	getTokenForPlayer(playerId) {
		if (playerId === 'one') return this.playerOne.token;
		if (playerId === 'two') return this.playerTwo.token;
		return '';
	}

	getPlayerWithFacebookId(facebookId) {
		if (facebookId === this.playerOne.facebookId) return 'one';
		if (facebookId === this.playerTwo.facebookId) return 'two';
		return '';
	}
}

module.exports = Game;
