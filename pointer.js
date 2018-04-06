export function makePointer(element, scale = 1) {
    let pointer = {
        element: element,
        scale: scale,
        _x: 0,
        _y: 0,
        get x() {
            return this._x / this.scale;
        },
        get y() {
            return this._y / this.scale;
        },
        get centerX() {
            return this.x;
        },
        get centerY() {
            return this.y;
        },
        isDown: false,
        isUp: true,
        tapped: false,
        downTime: 0,
        elapsedTime: 0,
        press: undefined,
        release: undefined,
        tap: undefined,
        moveHandler(event) {
            let element = event.target;
            this._x = (event.pageX - element.offsetLeft);
            this._y = (event.pageY - element.offsetTop);
            event.preventDefault();
        },
        touchMoveHandler(event) {
            //TODO
        },
        downHandler(event) {
            this.isDown = true;
            this.isUp = false;
            this.tapped = false;
            this.downTime = Date.now();
            if (this.press) this.press();
            event.preventDefault();
        },
        touchStartHandler(event) { /*TODO*/ },
        upHandler(event) {
            this.elapsedTime = Math.abs(this.downTime - Date.now());
            // if it's less than 200 ms then it can be potentially be a tap
            this.isUp = true;
            this.isDown = false;
            if (this.release) this.release();
            event.preventDefault();
        }
    };

    element.addEventListener("mousemove", pointer.moveHandler.bind(pointer), false);
    element.addEventListener("mousedown", pointer.moveHandler.bind(pointer), false);
    window.addEventListener("mouseup", pointer.upHandler.bind(pointer), false);


    element.style.touchAction = "none";
    return pointer;
}
