import {Entity, Game, RectSatCollider, RenderRect, Sprite} from "lagom-engine";
import {Layers} from "./LD59";

export class LandingPad extends Entity {
    constructor(x: number, y: number) {
        super("landing pad", x, y);
    }

    onAdded() {
        super.onAdded();

        this.addComponent(new Sprite(Game.resourceLoader.get("landing_pad").tileIdx(0), {xAnchor: 0.5, yAnchor: 0.5}))
        this.addComponent(new RectSatCollider({layer: Layers.PAD, xOff: -8, yOff: 6, width: 16, height: 2}))
    }
}