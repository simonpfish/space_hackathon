var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });
var socket = io();

function preload() {

    game.load.image('bullet', 'assets/bullets/bullet278.png');
    game.load.image('ship', 'assets/spaceships/destroyer.png');
    game.load.image('background', 'assets/starstars.jpg');
    game.load.image('asteroid1', 'assets/asteroid1.png');
    game.load.spritesheet('kaboom', 'assets/explode.png', 128, 128);
}


var cursors;
var fireButton;
var s;
var explosions;
var firingTimer = 0;
var asteroid;

function create() {
    socket.emit("screen_connected");

    s = game.add.tileSprite(0, 0, game.width, game.height, 'background');

    cursors = this.input.keyboard.createCursorKeys();

    fireButton = this.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

    socket.on('gamepadConnected', function (id) {
        console.log('Connected ' + id);
        addShip(id);
    });

    socket.on('gamepadDisconnected', function (id) {
        console.log('Connected ' + id);
        ships[id].kill();
        weapons[id].destroy();
        delete ships[id];
        delete weapons[id];
    });

    socket.on('padEvent', function (data) {
        handlePadEvent(data);
    });


    // The asteroids
    asteroids = game.add.group();
    asteroids.enableBody = true;
    asteroids.physicsBodyType = Phaser.Physics.ARCADE;
    asteroids.createMultiple(30, 'asteroid1');
    asteroids.setAll('anchor.x', 0.5);
    asteroids.setAll('anchor.y', 1);
    asteroids.setAll('outOfBoundsKill', true);
    asteroids.setAll('checkWorldBounds', true);

    // An explosion pool
    explosions = game.add.group();
    explosions.createMultiple(100, 'kaboom');
}

var ships = {};
var weapons = {};
function addShip(id) {

    //  Creates 30 bullets, using the 'bullet' graphic
    weapon = game.add.weapon(30, 'bullet');

    weapon.bullets.forEach(function (bullet) {
        bullet.scale.setTo(.5,.5);
    }, this);

    //  The bullet will be automatically killed when it leaves the world bounds
    weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;

    //  The speed at which the bullet is fired
    weapon.bulletSpeed = 600;

    //  Speed-up the rate of fire, allowing them to shoot 1 bullet every 60ms
    weapon.fireRate = 100;

    weapon.bulletAngleOffset = 90;

    sprite = game.add.sprite(game.width / 2, game.height - 50, 'ship');
    sprite.angle = -90;
    sprite.scale.setTo(.3, .3);

    createHealth(sprite);

    sprite.anchor.set(0.5);

    game.physics.arcade.enable(sprite);

    sprite.body.drag.set(70);
    sprite.body.maxVelocity.set(200);

    //  Tell the Weapon to track the 'player' Sprite
    //  With no offsets from the position
    //  But the 'true' argument tells the weapon to track sprite rotation
    weapon.trackSprite(sprite, 0, 0, true);
    weapon.fireAngle = -90;

    ships[id] = sprite;
    weapons[id] = weapon;
}


function handlePadEvent(data) {
    if (data['code'] == 0x130) {
        console.log('Fire!');
        weapons[data['id']].fire()
    }
}

var acceleration = 0;
function update() {
    // if (cursors.up.isDown)
    // {
    //     game.physics.arcade.accelerationFromRotation(sprite.rotation, 300, sprite.body.acceleration);
    // }
    // else
    // {
    //     sprite.body.acceleration.set(0);
    // }
    //
    // if (cursors.left.isDown)
    // {
    //     sprite.body.angularVelocity = -300;
    // }
    // else if (cursors.right.isDown)
    // {
    //     sprite.body.angularVelocity = 300;
    // }
    // else
    // {
    //     sprite.body.angularVelocity = 0;
    // }
    //
    // if (fireButton.isDown)
    // {
    //     weapon.fire();
    // }
    //
    // game.world.wrap(sprite, 16);

    if (game.time.now > firingTimer) {
        asteroidShooter();
    }


    // run collision
    for (var id in ships) {
        game.world.wrap(ships[id], 16);
        game.physics.arcade.overlap(weapons[id].bullets, asteroids, bulletsHitAsteroid, null, this);
        game.physics.arcade.overlap(ships[id], asteroids, asteroidHitsShip, null, this);
    }

}

function asteroidShooter () {

    //  Grab the first bullet we can from the pool
    asteroid = asteroids.getFirstExists(false);

    if (asteroid)
    {
        // Randomize which edges of the game the astroids shoot from
        var edge = game.rnd.integerInRange(1,4);
        if (edge === 1) {
            asteroid.reset(game.rnd.integerInRange(0, game.width), game.rnd.integerInRange(-10, 0));
        } else if (edge == 2) {
            asteroid.reset(game.rnd.integerInRange(game.width, game.width+10), game.rnd.integerInRange(0, game.height));
        } else if (edge == 3) {
            asteroid.reset(game.rnd.integerInRange(0, game.width), game.rnd.integerInRange(game.height, game.height+10));
        } else {
            asteroid.reset(game.rnd.integerInRange(-10, 0), game.rnd.integerInRange(0, game.height));
        }

        game.physics.arcade.moveToXY(asteroid, game.rnd.integerInRange(0, game.width), game.rnd.integerInRange(0, game.height));
        firingTimer = game.time.now + 1000;
    }

}

function asteroidHitsShip (ship,asteroid) {

    // create an explosion
    var explosion = explosions.getFirstExists(false);
    explosion.animations.add('kaboom');
    explosion.reset(ship.body.x, ship.body.y);
    explosion.play('kaboom', 30, false, true);
    console.log(ship.health);
    deplete(ship);
    asteroid.kill();

}

function bulletsHitAsteroid (bullets, asteroid) {
    console.log('collision!');
    bullets.kill();
    asteroid.kill();
}

function createHealth(sprite){
    var bmd = this.game.add.bitmapData(300, 40);
    bmd.ctx.beginPath();
    bmd.ctx.rect(0, 0, 300, 80);
    bmd.ctx.fillStyle = '#00685e';
    bmd.ctx.fill();

    bmd = this.game.add.bitmapData(280, 30);
    bmd.ctx.beginPath();
    bmd.ctx.rect(0, 0, 300, 80);
    bmd.ctx.fillStyle = '#00f910';
    bmd.ctx.fill();
    
    this.widthLife = new Phaser.Rectangle(0, 0, bmd.width, bmd.height);
    this.totalLife = bmd.width;
    
    var health = this.game.add.sprite(0 - this.game.world.centerX/2 - 50,  0- this.game.world.centerY/2 , bmd);
    health.anchor.y = 0.5;
    health.cropEnabled = true;
    health.crop(this.widthLife);
    health.angle = 90;    
    // game.time.events.loop(1500, cropLife, this);
    sprite.addChild(health);

  }

  // decrease health
  function deplete(sprite){
    var newWidth = sprite.children[0].width - 20;
    if (newWidth <= 0) {
        sprite.children[0].kill();
        sprite.kill();
    } else {
        sprite.children[0].width = newWidth;
    }
  };

 // ????
function cropLife(){
    if(this.widthLife.width <= 0){
      this.widthLife.width = this.totalLife;
    }
    else{
      this.game.add.tween(this.widthLife).to( { width: (this.widthLife.width - (this.totalLife / 10)) }, 200, Phaser.Easing.Linear.None, true);
    }
}

function render() {

    // weapon.debug();

}