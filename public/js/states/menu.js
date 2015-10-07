var buttonWidth = 140;
var buttonHeight = 70;

module.exports = function (game) {
  return {
    preload: function () {
      game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    },
    create: function () {
      var box = game.add.graphics();
      box.beginFill(0x6DD8FC);
      box.drawRect(0, 0, buttonWidth, buttonHeight);
      box.endFill();

      var text = game.add.text(0, 0, 'START', {
        'font': '30px Arial',
        'fill': 'black'
      });
      text.x = (buttonWidth - text.width)*0.5;
      text.y = (buttonHeight - text.height)*0.5;

      var button = game.add.button(
        (game.world.width - buttonWidth)*0.5,
        (game.world.height - buttonHeight)*0.5,
        null, start);
      button.width = buttonWidth;
      button.height = buttonHeight;
      button.scale.setTo(1, 1);
      button.addChild(box);
      button.addChild(text);
    }
  };

  function start () {
    game.state.start('game');
  }
};

