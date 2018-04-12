/**
 *
 * Particle effect and particle emitters
 *
 */

import {Circle, Rectangle} from './sprites.js'
import {remove} from "./utility.js";


// I like this design, when the array is shared during the whole lifetime

export let particles = [];

export function particleEffect(
    x = 0,
    y = 0,
    spriteFunction = (idx) => {

        // TODO(chab) remove
        if (!stage) {
            stage = window.stage;
        }
        let c = new Rectangle(10, 10,'red');
        stage.addChild(c);
        return c;
    },
    numberOfParticles = 10,
    gravity = 0,
    randomSpacing = true,
    minAngle = 0,
    maxAngle = 6.28, // 2 * Math.PI -> radians
    minSize = 10,
    maxSize = 30,
    minSpeed = 0.1, maxSpeed = 0.9,
    minScaleSpeed = 0.01, maxScaleSpeed = 0.05,
    minAlphaSpeed = 0.02, maxAlphaSpeed = 0.02,
    minRotationSpeed = 0.05, maxRotationSpeed = 0.1
) {
    let randomFloat = (min, max) => min + Math.random() * (max - min);
    let randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
    let angles = [];
    let angle;
    let spacing = (maxAngle - minAngle) / (numberOfParticles - 1);
    for (let i = 0; i < numberOfParticles; i ++) {
        if (randomSpacing) {
            angle = randomFloat(minAngle, maxAngle);
            angles.push(angle);
        } else {
            if (angle === undefined) angle = minAngle;
            angles.push(angle);
            angle += spacing;
        }
    }
    angles.forEach((angle,idx) => makeParticle(angle, idx));

    function makeParticle(angle, idx) {
        let particle = spriteFunction(idx, angles.length);
        if (particle.frames.length > 0) {
            // go thru frame
            particle.goToAndStop(randomInt(0, particle.frames.length) - 1)
        }
        particle.x = x - particle.halfWidth;
        particle.y = y - particle.halfHeight;
        let size = randomInt(minSize, maxSize);
        particle.width = size;
        particle.height = size;
        particle.scaleSpeed = randomFloat(minScaleSpeed, maxScaleSpeed);
        particle.alphaSpeed = randomFloat(minAlphaSpeed, maxAlphaSpeed);
        particle.rotationSpeed = randomFloat(minRotationSpeed, maxRotationSpeed);
        let speed = randomFloat(minSpeed, maxSpeed);
        particle.vx = speed * Math.cos(angle);
        particle.vy = speed * Math.sin(angle);

        particle.update = () => {
            particle.vy += gravity;
            particle.x += particle.vx;
            particle.y += particle.vy;
            if (particle.scaleX - particle.scaleSpeed > 0) {
                particle.scaleX -= particle.scaleSpeed;
            }
            if (particle.scaleY - particle.scaleSpeed > 0) {
                particle.scaleY -= particle.scaleSpeed;
            }
            particle.rotation += particle.rotationSpeed;
            particle.alpha -= particle.alphaSpeed;

            if (particle.alpha <= 0) {
                remove(particle);
                particles.splice(particles.indexOf(particle), 1);
            }
        };
        particles.push(particle)
    }
}

export function emitter(interval, particleFunction) {
    let emitter = {}, timerInterval = undefined;
    emitter.playing = false;

    function play() {
        if (!emitter.playing) {
            particleFunction();
            timerInterval = setInterval(emitParticle.bind(this), interval);
            emitter.playing = true;
        }
    }

    function stop() {
        if (emitter.playing) {
            clearInterval(timerInterval);
            emitter.playing = false;
        }
    }

    function emitParticle() {
        particleFunction();
    }
}
