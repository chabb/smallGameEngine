import {findAngle, rotateSprite} from "./utility.js";
import {Circle, DisplayObject, Rectangle, Group, render, Line, makeCanvas} from "./sprites.js";
import {keyboard} from "./keyboard.js";

function setup() {
    let canvas = makeCanvas(600, 600);
    let stage = new DisplayObject();
    let box = new Rectangle(32, 32 ,'gray');
    let turret = new Line('red', 4, 0, 0, 32, 0);
    let tank;

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
        console.log(tank.ax, tank.ay, tank.vx, tank.vy);

        tank.x += tank.vx;
        tank.y += tank.vy;

        render(canvas, stage)
    }
}

setup();
