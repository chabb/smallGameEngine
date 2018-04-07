export class DisplayObject {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.rotation = 0;
        this.alpha = 1;
        this.visible = true;
        this.scaleX = 1;
        this.scaleY = 1;
        this.pivotX = 0.5;
        this.pivotY = 0.5;
        this.vx = 0;
        this.vy = 0;
        this._layer = 0;
        this.children = [];
        this.parent = undefined;
        this.shadow = false;
        this.shadowColor = 'rgba(100, 0100, 100, 0.5)';
        this.shadowOffsetX = 0.3;
        this.shadowOffsetY = 0.3;
        this.blendMode = undefined;
        this.frames = [];
        this.loop = true;
        this._currentFrame = 0;
        this.playing = false;

        this._draggable = undefined;
        this._circular = false;
        this._interactive = false;
    }

    get circular() {
        return this._circular;
    }

    set circular(value) {
        if (value === true && this._circular === false) {
            Object.defineProperties(this, {
               diameter: {
                   get() {
                       return this.width;
                   },
                   set(value) {
                       this.width = value;
                       this.height = value;
                   },
                   enumerable: true, configurable: true
               },
                radius: {
                    get() {
                        return this.halfWidth
                    },
                    set(value) {
                        this.width = value * 2;
                        this.height = value * 2;
                    }, enumerable: true, configurable: true
                }
            });
            this._circular = true;
        }

        if (value === false && this._circular === true) {
            delete this.diameter;
            delete this.radius;
            this._circular = false;
        }
    }

    putCenter(b, xOffset = 0, yOffset = 0) {
        let a = this;
        b.x = (a.x + a.halfWidth - b.halfWidth) + xOffset;
        b.y = (a.y + a.halfHeight - b.halfHeight) + yOffset;
    }

    putTop(b, xOffset = 0, yOffset = 0) {
        let a = this;
        b.x = (a.x + a.halfWidth - b.halfWidth) + xOffset;
        b.y = (a.y - b.height) + yOffset;
    }
    putLeft(b, xOffset = 0, yOffset = 0) {
        let a = this;
        b.x = (a.x - b.width) + xOffset;
        b.y = (a.y + a.halfHeight - b.halfHeight) + yOffset;
    }

    putBottom(b, xOffset = 0, yOffset = 0) {
        let a = this;
        b.x = (a.x + a.halfWidth - b.halfWidth) + xOffset;
        b.y = (a.y + b.height) + yOffset;

    }

    get gx() {
        if (this.parent) {
            return this.x + this.parent.gx;
        } else {
            return this.x;
        }
    }
    get gy() {
        if (this.parent) {
            return this.y + this.parent.gy;
        } else {
            return this.y;
        }
    }

    get layer() {
        return this._layer;
    }
    set layer(value) {
        this._layer = value;
        if (this.parent) {
            // sort according to layer order
            this.parent.children.sort((a, b) => a.layer - b.layer);
        }
    }
    addChild(sprite) {
        if (sprite.parent) {
            sprite.parent.removeChild(sprite)
        }
        sprite.parent = this;
        this.children.push(sprite)
    }

    removeChild(sprite) {
        if (sprite.parent) {
            this.children.splice(this.children.indexOf(sprite), 1);
        } else {
            throw new Error(sprite + 'is not a child of ' + this);
        }
    }

    get halfWidth() {
        return this.width / 2;
    }

    get halfHeight() {
        return this.height / 2;
    }

    get centerX() {
        return this.x + this.halfWidth;
    }

    get centerY() {
        return this.y + this.halfHeight;
    }

    get currentFrame() {
        return this._currentFrame;
    }


    // a few things are missing
}

export function render(canvas, stage) {
    let ctx = canvas.ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stage.children.forEach(sprite => {
        displaySprite(sprite);
    });

    function displaySprite(sprite) {
        if (sprite.visible && sprite.gx < canvas.width
            && sprite.gx + sprite.width >= -sprite.width
            && sprite.gy < canvas.height + sprite.height
            && sprite.gy + sprite.height >= -sprite.height
        ) {
            ctx.save();

            // pivot is the pivot point of the sprite, expressed in percent
            ctx.translate(sprite.x + (sprite.width * sprite.pivotX),
                sprite.y + (sprite.height * sprite.pivotY));
            ctx.rotate(sprite.rotation);
            ctx.globalAlph = sprite.alpha * sprite.parent.alpha;
            ctx.scale(sprite.scaleX, sprite.scaleY);
            if (sprite.shadow) {
                //TODO( shadow )
            }
            if (sprite.blendMode) {
                ctx.globalCompositeOperation = sprite.blendMode;
            }
            if (sprite.render) {
                sprite.render(ctx);
            }
            if (sprite.children && sprite.children.length > 0) {
                // reset context to top of parent
                ctx.translate(-sprite.width * sprite.pivotX, -sprite.height * sprite.pivotY);
                sprite.children.forEach(child => {
                    displaySprite(child);
                })
            }
        }

        ctx.restore();
    }
}

export class Rectangle extends DisplayObject {
    constructor(width = 32, height = 32, strokeStyle = 'none', fillStyle = 'gray', lineWidth = 0, x = 0, y = 0) {
        super();
        Object.assign(this, {width, height, fillStyle, strokeStyle, lineWidth, x, y});
        this.mask = false;
    }
    render(ctx) {
        ctx.strokeStyle = this.strokeStyle;
        ctx.lineWidth = this.lineWidth;
        ctx.fillStyle = this.fillStyle;
        ctx.beginPath();
        // notice how we render above the pivot point
        ctx.rect(-this.width * this.pivotX, -this.height * this.pivotY, this.width, this.height);
        if (this.strokeStyle !== 'none')  ctx.stroke();
        if (this.fillStyle !== 'none') ctx.fill();
        if (this.mask && this.mask === true) ctx.clip();
    }

}
export class Line extends DisplayObject {
    constructor(
        strokeStyle = 'none',
        lineWidth = 0,
        ax = 0,
        ay = 0,
        bx = 32,
        by = 32
    ){
        super();
        Object.assign(
            this, {strokeStyle, lineWidth, ax, ay, bx, by}
        );
        this.lineJoin = 'round';
    }

    render(ctx) {
        ctx.strokeStyle = this.strokeStyle;
        ctx.lineWidth = this.lineWidth;
        ctx.lineJoin = this.lineJoin;
        ctx.beginPath();
        ctx.moveTo(this.ax, this.ay);
        ctx.lineTo(this.bx, this.by);
        if (this.strokeStyle !== 'none')  ctx.stroke();
        if (this.strokeStyle !== 'none') ctx.stroke();
    }
}




export class Circle extends DisplayObject {
    constructor(
        diameter = 32,
        fillStyle = 'gray',
        strokeStyle = 'black',
        lineWidth = 0,
        x = 0,
        y = 0
    ) {
        super();
        this.circular = true;
        Object.assign(this, {diameter, fillStyle, strokeStyle, lineWidth, x, y});
        this.mask = false;

    }
    render(ctx) {

        // we could have a prepare context method
        ctx.strokeStyle = this.strokeStyle;
        ctx.lineWidth = this.lineWidth;
        ctx.fillStyle = this.fillStyle;
        ctx.beginPath();
        ctx.arc(this.radius + (-this.diameter * this.pivotX),
            this.radius + (-this.diameter * this.pivotY),
            this.radius,
            0, 2 * Math.PI,
            false)

        if (this.strokeStyle !== 'none')  ctx.stroke();
        if (this.fillStyle !== 'none') ctx.fill();
        if (this.mask && this.mask === true) ctx.clip();
    }
}


// a group must be able to compute its height/width on the fly
export class Group extends DisplayObject {

    constructor(...spritesToGroup) {
        super();
        spritesToGroup.forEach(sprite => this.addChild(sprite));
    }

    addChild(sprite) {
        if (sprite.parent) {
            sprite.parent.removeChild(sprite);
        }
        sprite.parent = this;
        this.children.push(sprite);
        this.calculateSize();
    }
    removeChild(sprite) {
        if(sprite.parent === this) {
            this.children.splice(this.children.indexOf(sprite), 1);
            this.calculateSize();
        } else {
            throw new Error(`${sprite} not a child of ${this}`);
        }
    }

    calculateSize() {
        if (this.children.length > 0) {
            this._newHeight = 0;
            this._newWidth = 0;
            this.children.forEach(child => {
                if (child.x + child.width > this._newWidth) {
                    this._newWidth = child.x + child.width;
                }
                if (child.y + child.height > this._newHeight) {
                    this._newHeight = child.y + child.height;
                }
            });
        }
        this.width = this._newWidth;
        this.height = this._newHeight;
    }
}

// should be able to create multiple frames from texture class
export class Sprite extends DisplayObject {

}


export function makeCanvas(width = 256, heigth = 256, border = '1px dashed black', backgroundColor = 'white') {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = heigth;
    canvas.style.border = border;
    canvas.style.backgroundColor = backgroundColor;
    document.body.appendChild(canvas);
    // not a good practice;
    canvas.ctx = canvas.getContext('2d');
    return canvas;
}
