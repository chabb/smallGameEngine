import {Circle, DisplayObject, Rectangle, Group, render, Line, makeCanvas, grid} from './sprites.js';
import {keyboard} from './keyboard.js';
import {shoot} from './utility.js';
import {hit} from './collision.js';
import {particleEffect, particles} from "./particle.js";

let stage, canvas;
let playerBox;
let tanksById = {};

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

export function setup(config, socket) {
    let width = config.width
    let height = config.height;
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


    const tank = createTank();
    let playerTanks = [];

    let bullets = [];
    let foeBullets = [];


    // background grid
    grid(50, 50, 50, 50, false, 0, 0 ,
        () => {
            let rectangle = new Rectangle(50, 50, 'grey', 'rgba(255, 1, 1, 0.1)');
            return rectangle;
        });

    let gunTurrets = [];

    let leftArrow = keyboard(37), rightArrow = keyboard(39), upArrow = keyboard(38);
    let space = keyboard(32);

    space.press = () => {
       let bullet = shoot(tank, tank.rotation, 32, 7, bullets, () => new Circle(8, 'red'));
       socket.emit('fireBullet', { id: tank.id });
       stage.addChild(bullet);
    };

    leftArrow.press = () => {
        tank.rotationSpeed = -0.1;
        socket.emit('rotateLeft', { id: tank. id})
    }
    leftArrow.release = () => {
        if (!rightArrow.isDown) {
            socket.emit('stopRotation', { id: tank.id})
            tank.rotationSpeed = 0;
        }
    };
    rightArrow.press = () => {
        tank.rotationSpeed = 0.1;
        socket.emit('rotateRight', { id: tank. id})
    }
    rightArrow.release = () => {
        if (!leftArrow.isDown) {
            socket.emit('stopRotation', { id: tank.id})
            tank.rotationSpeed = 0;
        }
    };

    upArrow.press = () => {
        socket.emit('forward', { id: tank.id})
        tank.moveForward = true;
    }

    upArrow.release = () => {
        socket.emit('stop', { id: tank.id})
        tank.moveForward = false
    }

    /// start
    socket.emit('register', { id: socket.id });

    socket.on('getState', ({id}, callback) => {
        console.log('GETTING STATE')
        let tanks = [...playerTanks ?? [], tank ?? []].map(tank => serializeTank(tank));
        callback(tanks);
    });

    socket.on('registered', ({id}, callback) => {
        tank.id = id;
        console.log('registered on server', tank);
        callback();
    })

    socket.on('state', (state, callback) => {
        // this is ONLY called when the game start
        console.log('[INITIAL STATE], received from server', state)
        state.turrets.forEach(turret => gunTurrets.push(makeGunTurret(turret)));
        // update player position and color
        tank.x = state.playerTank.x;
        tank.y = state.playerTank.y;
        tank.color = state.playerTank.playerColor;
        tank.children[0].strokeStyle = tank.color
        tank.children[1].fillStyle = tank.color;
        tank.id = state.playerTank.id;
        // add player
        stage.addChild(tank);
        // add already existing players
        state.playerTanks.forEach(tank => {
            console.log('[INITIAL STATE] Player tank on the field');
            let newTank = hydrateTank(tank);
            stage.addChild(newTank);
            playerTanks.push(newTank);
        });
        callback(tank.x, tank.y);
        // start game
        gameLoop();
    })

    socket.on('player', ({id, index, player}, callback) => {
        console.log('new player to display', player);
        let newTank = createTank();
        newTank.id = id;
        newTank.x = player.x;
        newTank.y = player.y;
        newTank.bulletColor = player.bulletColor;
        playerTanks.push(newTank);
        tanksById[id] = newTank;
        stage.addChild(newTank);
        console.log(playerTanks, tanksById);
    });

    // player actions are not acknowledged
    socket.on('rotateLeft', ({id}) => {
        tanksById[id].rotationSpeed = -0.1;
    });
    socket.on('rotateRight', ({id}) => {
        tanksById[id].rotationSpeed = 0.1;
    });

    socket.on('stopRotation', ({id}) => {
        tanksById[id].rotationSpeed = 0;
    });

    socket.on('stop', ({id}) => {
        tanksById[id].moveForward = false;
    });
    socket.on('forward', ({id}) => {
        tanksById[id].moveForward = true;
    });


    socket.on('fireBullet', ({id}) => {
        let tank = tanksById[id];
        // TODO handle bullet colors for each tank
        // TODO handle bullet collision for tank
        let bullet = shoot(tank, tank.rotation, 32, 7, bullets, () => new Circle(8, tank.bulletColor));
        stage.addChild(bullet);
    });

    function createTank(currentPlayer = true) {
        const box = new Rectangle(32, 32 ,'gray');
        const turret = new Line('red', 4, 0, 0, 32, 0);
        turret.x = 16;
        turret.y = 16;
        const tank = new Group(box, turret);
        tank.vx = 0;
        tank.vy = 0;
        tank.ax = 0.1;
        tank.ay = 0.1;
        tank.friction = 0.96;
        tank.speed = 0;
        tank.debug = 'tank';
        tank.rotationSpeed = 0;
        tank.moveForward = false;
        if (currentPlayer) {
            playerBox = box;
        }
        return tank
    }

    function hydrateTank(tank) {
        const box = new Rectangle(32, 32 ,'gray');
        const turret = new Line('red', 4, 0, 0, 32, 0);
        turret.x = 16;
        turret.y = 16;
        const newTank = new Group(box, turret);
        Object.entries(tank).forEach(([k,v]) => newTank[k] = v);
        tanksById[newTank.id] = newTank;
        console.log('Hydrated tank', newTank, tanksById);
        return newTank;
    }

    function serializeTank({alpha, ax, ay, friction, speed, rotationSpeed, moveForward, vx, vy, rotation,x, y, id}) {
        return {
            alpha,ax,ay,friction,speed,rotationSpeed,moveForward,vx,vy,rotation,x,y, id
        }
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
        // note that rAF only works on active frame, so you NEED two chrome windows
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
                // make rectange smaller
                playerBox.width = playerBox.width - 0.5;
                playerBox.height = playerBox.height - 0.5;
                // update center

                // replace turret on center
                tank.children[1].x = tank.children[1].x - 0.25;
                tank.children[1].y = tank.children[1].y - 0.25;
                // shorten turret
                tank.children[1].bx = tank.children[1].bx - 0.25;
                tank.children[1].lineWidth = tank.children[1].lineWidth - 0.125;
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

// we can update the local bounds of the stage in the getter according to the current viewport !!


