import {Circle, Rectangle, Group, DisplayObject, render, Line, makeCanvas} from "./sprites.js";

export function findAngle(s1, s2) {
    return Math.atan2(s2.centerY - s1.centerY, s2.centerX - s1.centerX)
}


export function rotateSprite(rotatingSprite, centerSprite, distance, angle) {
    rotatingSprite.x = centerSprite.centerX - rotatingSprite.parent.x
        + ( distance * Math.cos(angle))
        - rotatingSprite.halfWidth;
    rotatingSprite.y = centerSprite.centerY - rotatingSprite.parent.y
        + (distance * Math.sin(angle))
        - rotatingSprite.halfWidth;
}

let box, ball, canvas, stage, balls = [];

function setup() {
    canvas = makeCanvas(256, 256);

    stage = new DisplayObject();

    stage.width = canvas.width;
    stage.height = canvas.height;

    box = new Rectangle(32, 32 ,"gray");
    stage.addChild(box);
    stage.putCenter(box, 0, 0);

    ball = new Circle(32, "gray");

    balls[0] = new Circle(32, "red");
    balls[1] = new Circle(30, "cyan");
    balls[2] = new Circle(28, "green");
    balls[3] = new Circle(26, "gray");
    stage.addChild(ball);

    ball.addChild(balls[0]);
    ball.addChild(balls[1]);
    balls[0].addChild(balls[2]);

    balls[0].putLeft(ball, -120);
    balls[1].putLeft(ball, 100, 140);
    balls[2].putLeft(ball, 70, 140);
    balls[0].angle = 0;
    balls[1].angle = Math.PI / 2;
    balls[2].angle = Math.PI / 4;



    box.putLeft(ball, -32);
    ball.angle = 0;
    gameLoop();
}


function gameLoop() {
    requestAnimationFrame(gameLoop);
    ball.angle += 0.05;
    balls[0].angle += 0.05;
    balls[1].angle += 0.06;
    balls[2].angle += 0.07;

    rotateSprite(ball, box, 48, ball.angle);
    rotateSprite(balls[0], ball, 48, balls[0].angle);
    rotateSprite(balls[1], ball, 48, balls[1].angle);
    rotateSprite(balls[2], balls[0], 20, balls[2].angle);
    render(canvas, stage);
}
//setup();