import {Entity, RenderRect} from "lagom-engine";

export class Antenna extends Entity {

    constructor(x: number, y: number, depth: number) {
        super("antenna", x, y, depth);
    }

    onAdded() {
        this.addComponent(new RenderRect({width: 10, height: 30}, 0xff0000, 0x000000));
    }
}