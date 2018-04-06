import {Circle, Rectangle, Group, DisplayObject, render, Line, makeCanvas} from "./index.js";

function rotateSprite(rotatingSprite, centerSprite, distance, angle) {
    rotatingSprite.x = centerSprite.centerX - rotatingSprite.parent.x
        + ( distance * Math.cos(angle))
        - rotatingSprite.halfWidth;
    rotatingSprite.y = centerSprite.centerY - rotatingSprite.parent.y
        + (distance * Math.sin(angle))
        - rotatingSprite.halfWidth;
}

let box, ball, canvas, stage;

function setup() {
    canvas = makeCanvas(256, 256);

    stage = new DisplayObject();

    stage.width = canvas.width;
    stage.height = canvas.height;

    box = new Rectangle(32, 32 ,"gray");
    stage.addChild(box);
    stage.putCenter(box, 32, -48);

    ball = new Circle(32, "gray");
    stage.addChild(ball);
    box.putLeft(ball, -32);
    ball.angle = 0;
    gameLoop();
}


function gameLoop() {
    requestAnimationFrame(gameLoop);
    ball.angle += 0.05;
    rotateSprite(ball, box, 48, ball.angle);
    render(canvas, stage);
}
setup();