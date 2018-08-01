## Secret Agent Words

### Test URL

[See it live](https://secret-agent-words.herokuapp.com/)

### Running locally

```bash
brew install redis
brew services start redis
npm install
npm run build
npm start
```

Then visit localhost:3000/

### Redis Data Structure

game:{$gameId} --> Hash of game state
	turnsLeft
	agentsLeft

game:{$gameId}:team:1 --> Set of IDs of players on team one
game:{$gameId}:team:2 --> Set of IDs of players on team two
game:{$gameId}:tokens:1 --> Set of tokens for players on team one
game:{$gameId}:tokens:2 --> Set of tokens for players on team two
game:{$gameId}:words --> Hash of words present in the game
	[$word] --> {$role1},{$role2},{$revealed1},{$revealed2}

facebook:{$facebookId} --> playerId for which this facebookId belongs

playerIds --> integer of last used player id
player:{$playerId} --> Hash of player info
	name --> String name of player
	facebookId --> String facebookId
	facebookUrl --> String photo URL

player:{$playerId}:games --> Set of gameIds for which this player is on a team