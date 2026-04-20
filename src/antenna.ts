import {
    AnimatedSpriteController,
    Button,
    CircleSatCollider,
    Component,
    Entity,
    Game,
    GlobalSystem,
    LagomType,
    MathUtil,
    PolySatCollider,
    RectSatCollider,
    RenderCircle,
    Sprite,
    Timer
} from "lagom-engine";
import {Layers, LD59, Palette} from "./LD59";
import {Connected} from "./Lander";
import {AntennaDisp, NumAntennas} from "./scoring/Scoring";

export class RotateToPlayerSprite extends AnimatedSpriteController {
    radDir = 0;
    connected = false;
}

class Probe extends PolySatCollider {
    dead = false;
}

class RenderInRange extends RenderCircle {
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
        const antennaTex = Game.resourceLoader.get("antenna_active");
        const rotator = this.addComponent(new RotateToPlayerSprite(0, [
            {
                id: 0,
                textures: [antennaTex.tileIdx(0)],
                config: {
                    xAnchor: 0.5,
                    yAnchor: 1,
                    rotation: MathUtil.degToRad((this.rot + 2) * 90)
                }
            },
            {
                id: 1,
                textures: antennaTex.tileSlice(1, 7),
                config: {
                    xAnchor: 0.5,
                    yAnchor: 1,
                    rotation: MathUtil.degToRad((this.rot + 2) * 90),
                    animationSpeed: 100
                }
            }]));
        this.addComponent(new CircleSatCollider({layer: Layers.ANTENNA_OBJ, radius: 8}))

        const outline = this.addComponent(new RenderInRange({radius: Antenna.ANT_DIST}));
        outline.setStyle({lineColour: Palette.PINK, lineAlpha: 0.5});

        this.addComponent(new Timer(100, rotator, true)).onTrigger.register((caller, rotator) => {
            const player = this.getScene().getEntityWithName("lander");
            if (player === null) {
                return;
            }

            // Check distance to player
            const dist = MathUtil.pointDistance(caller.parent.transform.x, caller.parent.transform.y,
                player.transform.x, player.transform.y);

            // Set the outline alpha
            const alpha = Math.max(0, Math.min(0.3 * (1 - (dist - 100) / 50), 0.3));

            const music = Game.resourceLoader.getSound("music");

            const fade_distance = 50;

            // Check outer range for fade in
            if (dist < Antenna.ANT_DIST + fade_distance) {
                outline.setStyle({lineAlpha: alpha});
                rotator.connected = false;

                // Actually in range
                if (dist < Antenna.ANT_DIST) {
                    rotator.connected = true;
                    rotator.radDir = MathUtil.degToRad(90) + MathUtil.pointDirection(player.transform.x, player.transform.y, caller.parent.transform.x, caller.parent.transform.y);
                } else if (!player.getComponent<Connected>(Connected)?.isConnected) {
                    const scale_length = 10;
                    const amount_outside = dist - Antenna.ANT_DIST;
                    const volume_scale = Math.floor((amount_outside / (fade_distance/scale_length))) + 1;
                    const increment = LD59.musicVolume / scale_length;
                    music.volume = LD59.musicVolume - (increment * volume_scale);
                }
            } else {
                rotator.connected = false;
                outline.setStyle({lineAlpha: 0});
            }
        })
    }
}

class HoverSprite
    extends Sprite {
}

class HoverSprite2 extends Sprite {
}


class HoverCircle extends RenderCircle {
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
        this.addComponent(new HoverSprite2(Game.resourceLoader.get("antenna").tileIdx(1), {
            alpha: 0.5,
            xAnchor: 0.5,
            yAnchor: 0.5,
            xOffset: 8,
            yOffset: 8
        }));

        this.addComponent(new HoverCircle({
            radius: Antenna.ANT_DIST,
            xOff: 8,
            yOff: 8
        })).setStyle({lineColour: Palette.PINK});

        // Add colliders for the blocks surrounding us so we know what to snap to.
        let c = this.addComponent(new CircleSatCollider({
            layer: Layers.ANTENNA_PROBING,
            radius: 5,
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
            radius: 5,
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
            radius: 5,
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
            radius: 5,
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

        c = this.addComponent(new CircleSatCollider({
            layer: Layers.ANTENNA_PROBING,
            radius: 5,
            yOff: 8,
            xOff: 8
        }));
        c.onTrigger.register( (caller, data) => {
            if (data.other.layer === Layers.SOLIDS || data.other.layer === Layers.PAD) {
                this.snapDir = null;
            }
        });

        this.scene.addFnSystem([HoverSprite, HoverSprite2, HoverCircle], (delta, entity, sprite, sprite2, circle) => {
            // TODO engine: fix canvas pos when the game is scaled
            const pos = Game.mouse.canvasPos().divide(2);

            // if we are adjacent to a full block but inside an angled block this will show that placement is valid but
            // it won't actually allow it.
            // TODO fix this if time
            if (this.snapDir === null) {
                sprite.applyConfig({alpha: 0.3})
                sprite2.applyConfig({alpha: 0.3})
                circle.setStyle({lineAlpha: 0.1});
            } else {
                sprite.applyConfig({alpha: 0.8, rotation: MathUtil.degToRad((this.snapDir + 2) * 90)})
                sprite2.applyConfig({alpha: 0.8, rotation: MathUtil.degToRad((this.snapDir + 2) * 90)})
                circle.setStyle({lineAlpha: 1});
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
        const coll = this.addComponent(new CircleSatCollider({radius: 5, layer: Layers.CLICK}));
        coll.onTrigger.register((caller, data) => {
            if (data.other.layer === Layers.SOLIDS || data.other.layer === Layers.PAD) {
                this.destroy();
            }
            if (data.other.layer === Layers.ANTENNA_OBJ) {
                console.log(LD59.ANTS.delete(JSON.stringify([this.transform.x, this.transform.y, this.snapDir])));
                this.getScene().getEntityWithName<AntennaDisp>("antenna_disp")?.getComponent<NumAntennas>(NumAntennas)?.update_antennas();
                data.other.parent.destroy();
                this.destroy();
            }
        });

        // If this triggers, there wasn't an antenna here
        this.addComponent(new Timer(50, coll, false)).onTrigger.register((caller, data) => {
            data.destroy();
            this.getScene().addEntity(new Antenna(this.transform.x, this.transform.y, this.snapDir));
            LD59.ANTS.add(JSON.stringify([this.transform.x, this.transform.y, this.snapDir]));
            this.getScene().getEntityWithName<AntennaDisp>("antenna_disp")?.getComponent<NumAntennas>(NumAntennas)?.update_antennas();
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
        const previous_connected = connected!.isConnected;
        connected!.isConnected = false;
        this.runOnComponents(sprites => {
            sprites.forEach(sprite => {
                const rot = sprite.sprite?.pixiObj.rotation ?? 0;
                if (sprite.connected) {
                    sprite.setAnimation(1);
                    sprite.applyConfig({rotation: MathUtil.angleLerp(rot, -sprite.radDir, delta * 0.01)})
                    connected!.isConnected = true;
                } else {
                    sprite.setAnimation(0);
                    sprite.applyConfig({rotation: MathUtil.angleLerp(rot, rot + 0.3, delta * 0.01)})
                }
            })
        })

        if (!previous_connected && connected!.isConnected) {
            LD59.restore_music();
        }
    }
}
