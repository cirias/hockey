var gameWidth = 480;
var gameHeight = 800;

var game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, '', null, false, false);

var MenuState = require('./states/menu.js')(game);
var GameState = require('./states/game.js')(game);

game.state.add('menu', MenuState, true);
game.state.add('game', GameState, false);
