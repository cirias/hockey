var gameWidth = 480;
var gameHeight = 720;

var game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, '', null, false, false);

var GameState = require('./states/game.js')(game);

game.state.add('game', GameState, true);
