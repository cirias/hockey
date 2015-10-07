var socket = require('../lib/socket.js');

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


var puckDiameter = 45;
var malletDiameter = 90;

module.exports = function (game) {
  return {
    constants: {
      //debug: true,
      debug: false,
      boundThickness: 14,
      puckDiameter: puckDiameter,
      puckRadius: puckDiameter / 2,
      malletDiameter: malletDiameter,
      malletRadius: malletDiameter / 2,
      gateWidth: 180
    },
    preload: function () {
      game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

      game.load.image('puck', 'res/puck.png');
      game.load.image('background', 'res/background.png');
      game.load.image('transverse', 'res/bound-transverse.png');
      game.load.image('portrait', 'res/bound-portrait.png');
      game.load.image('puck', 'res/puck.png');
      game.load.image('up-mallet', 'res/green-circle.png');
      game.load.image('down-mallet', 'res/red-circle.png');
    },
    create: function () {
      game.add.tileSprite(0, 0, 480, 800, 'background');
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
      if (this.constants.debug) {
        game.debug.text("ping: " + ping + "ms", 10, 20);
      }
    },
    updateMallet: function () {
      var self = this;
      var upMallet = this.mallets.children[0];
      var downMallet = this.mallets.children[1];

      if (!upMallet.pointer.id) {
        if (game.input.pointer1.isDown && atUpside(game.input.pointer1) && (downMallet.pointer.id != 'pointer1')) {
          upMallet.pointer.x = game.input.pointer1.x;
          upMallet.pointer.y = game.input.pointer1.y;
          upMallet.pointer.id = 'pointer1';
        } else if (game.input.pointer2.isDown && atUpside(game.input.pointer2) && (downMallet.pointer.id != 'pointer2')) {
          upMallet.pointer.x = game.input.pointer2.x;
          upMallet.pointer.y = game.input.pointer2.y;
          upMallet.pointer.id = 'pointer2';
        } else {
          upMallet.pointer.id = null;
        }
      } else if (!game.input[upMallet.pointer.id].isDown) {
        upMallet.pointer.id = null;
      } else {
        upMallet.pointer.x = game.input[upMallet.pointer.id].x;
        upMallet.pointer.y = game.input[upMallet.pointer.id].y;
      }

      if (!downMallet.pointer.id) {
        if (game.input.pointer1.isDown && atDownside(game.input.pointer1) && (upMallet.pointer.id != 'pointer1')) {
          downMallet.pointer.x = game.input.pointer1.x;
          downMallet.pointer.y = game.input.pointer1.y;
          downMallet.pointer.id = 'pointer1';
        } else if (game.input.pointer2.isDown && atDownside(game.input.pointer2) && (upMallet.pointer.id != 'pointer2')) {
          downMallet.pointer.x = game.input.pointer2.x;
          downMallet.pointer.y = game.input.pointer2.y;
          downMallet.pointer.id = 'pointer2';
        } else {
          downMallet.pointer.id = null;
        }
      } else if (!game.input[downMallet.pointer.id].isDown) {
        downMallet.pointer.id = null;
      } else {
        downMallet.pointer.x = game.input[downMallet.pointer.id].x;
        downMallet.pointer.y = game.input[downMallet.pointer.id].y;
      }

      var rate = 30;
      var upPointer = validify(upMallet.pointer, 'up');
      var downPointer = validify(downMallet.pointer, 'down');
      upMallet.body.velocity.x = (upPointer.x - upMallet.body.x) * rate;
      upMallet.body.velocity.y = (upPointer.y - upMallet.body.y) * rate;
      downMallet.body.velocity.x = (downPointer.x - downMallet.body.x) * rate;
      downMallet.body.velocity.y = (downPointer.y - downMallet.body.y) * rate;


      function validify (p, area) {
        var leftBorder = self.constants.boundThickness + self.constants.malletRadius;
        var rightBorder = game.world.width - (self.constants.boundThickness + self.constants.malletRadius);
        var topBorder = self.constants.boundThickness + self.constants.malletRadius;
        var bottomBorder = game.world.height - (self.constants.boundThickness + self.constants.malletRadius);
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
      if (this.puck.body.y < 0) {
        var score = parseInt(this.scores[1].text);
        score++;
        this.scores[1].text = score.toString();
        this.resetPuck();
      } else if (this.puck.body.y > game.world.height) {
        var score = parseInt(this.scores[0].text);
        score++;
        this.scores[0].text = score.toString();
        this.resetPuck();
      }
    },
    resetPuck: function () {
      this.puck.body.x = game.world.centerX;
      this.puck.body.y = game.world.centerY;
      this.puck.body.setZeroVelocity();
      this.puck.body.setZeroForce();
      this.puck.body.setZeroRotation();
      this.puck.body.setZeroDamping();
    },
    createBounds: function () {
      this.bounds = game.add.group();
      this.bounds.enableBody = true;
      this.bounds.physicsBodyType = Phaser.Physics.P2JS;

      for (var i = 0; i < 6; i++) {
        var gateSideWidth = (game.world.width - this.constants.gateWidth)/2;

        var bound;
        switch (i) {
          case 0:
            // top left
            var box = game.add.image(-7, -25, 'transverse');
            bound = this.bounds.create(0, 40 + this.constants.boundThickness/2);
            bound.addChild(box);
            bound.body.setRectangle(gateSideWidth + this.constants.puckDiameter*4, this.constants.boundThickness + this.constants.puckDiameter*4, gateSideWidth/2 - this.constants.puckDiameter*2, this.constants.boundThickness/2 - this.constants.puckDiameter*2);
            break;
          case 1:
            // top right
            var box = game.add.image(-25, -25, 'transverse');
            bound = this.bounds.create(gateSideWidth + this.constants.gateWidth, 40 + this.constants.boundThickness/2);
            bound.addChild(box);
            bound.body.setRectangle(gateSideWidth + this.constants.puckDiameter*4, this.constants.boundThickness + this.constants.puckDiameter*4, gateSideWidth/2 + this.constants.puckDiameter*2, this.constants.boundThickness/2 - this.constants.puckDiameter*2);
            break;
          case 2:
            // Right
            var box1 = game.add.image(-25, 32, 'portrait');
            var box2 = game.add.image(-25, 375, 'portrait');
            bound = this.bounds.create(game.world.width - this.constants.boundThickness - 5, 0);
            bound.addChild(box1);
            bound.addChild(box2);
            bound.body.setRectangle(this.constants.boundThickness + this.constants.puckDiameter * 4, game.world.height + this.constants.puckDiameter * 8, this.constants.puckDiameter*2 + this.constants.boundThickness/2, game.world.height/2);
            break;
          case 3:
            // bottom right
            var box = game.add.image(-25, -25, 'transverse');
            bound = this.bounds.create(gateSideWidth + this.constants.gateWidth, game.world.height - this.constants.boundThickness - 40 - this.constants.boundThickness/2);
            bound.addChild(box);
            bound.body.setRectangle(gateSideWidth + this.constants.puckDiameter*4, this.constants.boundThickness + this.constants.puckDiameter*4, gateSideWidth/2 + this.constants.puckDiameter*2, this.constants.boundThickness/2 + this.constants.puckDiameter*2);
            break;
          case 4:
            // bottom left
            var box = game.add.image(-7, -25, 'transverse');
            bound = this.bounds.create(0, game.world.height - this.constants.boundThickness - 40 - this.constants.boundThickness/2);
            bound.addChild(box);
            bound.body.setRectangle(gateSideWidth + this.constants.puckDiameter*4, this.constants.boundThickness + this.constants.puckDiameter*4, gateSideWidth/2 - this.constants.puckDiameter*2, this.constants.boundThickness/2 + this.constants.puckDiameter*2);
            break;
          case 5:
            // Left
            var box1 = game.add.image(-25, 32, 'portrait');
            var box2 = game.add.image(-25, 375, 'portrait');
            bound = this.bounds.create(5, 0);
            bound.addChild(box1);
            bound.addChild(box2);
            bound.body.setRectangle(this.constants.boundThickness + this.constants.puckDiameter * 4, game.world.height + this.constants.puckDiameter * 8, -this.constants.puckDiameter*2 + this.constants.boundThickness/2, game.world.height/2);
            break;
        }
        bound.body.debug = this.constants.debug;
        bound.body.static = true;
        bound.body.damping = 0;
      }
    },
    createMallets: function () {
      this.mallets = game.add.group();
      this.mallets.enableBody = true;
      this.mallets.physicsBodyType = Phaser.Physics.P2JS;

      for (var i = 0; i < 2; i++) {
        if (i === 0) {
          var circle = game.add.image(-60, -60, 'up-mallet');
        } else {
          var circle = game.add.image(-60, -60, 'down-mallet');
        }

        var mallet = this.mallets.create(0, 0);
        mallet.addChild(circle);
        mallet.body.setCircle(this.constants.malletRadius);
        mallet.body.debug = this.constants.debug;
        mallet.body.fixedRotation = true;
        //mallet.body.kinematic = true;
        //mallet.body.static = true;
        mallet.body.damping = 0;

        //var sign = game.rnd.integerInRange(0, 1) == 0 ? 1 : -1;
        //mallet.body.velocity.x = game.rnd.integerInRange(100, 250) * sign;
        //mallet.body.velocity.y = game.rnd.integerInRange(100, 250) * sign;

        mallet.inputEnabled = true;
        mallet.input.enableDrag(true);
      }

      this.mallets.children[0].body.x = game.world.centerX;
      this.mallets.children[0].body.y = this.constants.boundThickness + this.constants.malletRadius + this.constants.gateWidth/2 + 50;
      this.mallets.children[0].pointer = {x: this.mallets.children[0].body.x, y: this.mallets.children[0].body.y};
      this.mallets.children[1].body.x = game.world.centerX;
      this.mallets.children[1].body.y = game.world.height - this.constants.boundThickness - this.constants.malletRadius - this.constants.gateWidth/2 - 50;
      this.mallets.children[1].pointer = {x: this.mallets.children[1].body.x, y: this.mallets.children[1].body.y};
    },
    createPuck: function () {
      this.pucks = game.add.group();
      this.pucks.enableBody = true;
      this.pucks.physicsBodyType = Phaser.Physics.P2JS;
      this.puck = this.pucks.create(game.world.centerX, game.world.centerY);
      var circle = game.add.image(-39, -39, 'puck');
      this.puck.addChild(circle);
      this.puck.body.setCircle(this.constants.puckRadius);
      this.puck.body.debug = this.constants.debug;
      this.puck.body.fixedRotation = true;
      this.puck.body.damping = 0;
    },
    createCollision: function () {
      var boundCollisionGroup = game.physics.p2.createCollisionGroup();
      var puckCollisionGroup = game.physics.p2.createCollisionGroup();
      var playerCollisionGroup = game.physics.p2.createCollisionGroup();

      this.bounds.forEach(function (bound) {
        bound.body.setCollisionGroup(boundCollisionGroup);
        bound.body.collides([boundCollisionGroup, puckCollisionGroup, playerCollisionGroup]);
      });

      this.mallets.forEach(function (mallet) {
        mallet.body.setCollisionGroup(playerCollisionGroup);
        mallet.body.collides([playerCollisionGroup, puckCollisionGroup, boundCollisionGroup]);
      });

      this.puck.body.setCollisionGroup(puckCollisionGroup);
      this.puck.body.collides([boundCollisionGroup, playerCollisionGroup]);
    },
    createScore: function () {
      var style = {font: "20px Arial", fill: "#ff0044", align: "center"};

      this.scores = [
        game.add.text(game.world.width - this.constants.boundThickness - 15, game.world.centerY - 15, '0', style),
        game.add.text(game.world.width - this.constants.boundThickness - 15, game.world.centerY + 15, '0', style)
      ];
    }
  };
};
