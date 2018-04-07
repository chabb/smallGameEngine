import {Circle, DisplayObject, Rectangle, Group, render, Line, makeCanvas} from './sprites.js';
import {keyboard} from './keyboard.js';
import {shoot} from './utility.js';

function setup() {
    let canvas = makeCanvas(600, 600);
    let stage = new DisplayObject();
    let box = new Rectangle(32, 32 ,'gray');
    let turret = new Line('red', 4, 0, 0, 32, 0);
    let tank;
    let bullets = [];

    turret.x = 16;
    turret.y = 16;
    tank = new Group(box, turret);
    //stage.addChild(box);
    //stage.addChild(turret);
    stage.addChild(tank);
    stage.putCenter(tank);

    tank.vx = 0;
    tank.vy = 0;
    tank.ax = 0.2;
    tank.ay = 0.2;
    tank.frictionX = 0.96;
    tank.frictionY = 0.96;

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
        window.requestAnimationFrame(gameLoop);
        tank.rotation += tank.rotationSpeed;
        if (tank.moveForward) {
            tank.vx += tank.ax * Math.cos(tank.rotation);
            tank.vy += tank.ay * Math.sin(tank.rotation);

        } else {
            tank.vx *= tank.frictionX;
            tank.vy *= tank.frictionY;
        }


        tank.x += tank.vx;
        tank.y += tank.vy;

        bullets = bullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;

            let collision = false;
            if (collision) {
                return false;
            }

            return true;
        });
        console.log(bullets);

        render(canvas, stage)
    }
}

setup();
