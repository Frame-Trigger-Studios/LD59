import {
    AnimatedSpriteController,
    AnimationEnd,
    CircleSatCollider,
    Component,
    Entity,
    Game,
    Key,
    Log,
    MathUtil,
    RenderCircle,
    Rigidbody,
    Scene,
    SimplePhysicsBody,
    Sprite,
    TextDisp
} from "lagom-engine";
import {GameState, Layers, LD59} from "./LD59";
import {GameTimerSystem, Score, ScoreDisplay, TimerText} from "./scoring/Scoring";


class Phys {
    static GRAVITY = 0.000015;
    static ROT_SPEED = 0.0008;
    static THRUST = 0.00004;
}

export class LanderPlaceholder extends Entity {
    constructor(x: number, y: number) {
        super("lander_placeholder", x, y);
    }

    onAdded() {
        super.onAdded();
        this.addComponent(new Sprite(Game.resourceLoader.get("lander").tileIdx(0), {xAnchor: 0.5, yAnchor: 0.5}));
    }

    onRemoved() {
        super.onRemoved();
        this.scene.addEntity(new Lander(this.transform.x, this.transform.y));
    }
}

export class Connected extends Component {
    isConnected = false;
}

export class Lander extends Entity {

    constructor(x: number, y: number) {
        super("lander", x, y);
    }

    onAdded() {
        super.onAdded();

        this.addComponent(new Sprite(Game.resourceLoader.get("lander").tileIdx(0), {xAnchor: 0.5, yAnchor: 0.5}));
        const fireTex = Game.resourceLoader.get("fire");
        const fireSpr = this.addComponent(new AnimatedSpriteController(0, [{
            // Blank
            id: 0,
            textures: [fireTex.tileIdx(4)],
            events: {
                0: () => LD59.audio.stop("thrusters")
            }
        }, {
            // Fire
            id: 1,
            textures: fireTex.tileSlice(0, 3),
            events: {
                0: () => LD59.audio.play("thrusters")
            },
            config: {
                animationEndAction: AnimationEnd.LOOP,
                xAnchor: 0.5,
                yAnchor: 0.5,
                yOffset: 4,
                animationSpeed: 50
            }
        }]));

        this.getScene().addFnSystem([Rigidbody], (delta, entity, body) => {
            entity.transform.x += body.pendingX;
            entity.transform.y += body.pendingY;
            entity.transform.rotation += body.pendingRotation;
            body.pendingX = 0;
            body.pendingY = 0;
            body.pendingRotation = 0;
        })

        this.addComponent(new Connected());

        // Player mover
        this.getScene().addFnSystem([SimplePhysicsBody, Connected], (delta, entity, body: SimplePhysicsBody, inRange: Connected) => {
            // Make sure gravity is applied
            body.move(0, Phys.GRAVITY * delta);

            if (!inRange.isConnected) {
                fireSpr.setAnimation(0, false);
                LD59.audio.play("out_of_range");

                return;
            }

            LD59.audio.stop("out_of_range");

            if (Game.keyboard.isKeyDown(Key.KeyA)) {
                body.rotate(MathUtil.degToRad(delta * -Phys.ROT_SPEED));
            }

            if (Game.keyboard.isKeyDown(Key.KeyD)) {
                body.rotate(MathUtil.degToRad(delta * Phys.ROT_SPEED));
            }
            if (Game.keyboard.isKeyDown(Key.KeyW)) {
                const moveVector = MathUtil.lengthDirXY(delta * Phys.THRUST, MathUtil.degToRad(-90) + entity.transform.rotation);
                body.move(moveVector.x, moveVector.y);
                fireSpr.setAnimation(1, false);
            } else {
                fireSpr.setAnimation(0, false);
            }
        });

        this.addComponent(new Rigidbody());
        this.addComponent(new SimplePhysicsBody({angCap: 0.08, angDrag: 0.005, linCap: 1, linDrag: 0.0000005}));

        const col = this.addComponent(new CircleSatCollider({layer: Layers.SHIP, radius: 5}));
        col.onTriggerWithLayer(Layers.PAD, (caller, data) => {
            // Check if it was a safe landing or not.
            const ang = Math.abs(caller.parent.transform.angle % 360);

            // It's kinda funny to launch across the map and land on the pad, maybe we remove the checks and any landing
            // is safe?
            if (ang < 45) {
                Log.info("SAFE")
                LD59.STATE = GameState.Win;
                this.winMsg(caller.getScene());
                LD59.audio.play("landed", false);

            } else {
                Log.info("Angle too extreme", ang);
                LD59.STATE = GameState.Dead;
                this.deadMsg(caller.getScene());
            }
            this.scene.getGlobalSystem<GameTimerSystem>(GameTimerSystem)?.destroy();
            caller.destroy();
            caller.parent.getComponent(Rigidbody)?.destroy();
            caller.parent.getComponent(SimplePhysicsBody)?.destroy();

        });

        col.onTriggerWithLayer(Layers.SOLIDS, (caller, data) => {

            // DEAD
            caller.parent.getComponent(Rigidbody)?.destroy();
            caller.parent.getComponent(SimplePhysicsBody)?.destroy();
            data.other.getEntity().addComponent(new RenderCircle({radius: 10}));
            LD59.STATE = GameState.Dead;
            this.deadMsg(caller.getScene());
            this.scene.getGlobalSystem<GameTimerSystem>(GameTimerSystem)?.destroy();
            LD59.audio.play("crash", false);
        })
    }

    private deadMsg(scene: Scene) {
        scene.addGUIEntity(new Entity("retryinstr")).addComponent(
            new TextDisp(Game.GAME_WIDTH / 2, 60, "Ouch\nPress Space to restart\nor E to edit antenna placement", {
                fontFamily: "retro",
                fill: 0xffffff,
            }),
        ).pixiObj.anchor.set(0.5);

        const score = this.scene.addGUIEntity(new Score(LD59.GAME_WIDTH / 2, LD59.GAME_HEIGHT / 2));
        const time_ms = this.scene.getEntityWithName("level_time")?.getComponent<TimerText>(TimerText)?.time_ms;
        if (time_ms) {
            score.getComponent<ScoreDisplay>(ScoreDisplay)?.calc_score(time_ms, LD59.ANTS.size);
        }
    }

    private winMsg(scene: Scene) {
        scene.addGUIEntity(new Entity("retryinstr")).addComponent(
            new TextDisp(Game.GAME_WIDTH / 2, 60, "Nice\nPress Space go to next level\nor R/E to replay", {
                fontFamily: "retro",
                fill: 0xffffff,
            }),
        ).pixiObj.anchor.set(0.5);

        const score = this.scene.addEntity(new Score(LD59.GAME_WIDTH / 2, LD59.GAME_HEIGHT / 2));
        const time_ms = this.scene.getEntityWithName("level_time")?.getComponent<TimerText>(TimerText)?.time_ms;
        if (time_ms) {
            score.getComponent<ScoreDisplay>(ScoreDisplay)?.calc_score(time_ms, LD59.ANTS.size);
        }
    }
}
