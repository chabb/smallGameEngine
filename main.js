import {Circle, DisplayObject, Rectangle, Group, render, Line, makeCanvas} from './sprites.js';
import {keyboard} from './keyboard.js';
import {shoot} from './utility.js';
import {hit} from './collision.js';

let width = 900;
let height = 900;
let stage, canvas;

let playerBox;

function makeGunTurret() {
    let x = Math.floor(Math.random() * width);
    let y = Math.floor(Math.random() * height);
    let rotationSpeed = Math.random() * 0.5;

    let box = new Rectangle(32, 32 ,'gray', 'black');
    let turret = new Line('red', 4, 0, 0, 32, 0);
    let gunTurret = new Group(box, turret);
    turret.x = 16;
    turret.y = 16;
    gunTurret.rotationSpeed = rotationSpeed;
    gunTurret.rotation = Math.random() * Math.PI;
    stage.addChild(gunTurret);
    gunTurret.x = x;
    gunTurret.y = y;

    // shitty because depens on frame rates :(
    gunTurret.firingRate =  40 + Math.floor(Math.random() * 30);

    return gunTurret;
}


function setup() {
    let frames = 0;
    canvas = makeCanvas(width, height);
    stage = new DisplayObject();
    stage.width = width;
    stage.height = height;
    let box = new Rectangle(32, 32 ,'gray');
    let turret = new Line('red', 4, 0, 0, 32, 0);
    let tank;
    let bullets = [];
    let foeBullets = [];

    playerBox = box;
    let gunTurrets = [];
    for (let i = 0; i < 8; i++) {
        gunTurrets.push(makeGunTurret());
    }

    turret.x = 16;
    turret.y = 16;
    tank = new Group(box, turret);
    //stage.addChild(box);
    //stage.addChild(turret);
    stage.addChild(tank);
    stage.putCenter(tank);

    tank.vx = 0;
    tank.vy = 0;
    tank.ax = 0.1;
    tank.ay = 0.1;
    tank.friction = 0.96;
    tank.speed = 0;

    tank.rotationSpeed = 0;
    tank.moveForward = false;

    let leftArrow = keyboard(37), rightArrow = keyboard(39), upArrow = keyboard(38);
    let space = keyboard(32);

    space.press = () => {
       let bullet = shoot(tank, tank.rotation, 32, 7, bullets, () => new Circle(8, 'red'));
       stage.addChild(bullet);
    };

    leftArrow.press = () => tank.rotationSpeed = -0.1;
    leftArrow.release = () => {
        if (!rightArrow.isDown) tank.rotationSpeed = 0;
    };
    rightArrow.press = () => tank.rotationSpeed = 0.1;
    rightArrow.release = () => {
        if (!leftArrow.isDown) tank.rotationSpeed = 0;
    };

    upArrow.press = () => tank.moveForward = true;
    upArrow.release = () => tank.moveForward = false;

    gameLoop();

    function gameLoop() {
        frames++;
        window.requestAnimationFrame(gameLoop);
        tank.rotation += tank.rotationSpeed;
        if (tank.moveForward) {
            tank.speed += 0.1;
        } else {
            tank.speed *= tank.friction;
        }

        tank.ax = tank.speed * Math.cos(tank.rotation);
        tank.ay = tank.speed * Math.sin(tank.rotation);

        tank.vx = tank.ax;
        tank.vy = tank.ay;

        tank.x += tank.vx;
        tank.y += tank.vy;

        gunTurrets.forEach(turret =>  {
            if (frames % turret.firingRate === 0) {
                let bullet = shoot(turret, turret.rotation, 32, 4, foeBullets, () => new Circle(8, 'black'));
                stage.addChild(bullet);
            }

            turret.rotation += turret.rotationSpeed;

        });

        foeBullets = foeBullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            let collision = outsideBounds(bullet, stage.localBounds);
            if (collision) {
                stage.removeChild(bullet);
                return false;
            }
            let hitPlayer = hit(tank, bullet);
            if (hitPlayer) {
                playerBox.width = box.width - 0.5;
                playerBox.height = box.height - 0.5;
                stage.removeChild(bullet);
                return false;
            }

            return true;
        });


        bullets = bullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;

            let collision = outsideBounds(bullet, stage.localBounds);
            if (collision) {
                stage.removeChild(bullet);
                return false;
            }
            let hitFoes = hit(bullet, gunTurrets, false, false, false,
                (collision, sprite) => {
                    stage.removeChild(sprite);
                    stage.removeChild(bullet);
                    gunTurrets.splice(gunTurrets.indexOf(sprite), 1);
                });
            return !hitFoes;
        });

        render(canvas, stage)
    }
}
function outsideBounds(sprite, bounds, extra = undefined) {
    let x = bounds.x, y = bounds.y, width = bounds.width, height = bounds.height;
    let collision = false;
    if ( sprite.x < x - sprite.width ) {
        collision = 'left';
    } else if (sprite.y < y - sprite.height) {
        collision = 'top';
    } else if (sprite.x > width) {
        collision = 'right';
    } else if (sprite.y > height) {
        collision = 'bottom';
    }
    if (extra) {
        extra(collision);
    }
    return collision;
}
setup();
