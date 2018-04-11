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

export function shoot(shooter, angle, offsetFromCenter, bulletSpeed, bulletArray, bulletSprite) {
    let bullet = bulletSprite();
    bullet.x = shooter.centerX - bullet.halfWidth + (offsetFromCenter * Math.cos(angle));
    bullet.y = shooter.centerY - bullet.halfHeight + (offsetFromCenter * Math.sin(angle));
    bullet.vx = Math.cos(angle) * bulletSpeed;
    bullet.vy = Math.sin(angle) * bulletSpeed;

    bulletArray.push(bullet);
    return bullet;
}

export function remove(...spritesToRemove) {
    spritesToRemove.forEach(sprite => {
        sprite.parent.removeChild(sprite);
    });
}
