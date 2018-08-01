const bluebird = require('bluebird');
const redis = require('redis');

bluebird.promisifyAll(redis);

class RedisClient {
	constructor() {
		this.client = redis.createClient();

		this.client.on('error', (err) => {
			console.log(`Error: ${err}`); // eslint-disable-line no-console
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

	async addPlayerToTeam(gameId, playerId, teamId, token) {
		return this.client.saddAsync(`game:${gameId}:team:${teamId}`, playerId)
			.then(() => this.client.saddAsync(`player:${playerId}:games`, gameId))
			.then(() => {
				if (token) this.client.saddAsync(`game:${gameId}:tokens:${teamId}`, token);
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

		this.client.hmsetAsync(`player:${playerId}`, 'name', name, 'facebookId', facebookId, 'facebookUrl', facebookUrl)
			.then(() => {
				if (facebookId && !playerIdFromFB) this.client.setAsync(`facebook:${facebookId}`, playerId);
			});

		return playerId;
	}

	async getPlayer(playerId) {
		return this.client.hgetallAsync(`player:${playerId}`);
	}

	async setGame(gameId, game) {
		return Promise.all([
			this.client.hsetAsync(`game:${gameId}`, 'turnsLeft', game.getTurnsLeft()),
			this.client.hsetAsync(`game:${gameId}`, 'agentsLeft', game.getAgentsLeft()),
			this.setWordMap(gameId, game.getWordMap()),
		]);
	}

	async getGame(gameId) {
		const game = await this.client.hgetallAsync(`game:${gameId}`);
		game.wordMap = await this.getWordMap(gameId);
		game.team1 = await this.getPlayersOnTeam(gameId, 1);
		game.team2 = await this.getPlayersOnTeam(gameId, 2);
		game.tokens1 = await this.getTokensOnTeam(gameId, 1);
		game.tokens2 = await this.getTokensOnTeam(gameId, 2);
		return game;
	}

	quit() {
		this.client.quit();
	}
}

module.exports = RedisClient;
