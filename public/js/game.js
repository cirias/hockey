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

  var gameWidth = 480;
  var gameHeight = 720;
  var boundThickness = 20;
  var puckDiameter = 45;
  var puckRadius = puckDiameter / 2;
  var malletDiameter = 90;
  var malletRadius = malletDiameter / 2;
  var gateWidth = 180;

  var game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, '', null, false, false);

  var bounds;
  var mallets;
  var pucks;
  var puck;
  var scores;

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
      this.createScore();
    },
    update: function () {
      this.updateMallet();
      this.checkPuck();
    },
    render: function () {
      game.debug.text("ping: " + ping + "ms", 10, 20);
    },
    updateMallet: function () {
      var upMallet = mallets.children[0];
      var downMallet = mallets.children[1];

      if (!this.upPointer || !this.upPointer.isDown) {
        if (game.input.pointer1.isDown && atUpside(game.input.pointer1) && (this.downPointer != game.input.pointer1)) {
          this.upPointer = game.input.pointer1;
        } else if (game.input.pointer2.isDown && atUpside(game.input.pointer2) && (this.downPointer != game.input.pointer2)) {
          this.upPointer = game.input.pointer2;
        } else {
          this.upPointer = {x: upMallet.body.x, y: upMallet.body.y};
        }
      }

      if (!this.downPointer || !this.downPointer.isDown) {
        if (game.input.pointer1.isDown && atDownside(game.input.pointer1) && (this.upPointer != game.input.pointer1)) {
          this.downPointer = game.input.pointer1;
        } else if (game.input.pointer2.isDown && atDownside(game.input.pointer2) && (this.upPointer != game.input.pointer2)) {
          this.downPointer = game.input.pointer2;
        } else {
          this.downPointer = {x: downMallet.body.x, y: downMallet.body.y};
        }
      }

      var rate = 30;
      var upPointer = validify(this.upPointer, 'up');
      var downPointer = validify(this.downPointer, 'down');
      upMallet.body.velocity.x = (upPointer.x - upMallet.body.x) * rate;
      upMallet.body.velocity.y = (upPointer.y - upMallet.body.y) * rate;
      downMallet.body.velocity.x = (downPointer.x - downMallet.body.x) * rate;
      downMallet.body.velocity.y = (downPointer.y - downMallet.body.y) * rate;


      function validify (p, area) {
        var leftBorder = boundThickness + malletRadius;
        var rightBorder = game.world.width - (boundThickness + malletRadius);
        var topBorder = boundThickness + malletRadius;
        var bottomBorder = game.world.height - (boundThickness + malletRadius);
        var tp = {};

        if (p.x < leftBorder) {
          tp.x = leftBorder;
        } else if (p.x > rightBorder) {
          tp.x = rightBorder;
        } else {
          tp.x = p.x;
        }

        if (p.y < topBorder) {
          tp.y = topBorder;
        } else if (p.y > bottomBorder) {
          tp.y = bottomBorder;
        } else {
          tp.y = p.y;
        }

        if ((area === 'up' && p.y > game.world.height/2) ||
            (area === 'down' && p.y < game.world.height/2)) {
          tp.y = game.world.height/2;
        }

        return tp;
      }

      function atUpside (p) {
        return (
          p.y < game.world.height/2
        );
      }

      function atDownside (p) {
        return (
          p.y > game.world.height/2
        );
      }
    },
    checkPuck: function () {
      function initializePuck () {
        puck.body.x = game.world.centerX;
        puck.body.y = game.world.centerY;
        puck.body.setZeroVelocity();
        puck.body.setZeroForce();
        puck.body.setZeroRotation();
        puck.body.setZeroDamping();
      }

      if (puck.body.y < 0) {
        var score = parseInt(scores[1].text);
        score++;
        scores[1].text = score.toString();
        initializePuck();
      } else if (puck.body.y > game.world.height) {
        var score = parseInt(scores[0].text);
        score++;
        scores[0].text = score.toString();
        initializePuck();
      }
    },
    createBounds: function () {
      bounds = game.add.group();
      bounds.enableBody = true;
      bounds.physicsBodyType = Phaser.Physics.P2JS;

      for (var i = 0; i < 6; i++) {
        var gateSideWidth = (game.world.width - gateWidth)/2;

        var bound;
        switch (i) {
          case 0:
            // top left
            var box = game.add.graphics();
            box.beginFill(0x6DD8FC);
            box.drawRect(0, 0, gateSideWidth, boundThickness);
            box.endFill();
            bound = bounds.create(0, 0);
            bound.addChild(box);
            bound.body.setRectangle(gateSideWidth + puckDiameter*4, boundThickness + puckDiameter*4, gateSideWidth/2 - puckDiameter*2, boundThickness/2 - puckDiameter*2);
            break;
          case 1:
            // top right
            var box = game.add.graphics();
            box.beginFill(0x6DD8FC);
            box.drawRect(0, 0, gateSideWidth, boundThickness);
            box.endFill();
            bound = bounds.create(gateSideWidth + gateWidth, 0);
            bound.addChild(box);
            bound.body.setRectangle(gateSideWidth + puckDiameter*4, boundThickness + puckDiameter*4, gateSideWidth/2 + puckDiameter*2, boundThickness/2 - puckDiameter*2);
            break;
          case 2:
            // Right
            var box = game.add.graphics();
            box.beginFill(0x6DD8FC);
            box.drawRect(0, 0, boundThickness, game.world.height);
            box.endFill();
            bound = bounds.create(game.world.width - boundThickness, 0);
            bound.addChild(box);
            bound.body.setRectangle(boundThickness + puckDiameter * 4, game.world.height + puckDiameter * 8, puckDiameter*2 + boundThickness/2, game.world.height/2);
            break;
          case 3:
            // bottom right
            var box = game.add.graphics();
            box.beginFill(0x6DD8FC);
            box.drawRect(0, 0, gateSideWidth, boundThickness);
            box.endFill();
            bound = bounds.create(gateSideWidth + gateWidth, game.world.height - boundThickness);
            bound.addChild(box);
            bound.body.setRectangle(gateSideWidth + puckDiameter*4, boundThickness + puckDiameter*4, gateSideWidth/2 + puckDiameter*2, boundThickness/2 + puckDiameter*2);
            break;
          case 4:
            // bottom left
            var box = game.add.graphics();
            box.beginFill(0x6DD8FC);
            box.drawRect(0, 0, gateSideWidth, boundThickness);
            box.endFill();
            bound = bounds.create(0, game.world.height - boundThickness);
            bound.addChild(box);
            bound.body.setRectangle(gateSideWidth + puckDiameter*4, boundThickness + puckDiameter*4, gateSideWidth/2 - puckDiameter*2, boundThickness/2 + puckDiameter*2);
            break;
          case 5:
            // Left
            var box = game.add.graphics();
            box.beginFill(0x6DD8FC);
            box.drawRect(0, 0, boundThickness, game.world.height);
            box.endFill();
            bound = bounds.create(0, 0);
            bound.addChild(box);
            bound.body.setRectangle(boundThickness + puckDiameter * 4, game.world.height + puckDiameter * 8, -puckDiameter*2 + boundThickness/2, game.world.height/2);
            break;
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
        mallet.body.setCircle(malletRadius);
        mallet.body.debug = true;
        //mallet.body.kinematic = true;
        //mallet.body.static = true;
        mallet.body.damping = 0;

        //var sign = game.rnd.integerInRange(0, 1) == 0 ? 1 : -1;
        //mallet.body.velocity.x = game.rnd.integerInRange(100, 250) * sign;
        //mallet.body.velocity.y = game.rnd.integerInRange(100, 250) * sign;

        mallet.inputEnabled = true;
        mallet.input.enableDrag(true);
      }

      mallets.children[0].body.x = game.world.centerX;
      mallets.children[0].body.y = boundThickness + malletRadius;
      mallets.children[1].body.x = game.world.centerX;
      mallets.children[1].body.y = game.world.height - boundThickness - malletRadius;
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
      puck.body.setCircle(puckRadius);
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
    },
    createScore: function () {
      var style = {font: "20px Arial", fill: "#ff0044", align: "center"};

      scores = [
        game.add.text(game.world.width - boundThickness - 15, game.world.centerY - 15, '0', style),
        game.add.text(game.world.width - boundThickness - 15, game.world.centerY + 15, '0', style)
      ];
    }
  };

  game.state.add('game', GameState, true);
}

var hockey = new Hockey();
