import {
    Button,
    CircleSatCollider,
    Component,
    Entity,
    Game,
    GlobalSystem,
    LagomType,
    MathUtil,
    PolySatCollider,
    RectSatCollider, RenderCircle,
    Sprite,
    Timer
} from "lagom-engine";
import {Layers, LD59} from "./LD59";
import {Connected} from "./Lander";

export class RotateToPlayerSprite extends Sprite {
    radDir = 0;
    connected = false;
}

class Probe extends PolySatCollider {
    dead = false;
}

export class Antenna extends Entity {

    static ANT_DIST = 100;
    constructor(x: number, y: number, readonly rot: number) {
        super("antenna", x, y, Layers.ANTENNA_OBJ);
    }

    onAdded() {
        this.addComponent(new Sprite(Game.resourceLoader.get("antenna").tileIdx(0), {
            xAnchor: 0.5,
            yAnchor: 0.5,
            rotation: MathUtil.degToRad((this.rot + 2) * 90)
        }));
        const rotator = this.addComponent(new RotateToPlayerSprite(Game.resourceLoader.get("antenna").tileIdx(1), {
            xAnchor: 0.5,
            yAnchor: 0.5,
            rotation: MathUtil.degToRad((this.rot + 2) * 90)
        }));
        this.addComponent(new CircleSatCollider({layer: Layers.ANTENNA_OBJ, radius: 8}))

        this.addComponent(new RenderCircle({radius: Antenna.ANT_DIST}));

        this.addComponent(new Timer(100, rotator, true)).onTrigger.register((caller, rotator) => {
            const player = this.getScene().getEntityWithName("lander");
            if (player === null) {
                return;
            }

            // Check distance to player
            const dist = MathUtil.pointDistance(caller.parent.transform.x, caller.parent.transform.y,
                player.transform.x, player.transform.y);

            // In range, spawn the line of sight checker
            if (dist < Antenna.ANT_DIST) {
                const probe = caller.parent.addComponent(new Probe({
                    layer: Layers.LOS_PROBE,
                    points: [[0, 0], [-caller.parent.transform.x + player.transform.x, -caller.parent.transform.y + player.transform.y]]
                }));
                probe.onTriggerWithLayer(Layers.SOLIDS, () => {
                    // Hit a wall, we aren't able to see the player.
                    rotator.connected = false;
                    probe.dead = true;
                    probe.destroy();
                })
                caller.parent.addComponent(new Timer(50, null)).onTrigger.register((caller1) => {
                    const activeProbe = caller1.parent.getComponent<Probe>(Probe);
                    // We didn't hit a wall, so it is connected
                    if (activeProbe != null && !activeProbe.dead) {
                        rotator.connected = true;
                        rotator.radDir = MathUtil.degToRad(90) + MathUtil.pointDirection(player.transform.x, player.transform.y, caller1.parent.transform.x, caller1.parent.transform.y);
                        activeProbe.destroy();
                    }
                });
            } else {
                rotator.connected = false;
            }
        })
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
            this.getScene().addEntity(new Antenna(this.transform.x, this.transform.y, this.snapDir));
            LD59.ANTS.add([this.transform.x, this.transform.y, this.snapDir]);
            this.destroy();
        })
    }
}

export class AntennaRotator extends GlobalSystem<[RotateToPlayerSprite[]]> {
    types: LagomType<Component>[] = [RotateToPlayerSprite];

    update(delta: number): void {
        const player = this.getScene().getEntityWithName("lander");
        const connected = player?.getComponent<Connected>(Connected);
        if (player === null || connected === null) {
            return;
        }
        connected!.isConnected = false;
        this.runOnComponents(sprites => {
            sprites.forEach(sprite => {
                const rot = sprite.pixiObj.rotation;
                if (sprite.connected) {
                    sprite.applyConfig({rotation: MathUtil.angleLerp(rot, -sprite.radDir, delta * 0.01)})
                    connected!.isConnected = true;
                } else {
                    sprite.applyConfig({rotation: MathUtil.angleLerp(rot, rot + 0.3, delta * 0.01)})
                }
            })
        })
    }
}