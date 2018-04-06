import {findAngle, rotateSprite} from "./utility.js";
import {Circle, DisplayObject, Rectangle} from "./sprites";



function setup() {
    let stage = new DisplayObject();
    let box = new Rectangle(32, 32 ,'gray');
    let turret = new Line('red', 4, 0, 0, 32, 0);
    turret.x = 16;
    turret.y = 16;
    tank = new Group(box, turret);
    stage.putCenter(tank);

    tank.vx = 0;
    tank.vy = 0;
    tank.ax = 0;
    tank.ay = 0;
    tank.frictionX = 0.96;
    tank.frictionY = 0.96;

    tank.rotationSpeed = 0;
    tank.moveForward = false;
}
