const bluebird = require('bluebird');
const redis = require('redis');

bluebird.promisifyAll(redis);

class RedisClient {
	constructor() {
		this.client = redis.createClient(process.env.REDIS_URL);

		this.client.on('error', (err) => {
			console.log(`Redis error: ${err}`); // eslint-disable-line no-console
		});
	}

	async setWordMap(gameId, wordMap) {
		const formattedWordMap = Object.keys(wordMap).reduce((memo, word) => {
			const wordData = wordMap[word];
			memo.push(word);
			memo.push(`${wordData.playerOne},${wordData.playerTwo},${wordData.roleRevealedForClueGiver.playerOne || ''},${wordData.roleRevealedForClueGiver.playerTwo || ''}`);
			return memo;
		}, [`game:${gameId}:words`]);

		return this.client.delAsync(`game:${gameId}:words`).then(() => (
			this.client.hmsetAsync.apply(this.client, formattedWordMap) // eslint-disable-line prefer-spread
		));
	}

	async getWordMap(gameId) {
		return this.client.hgetallAsync(`game:${gameId}:words`).then(words => (
			Object.keys(words).reduce((memo, word) => {
				const wordData = words[word].split(',');
				memo[word] = { // eslint-disable-line no-param-reassign
					playerOne: wordData[0],
					playerTwo: wordData[1],
					roleRevealedForClueGiver: {
						playerOne: wordData[2],
						playerTwo: wordData[3],
					},
				};

				return memo;
			}, {})
		));
	}

	async getWords(gameId, teamId) {
		return this.client.hgetallAsync(`game:${gameId}:words`).then(words => (
			Object.keys(words).reduce((memo, word) => {
				const wordData = words[word].split(',');
				memo[word] = { // eslint-disable-line no-param-reassign
					roleRevealedForClueGiver: {
						playerOne: wordData[2],
						playerTwo: wordData[3],
					},
				};
				if (teamId) memo[word].role = wordData[teamId - 1]; // eslint-disable-line no-param-reassign

				return memo;
			}, {})
		));
	}

	async getWordData(gameId, word) {
		return this.client.hgetAsync(`game:${gameId}:words`, word).then((wordInfo) => {
			const wordData = wordInfo.split(',');
			return {
				playerOne: wordData[0],
				playerTwo: wordData[1],
				roleRevealedForClueGiver: {
					playerOne: wordData[2],
					playerTwo: wordData[3],
				},
			};
		});
	}

	async setWordData(gameId, word, wordData) {
		const formattedWordData = `${wordData.playerOne},${wordData.playerTwo},${wordData.roleRevealedForClueGiver.playerOne || ''},${wordData.roleRevealedForClueGiver.playerTwo || ''}`;
		return this.client.hsetAsync(`game:${gameId}:words`, word, formattedWordData);
	}

	/**
	 * Adds a player to a team and returns that teamId, assigns player to team with less players if no teamId is provided
	 * @param {String}		gameId
	 * @param {String}		playerId
	 * @param {[String]}	[token] - iOS notifications token
	 * @param {[String]} 	[teamId] - teamId (if not provided an arbitrary team will be assigned)
	 */
	async addPlayerToTeam(gameId, playerId, token, teamId) {
		if (!teamId) {
			// assign player to the team with fewer players
			const team1count = await this.client.scardAsync(`game:${gameId}:team:1`);
			const team2count = await this.client.scardAsync(`game:${gameId}:team:2`);
			teamId = team1count <= team2count ? 1 : 2; // eslint-disable-line no-param-reassign
		}

		return this.client.saddAsync(`game:${gameId}:team:${teamId}`, playerId)
			.then(() => this.client.saddAsync(`player:${playerId}:games`, gameId))
			.then(() => {
				if (token) this.client.saddAsync(`game:${gameId}:tokens:${teamId}`, token);
				return teamId;
			});
	}

	async removePlayerFromTeam(gameId, playerId, teamId, token) {
		return this.client.sremAsync(`game:${gameId}:team:${teamId}`, playerId)
			.then(() => this.client.sremAsync(`player:${playerId}:games`, gameId))
			.then(() => {
				if (token) this.client.sremAsync(`game:${gameId}:tokens:${teamId}`, token);
			});
	}

	async getPlayersOnTeam(gameId, teamId) {
		return this.client.smembersAsync(`game:${gameId}:team:${teamId}`);
	}

	async getTokensOnTeam(gameId, teamId) {
		return this.client.smembersAsync(`game:${gameId}:tokens:${teamId}`);
	}

	async getGamesForPlayer(playerId) {
		return this.client.smembersAsync(`player:${playerId}:games`);
	}

	async getPlayerIdForFacebookId(facebookId) {
		return this.client.getAsync(`facebook:${facebookId}`);
	}

	async setPlayer(name, facebookId, facebookUrl) {
		const playerIdFromFB = facebookId && await this.getPlayerIdForFacebookId(facebookId);
		const playerId = playerIdFromFB || await this.client.incrAsync('playerIds');

		this.client.hmsetAsync(`player:${playerId}`, 'name', name || '', 'facebookId', facebookId || '', 'facebookUrl', facebookUrl || '')
			.then(() => {
				if (facebookId && !playerIdFromFB) this.client.setAsync(`facebook:${facebookId}`, playerId);
			});

		return playerId;
	}

	async getPlayer(playerId) {
		return this.client.hgetallAsync(`player:${playerId}`);
	}

	async setTurn(gameId, clueGiverTeamId = '', clueWord = '', clueNumber = 0, guessesLeft = 25) {
		return this.client.hmsetAsync(
			`game:${gameId}:turn`,
			'clueGiverTeamId',
			clueGiverTeamId,
			'clueWord',
			clueWord,
			'clueNumber',
			clueNumber,
			'guessesLeft',
			guessesLeft,
		);
	}

	async getTurn(gameId) {
		return this.client.hgetallAsync(`game:${gameId}:turn`);
	}

	async getTurnsLeft(gameId) {
		return this.client.hgetAsync(`game:${gameId}`, 'turnsLeft').then(turnsLeft => parseInt(turnsLeft, 10));
	}

	async setTurnsLeft(gameId, turnsLeft) {
		this.client.hsetAsync(`game:${gameId}`, 'turnsLeft', turnsLeft);
	}

	async getTeamIdForPlayerId(gameId, playerId) { // eslint-disable-line consistent-return
		if (await this.client.sismemberAsync(`game:${gameId}:team:1`, playerId)) {
			return 1;
		} else if (await this.client.sismemberAsync(`game:${gameId}:team:2`, playerId)) {
			return 2;
		}
	}

	async makeGuess(gameId, guesserTeamId, word) {
		const wordData = await this.getWordData(gameId, word);

		const nonGuesserTeamId = guesserTeamId === 1 ? 2 : 1;
		const {
			agentsLeft,
			agentsLeftTeam1,
			agentsLeftTeam2,
			turnsLeft,
		} = await this.client.hgetallAsync(`game:${gameId}`);

		const agentsLeftTeam = nonGuesserTeamId === 1 ? agentsLeftTeam1 : agentsLeftTeam2;
		const nonGuesserTeamName = nonGuesserTeamId === 1 ? 'playerOne' : 'playerTwo';

		if (!wordData || !wordData[nonGuesserTeamName]) {
			console.warn(`The word "${word}" is not on the board.`); // eslint-disable-line no-console
			return;
		}

		const {
			clueGiverTeamId,
			clueWord,
			guessesLeft,
			clueNumber,
		} = await this.getTurn(gameId);

		const role = wordData[nonGuesserTeamName];

		if (wordData.roleRevealedForClueGiver[nonGuesserTeamName]) {
			console.warn(`The word "${word}" was already revealed to be: ${role} for this clue-giver.`); // eslint-disable-line no-console
			return;
		}

		const roleRevealedForClueGiver = {
			...wordData.roleRevealedForClueGiver,
			[nonGuesserTeamName]: role,
		};

		this.setWordData(gameId, word, {
			...wordData,
			roleRevealedForClueGiver,
		});

		const teamGuessingChanged = clueGiverTeamId && parseInt(clueGiverTeamId, 10) !== nonGuesserTeamId;
		let nextTurnsLeft = parseInt(turnsLeft, 10);

		if (role === 'AGENT') {
			if (teamGuessingChanged || parseInt(guessesLeft, 10) - 1 < 1) nextTurnsLeft -= 1;

			this.client.hmsetAsync(
				`game:${gameId}`,
				'agentsLeft',
				parseInt(agentsLeft, 10) - 1,
				`agentsLeftTeam${nonGuesserTeamId}`,
				parseInt(agentsLeftTeam, 10) - 1,
				'turnsLeft',
				nextTurnsLeft,
			);

			if (teamGuessingChanged || parseInt(guessesLeft, 10) - 1 < 1) {
				this.setTurn(gameId);
			} else {
				this.setTurn(
					gameId,
					clueGiverTeamId,
					clueWord,
					clueNumber,
					parseInt(guessesLeft, 10) - 1,
				);
			}
		} else if (role === 'NON_AGENT') {
			nextTurnsLeft -= 1;
			this.client.hsetAsync(
				`game:${gameId}`,
				'turnsLeft',
				nextTurnsLeft,
			);
			this.setTurn(gameId);
		} else if (role === 'ASSASIN') {
			nextTurnsLeft = 0;
			this.client.hsetAsync(
				`game:${gameId}`,
				'turnsLeft',
				nextTurnsLeft,
			);
			this.setTurn(gameId);
		}

		// eslint-disable-next-line consistent-return
		return {
			word,
			roleRevealedForClueGiver,
			guessesLeft: role === 'AGENT' ? parseInt(guessesLeft, 10) - 1 : 0,
			playerGuessingChanged: teamGuessingChanged,
			turnsLeft: nextTurnsLeft,
		};
	}

	async setGame(gameId, game) {
		return Promise.all([
			this.client.hmsetAsync(
				`game:${gameId}`,
				'turnsLeft',
				game.getTurnsLeft(),
				'agentsLeft',
				game.getAgentsLeft(),
				'agentsLeftTeam1',
				9,
				'agentsLeftTeam2',
				9,
			),
			this.setWordMap(gameId, game.getWordMap()),
			this.setTurn(gameId),
		]);
	}

	async getGame(gameId) {
		const game = await this.client.hgetallAsync(`game:${gameId}`);
		if (!game || typeof game.turnsLeft === 'undefined') return undefined;
		game.wordMap = await this.getWordMap(gameId);
		game.team1 = await this.getPlayersOnTeam(gameId, 1);
		game.team2 = await this.getPlayersOnTeam(gameId, 2);
		game.tokens1 = await this.getTokensOnTeam(gameId, 1);
		game.tokens2 = await this.getTokensOnTeam(gameId, 2);
		game.turn = await this.getTurn(gameId);
		return game;
	}

	async quit() {
		return this.client.quitAsync();
	}
}

module.exports = RedisClient;
