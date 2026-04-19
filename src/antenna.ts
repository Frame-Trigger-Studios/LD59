import {
    Button,
    CircleSatCollider,
    Component,
    Entity,
    Game,
    GlobalSystem,
    LagomType,
    MathUtil,
    RectSatCollider,
    Sprite,
    Timer
} from "lagom-engine";
import {Layers} from "./LD59";

export class RotateToPlayerSprite extends Sprite {
}

export class Antenna extends Entity {

    constructor(x: number, y: number, depth: number, readonly rot: number) {
        super("antenna", x, y, depth);
    }

    onAdded() {
        this.addComponent(new Sprite(Game.resourceLoader.get("antenna").tileIdx(0), {
            xAnchor: 0.5,
            yAnchor: 0.5,
            rotation: MathUtil.degToRad((this.rot + 2) * 90)
        }));
        this.addComponent(new RotateToPlayerSprite(Game.resourceLoader.get("antenna").tileIdx(1), {
            xAnchor: 0.5,
            yAnchor: 0.5,
            rotation: MathUtil.degToRad((this.rot + 2) * 90)
        }));
        this.addComponent(new CircleSatCollider({layer: Layers.ANTENNA_OBJ, radius: 8}))
    }
}

class HoverSprite extends Sprite {
}

export class MouseTracker extends Entity {

    snapDir: number | null = null;

    onAdded() {
        super.onAdded();

        this.addComponent(new HoverSprite(Game.resourceLoader.get("antenna").tileIdx(0), {
            alpha: 0.5,
            xAnchor: 0.5,
            yAnchor: 0.5,
            xOffset: 8,
            yOffset: 8
        }));

        // Add colliders for the blocks surrounding us so we know what to snap to.
        let c = this.addComponent(new CircleSatCollider({
            layer: Layers.ANTENNA_PROBING,
            radius: 2,
            xOff: 8,
            yOff: -8
        }));
        c.onTriggerWithLayer(Layers.SOLIDS, (caller, data) => {
            if (data.other instanceof RectSatCollider) {
                this.snapDir = 0;
            }
        });
        c.onTriggerExitWithLayer(Layers.SOLIDS, (caller, data) => {
            if (data.other instanceof RectSatCollider && this.snapDir === 0) {
                this.snapDir = null;
            }
        });
        c = this.addComponent(new CircleSatCollider({
            layer: Layers.ANTENNA_PROBING,
            radius: 2,
            xOff: 8,
            yOff: 24
        }));
        c.onTriggerWithLayer(Layers.SOLIDS, (caller, data) => {
            if (data.other instanceof RectSatCollider) {
                this.snapDir = 2;
            }
        });
        c.onTriggerExitWithLayer(Layers.SOLIDS, (caller, data) => {
            if (data.other instanceof RectSatCollider && this.snapDir === 2) {
                this.snapDir = null;
            }
        });
        c = this.addComponent(new CircleSatCollider({
            layer: Layers.ANTENNA_PROBING,
            radius: 2,
            yOff: 8,
            xOff: -8
        }));

        c.onTriggerWithLayer(Layers.SOLIDS, (caller, data) => {
            if (data.other instanceof RectSatCollider) {
                this.snapDir = 3;
            }
        });
        c.onTriggerExitWithLayer(Layers.SOLIDS, (caller, data) => {
            if (data.other instanceof RectSatCollider && this.snapDir === 3) {
                this.snapDir = null;
            }
        });
        c = this.addComponent(new CircleSatCollider({
            layer: Layers.ANTENNA_PROBING,
            radius: 2,
            yOff: 8,
            xOff: 24
        }));
        c.onTriggerWithLayer(Layers.SOLIDS, (caller, data) => {
            if (data.other instanceof RectSatCollider) {
                this.snapDir = 1;
            }
        });
        c.onTriggerExitWithLayer(Layers.SOLIDS, (caller, data) => {
            if (data.other instanceof RectSatCollider && this.snapDir === 1) {
                this.snapDir = null;
            }
        });

        this.scene.addFnSystem([HoverSprite], (delta, entity, sprite) => {
            // TODO engine: fix canvas pos when the game is scaled
            const pos = Game.mouse.canvasPos().divide(2);

            // if we are adjacent to a full block but inside an angled block this will show that placement is valid but
            // it won't actually allow it.
            if (this.snapDir === null) {
                sprite.applyConfig({alpha: 0.3})
            } else {
                sprite.applyConfig({alpha: 0.8, rotation: MathUtil.degToRad((this.snapDir + 2) * 90)})
            }

            // snap to grid
            const x = Math.floor(pos.x / 16) * 16 + 8;
            const y = Math.floor(pos.y / 16) * 16 + 8;
            entity.transform.x = x - 8;
            entity.transform.y = y - 8;

            if (Game.mouse.isButtonPressed(Button.LEFT) && this.snapDir !== null) {
                entity.scene.addEntity(new ClickDetector(x, y, this.snapDir));
            }
        });
    }
}

class ClickDetector extends Entity {

    constructor(x: number, y: number, readonly snapDir: number) {
        super("clickDetector", x, y);
    }

    onAdded() {
        // Antenna exists, delete it.
        const coll = this.addComponent(new CircleSatCollider({radius: 2, layer: Layers.CLICK}));
        coll.onTrigger.register((caller, data) => {
            if (data.other.layer === Layers.SOLIDS) {
                this.destroy();
            }
            if (data.other.layer === Layers.ANTENNA_OBJ) {
                data.other.parent.destroy();
                this.destroy();
            }
        });

        // If this triggers, there wasn't an antenna here
        this.addComponent(new Timer(50, coll, false)).onTrigger.register((caller, data) => {
            data.destroy();
            this.getScene().addEntity(new Antenna(this.transform.x, this.transform.y, Layers.ANTENNA_OBJ, this.snapDir));
            this.destroy();
        })
    }
}

export class AntennaRotator extends GlobalSystem<[RotateToPlayerSprite[]]> {
    types: LagomType<Component>[] = [RotateToPlayerSprite];

    update(delta: number): void {
        const player = this.getScene().getEntityWithName("lander");
        if (player === null) {
            return;
        }
        this.runOnComponents(sprites => {
            sprites.forEach(sprite => {
                const dist = MathUtil.pointDistance(sprite.parent.transform.x, sprite.parent.transform.y,
                    player.transform.x, player.transform.y);
                const rot = sprite.pixiObj.rotation;

                // TODO we could use the LOS stuff too?
                // TODO fix this value when it is known
                if (dist < 100) {
                    const target = MathUtil.degToRad(90) + MathUtil.pointDirection(player.transform.x, player.transform.y, sprite.parent.transform.x, sprite.parent.transform.y);
                    sprite.applyConfig({rotation: MathUtil.angleLerp(rot, -target, delta * 0.01)})
                } else {
                    sprite.applyConfig({rotation: MathUtil.angleLerp(rot, rot + 0.3, delta * 0.01)})
                }
            })
        })
    }
}