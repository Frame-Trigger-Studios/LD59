import {AnimatedSprite, Entity, Game, RectSatCollider, Sprite} from "lagom-engine";
import {Layers} from "./LD59";

export class LandingPad extends Entity {
    constructor(x: number, y: number, readonly sprIndex: number) {
        super("landing pad", x, y, Layers.PAD);
    }

    onAdded() {
        super.onAdded();

        if (this.sprIndex === 3) {
            this.addComponent(new AnimatedSprite(Game.resourceLoader.get("landing_pad").tileSlice(3, 4), {
                yOffset: -8,
                xAnchor: 0.5,
                yAnchor: 0.5,
                animationSpeed: 400
            }))
        } else {
            this.addComponent(new Sprite(Game.resourceLoader.get("landing_pad").tileIdx(this.sprIndex), {
                yOffset: -8,
                xAnchor: 0.5,
                yAnchor: 0.5
            }))
        }
        this.addComponent(new RectSatCollider({layer: Layers.PAD, xOff: -8, yOff: 0, width: 16, height: 8}))
    }
}