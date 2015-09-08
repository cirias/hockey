function Hockey () {
  var self = this;
  var socket = io();

  var pingTime;
  var ping;
  socket.on('pong', function () {
    var latency = Date.now() - pingTime;
    ping = latency;
  });

  function measurePing() {
    setTimeout(function () {
      pingTime = Date.now();
      socket.emit('ping');
      measurePing();
    }, 2000);
  }
  measurePing();

  var gameWidth = 400;
  var gameHeight = 600;
  var boundThickness = 40;
  var puckDiameter = 32;
  var malletDiameter = 100;

  var game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, '', null, false, false);

  var bounds;
  var mallets;
  var pucks;
  var puck;

  var GameState = {
    preload: function () {
      game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      game.scale.minWidth = 320;
      game.scale.minHeight = 480;
      game.scale.maxWidth = 768*2;
      game.scale.maxHeight = 1152*2;

      game.load.image('pixel', 'res/pixel.png');
    },
    create: function () {
      game.physics.startSystem(Phaser.Physics.P2JS);
      game.physics.p2.restitution = 1;

      this.createBounds();
      this.createMallets();
      this.createPuck();
      this.createCollision();
    },
    update: function () {
      var upMallet = mallets.children[0];
      var downMallet = mallets.children[1];
      upMallet.body.setZeroVelocity();
      downMallet.body.setZeroVelocity();
      var upPointer = {worldX: upMallet.body.x, worldY: upMallet.body.y};
      var downPointer = {worldX: downMallet.body.x, worldY: downMallet.body.y};

      if (game.input.pointer1.active) {
        if (game.input.pointer1.y < game.world.height/2 - malletDiameter/4) {
          upPointer = game.input.pointer1;
        } else if (game.input.pointer1.y > game.world.height/2 + malletDiameter/4) {
          downPointer = game.input.pointer1;
        }
      }

      if (game.input.pointer2.active) {
        if (game.input.pointer2.y < game.world.height/2 - malletDiameter/4) {
          upPointer = game.input.pointer2;
        } else if (game.input.pointer2.y > game.world.height/2 + malletDiameter/4) {
          downPointer = game.input.pointer2;
        }
      }

      upMallet.body.x = upPointer.worldX;
      upMallet.body.y = upPointer.worldY;
      downMallet.body.x = downPointer.worldX;
      downMallet.body.y = downPointer.worldY;
    },
    render: function () {
      game.debug.text("ping: " + ping + "ms", 10, 20);
    },
    createBounds: function () {
      bounds = game.add.group();
      bounds.enableBody = true;
      bounds.physicsBodyType = Phaser.Physics.P2JS;

      bounds.create(game.world.width/2 , boundThickness/2, 'pixel');
      bounds.create(game.world.width - boundThickness/2, game.world.height/2, 'pixel');
      bounds.create(game.world.width/2, game.world.height - boundThickness/2, 'pixel');
      bounds.create(boundThickness/2, game.world.height/2, 'pixel');

      for (var i in bounds.children) {
        var bound = bounds.children[i];
        bound.tint = 0xeeeeee;
        if (i%2 == 0) {
          bound.scale.setTo(game.world.width, boundThickness);
          bound.body.setRectangle(game.world.width, boundThickness);
        } else {
          bound.scale.setTo(boundThickness, game.world.height);
          bound.body.setRectangle(boundThickness, game.world.height);
        }
        bound.body.debug = true;
        bound.body.static = true;
        bound.body.damping = 0;
      }
    },
    createMallets: function () {
      mallets = game.add.group();
      mallets.enableBody = true;
      mallets.physicsBodyType = Phaser.Physics.P2JS;

      for (var i = 0; i < 2; i++) {
        var circle = game.add.graphics();
        circle.beginFill(0xFF3300);
        circle.drawCircle(0, 0, malletDiameter);
        circle.endFill();

        var mallet = mallets.create(0, 0);
        mallet.addChild(circle);
        mallet.body.setCircle(malletDiameter/2);
        mallet.body.debug = true;
        mallet.body.static = true;
        mallet.body.damping = 0;

        //var sign = game.rnd.integerInRange(0, 1) == 0 ? 1 : -1;
        //mallet.body.velocity.x = game.rnd.integerInRange(100, 250) * sign;
        //mallet.body.velocity.y = game.rnd.integerInRange(100, 250) * sign;

        mallet.inputEnabled = true;
        mallet.input.enableDrag(true);
      }

      mallets.children[0].body.x = game.world.centerX;
      mallets.children[0].body.y = boundThickness + malletDiameter/2;
      mallets.children[1].body.x = game.world.centerX;
      mallets.children[1].body.y = game.world.height - boundThickness - malletDiameter/2;
    },
    createPuck: function () {
      pucks = game.add.group();
      pucks.enableBody = true;
      pucks.physicsBodyType = Phaser.Physics.P2JS;
      puck = pucks.create(game.world.centerX, game.world.centerY);
      var circle = game.add.graphics();
      circle.beginFill(0xFFFFFF);
      circle.drawCircle(0, 0, puckDiameter);
      circle.endFill();
      puck.addChild(circle);
      puck.body.setCircle(puckDiameter/2);
      puck.body.debug = true;
      puck.body.damping = 0;
    },
    createCollision: function () {
      var boundCollisionGroup = game.physics.p2.createCollisionGroup();
      var puckCollisionGroup = game.physics.p2.createCollisionGroup();
      var playerCollisionGroup = game.physics.p2.createCollisionGroup();

      bounds.forEach(function (bound) {
        bound.body.setCollisionGroup(boundCollisionGroup);
        bound.body.collides([boundCollisionGroup, puckCollisionGroup, playerCollisionGroup]);
      });

      mallets.forEach(function (mallet) {
        mallet.body.setCollisionGroup(playerCollisionGroup);
        mallet.body.collides([playerCollisionGroup, puckCollisionGroup, boundCollisionGroup]);
      });

      puck.body.setCollisionGroup(puckCollisionGroup);
      puck.body.collides([boundCollisionGroup, playerCollisionGroup]);
    }
  };

  game.state.add('game', GameState, true);
}

var hockey = new Hockey();
