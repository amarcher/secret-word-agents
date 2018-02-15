var Game = require('./game');

// TODO store games in a hash -- reference them by id (maybe we don't need a DB?)
var games = {};

var game = new Game();

console.log('PLAYER ONE')
console.log(game.getViewForPlayer('playerOne'))
console.log('')
console.log('PLAYER TWO')
console.log(game.getViewForPlayer('playerTwo'))

console.log(game.giveClueForTurn('playerOne', 'banana', 2));
console.log(game.guess(game.getViewForPlayer('playerTwo').assasins[0]));
