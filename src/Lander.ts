import {Entity, Game, Sprite} from "lagom-engine";

export class Lander extends Entity {

    constructor(x: number, y: number) {
        super("lander", x, y);
    }


    onAdded() {
        super.onAdded();

        this.addComponent(new Sprite(Game.resourceLoader.get("lander").tileIdx(0)));
    }
}