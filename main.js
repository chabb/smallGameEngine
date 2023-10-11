import {Circle, DisplayObject, Rectangle, Group, render, Line, makeCanvas, grid} from './sprites.js';
import {keyboard} from './keyboard.js';
import {shoot} from './utility.js';
import {hit} from './collision.js';
import {particleEffect, particles} from "./particle.js";
import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js";

let width = 900;
let height = 900;
let stage, canvas;

let playerBox;

// ugly code to play music
let audioBuffer;
let context = new AudioContext();
let getSound = new XMLHttpRequest();
getSound.responseType = 'arraybuffer';
getSound.open("GET", "music.mp3", true);
getSound.onload = function() {
    context.decodeAudioData(getSound.response).then(buffer => {
        audioBuffer = buffer; // assign the buffer to a variable that can then be 'played'
        playSound();
    })
};
getSound.send();

function playSound() {
    let playSound = context.createBufferSource();
    playSound.buffer = audioBuffer;
    playSound.connect(context.destination);
    playSound.start(0)
}

function makeGunTurret({x, y, rotationSpeed, firingRate}) {
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
    gunTurret.firingRate = firingRate;

    return gunTurret;
}



// there is to way to implement rotation, either in the game engine, or we just update all the childs during the update
// implementing in the viewport

function setup() {
    let frames = 0;
    canvas = makeCanvas(width, height);
    stage = new DisplayObject();

    // TODO(chab) remove
    window.stage = stage;

    stage.currentPosition = {};
    stage.width = width;
    stage.height = height;
    stage.currentPosition.y = 0;
    stage.currentPosition.x = 0;
    stage.currentPosition.rotation = 0;

    let box = new Rectangle(32, 32 ,'gray');
    let turret = new Line('red', 4, 0, 0, 32, 0);
    let tank;
    let playerTanks = [];
    let bullets = [];
    let foeBullets = [];


    // background grid
    grid(50, 50, 50, 50, false, 0, 0 ,
        () => {
            let rectangle = new Rectangle(50, 50, 'grey', 'rgba(255, 1, 1, 0.1)');
            return rectangle;
        });

    playerBox = box;
    let gunTurrets = [];


    turret.x = 16;
    turret.y = 16;

    tank = createTank();

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
    upArrow.release = () => tank.moveForward = false

    const socket = io("http://localhost:3000");
    socket.on('connect', () => {
        console.log('socket connected', socket.id);
        socket.emit('register', { id: socket.id });
    });
    socket.on('registered', (id, callback) => {
        console.log('registered on server');
        callback();
    })

    socket.on('state', (state, callback) => {
        console.log('initial state', state)
        state.turrets.forEach(turret => gunTurrets.push(makeGunTurret(turret)));
        stage.addChild(tank);
        let offsetDirection = Math.random() > 0.5 ? 1 : -1;
        stage.putCenter(tank, state.player * 30 * offsetDirection, state.player * 30 * offsetDirection);
        callback();
    })

    socket.on('player', (state, callback) => {
        let newTank = createTank();
        playerTanks.push(newTank);
        stage.addChild(newTank);
        stage.putCenter(newTank);
        callback();
    });

    gameLoop();


    function createTank() {
        tank = new Group(box, turret);

        tank.vx = 0;
        tank.vy = 0;
        tank.ax = 0.1;
        tank.ay = 0.1;
        tank.friction = 0.96;
        tank.speed = 0;
        tank.debug = 'tank';

        tank.rotationSpeed = 0;
        tank.moveForward = false;
    }

    function updateTank(tankToUpdate) {
        tankToUpdate.rotation += tankToUpdate.rotationSpeed;
        if (tankToUpdate.moveForward) {
            tankToUpdate.speed += 0.1;
        } else {
            tankToUpdate.speed *= tankToUpdate.friction;
        }

        tankToUpdate.ax = tankToUpdate.speed * Math.cos(tankToUpdate.rotation);
        tankToUpdate.ay = tankToUpdate.speed * Math.sin(tankToUpdate.rotation);

        tankToUpdate.vx = tankToUpdate.ax;
        tankToUpdate.vy = tankToUpdate.ay;

        tankToUpdate.x += tankToUpdate.vx;
        tankToUpdate.y += tankToUpdate.vy;
    }

    function gameLoop() {
        frames++;
        window.requestAnimationFrame(gameLoop);
        updateTank(tank);
        playerTanks.forEach(tankToUpdate => updateTank(tankToUpdate));

        stage.currentPosition.x += tank.vx;
        stage.currentPosition.y += tank.vy;
        //stage.currentPosition.rotation += tank.rotationSpeed;

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
                // something is off there
                stage.removeChild(bullet);
                return false;
            }
            let hitPlayer = hit(tank, bullet);
            if (hitPlayer) {
                playerBox.width = box.width - 0.5;
                playerBox.height = box.height - 0.5;
                stage.removeChild(bullet);
                return false;
            } else {
                return true;
            }
        });


        bullets = bullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            let collision = outsideBounds(bullet, stage.localBounds);
            if (collision) {
                stage.removeChild(bullet);
                return false;
            }
            let hitFoes = false;
            // we need to manually update hitfoes in the callback coz we do not set it in the lib
            hit(bullet, gunTurrets, false, false, false,
                (collision, sprite) => {
                    hitFoes = true;
                    stage.removeChild(bullet);
                    stage.removeChild(sprite);
                    gunTurrets.splice(gunTurrets.indexOf(sprite), 1);
                    particleEffect(sprite.x,
                        sprite.y,
                        (idx, total) => {
                            // TODO(chab) remove
                            if (!stage) {
                                stage = window.stage;
                            }
                            let color = Math.floor( 60 + (idx / total) * 100);
                            let fill = `rgba(${color}, ${color}, ${color}, 1)`;
                            let c = new Rectangle(10, 10,'red', fill);
                            stage.addChild(c);
                            return c;
                        },
                        10,
                        0,
                        true,
                        0,
                        6.28, // 2 * Math.PI -> radians
                        6,
                        20,
                        0.4,
                        1.5,
                        0.01,
                        0.05,
                        0.02,
                        0.04,
                        sprite.rotationSpeed - 0.3, sprite.rotationSpeed + 0.3
                    )
                });

            return !hitFoes;
        });

        for (let i = particles.length - 1; i >= 0; i--) {
            // as we can potentially remove the particle, we iterate from the
            // end to avoid messing the iteration
            let particle = particles[i];
            particle.update();
        }

        render(canvas, stage)
    }
}
function outsideBounds(sprite, bounds, extra = undefined) {
    let x = bounds.x, y = bounds.y, width = bounds.width, height = bounds.height;


    let collision = false;
    if ( sprite.x - stage.currentPosition.x < x - sprite.width ) {
        collision = 'left';
    } else if (sprite.y - stage.currentPosition.y < y - sprite.height) {
        collision = 'top';
    } else if (sprite.x - stage.currentPosition.x > width) {
        collision = 'right';
    } else if (sprite.y  - stage.currentPosition.y > height) {
        collision = 'bottom';
    }
    if (extra) {
        extra(collision);
    }
    return collision;
}
setup();

// we can update the local bounds of the stage in the getter according to the current viewport !!
