import {
    AnimatedSprite,
    AnimatedSpriteController,
    AnimationEnd,
    CircleSatCollider,
    Component,
    Entity,
    Game,
    Key,
    Log,
    MathUtil,
    Rigidbody,
    SatCollider,
    Scene,
    ScreenShake,
    SimplePhysicsBody,
    Sprite,
    Timer
} from "lagom-engine";
import {GameState, Layers, LD59} from "./LD59";
import {GameTimerSystem, TimerText} from "./scoring/Scoring";
import {getScores, HighScores, SubmitScore} from "./util/HighScores";
import {Instr} from "./LevelLoad";


class Phys {
    static GRAVITY = 0.000012;
    static ROT_SPEED = 0.0008;
    static THRUST = 0.00005;
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
        super("lander", x, y, Layers.SHIP);
    }

    onAdded() {
        super.onAdded();

        const landerSpr = this.addComponent(new AnimatedSpriteController(0, [
            {
                id: 0,
                textures: [Game.resourceLoader.get("lander").tileIdx(0)],
                config: {xAnchor: 0.5, yAnchor: 0.5}
            },
            {
                id: 1,
                textures: Game.resourceLoader.get("lander").allTiles(),
                config: {
                    xAnchor: 0.5, yAnchor: 0.5, animationSpeed: 100
                },
            },
        ]));
        const fireTex = Game.resourceLoader.get("fire");
        const fireSpr = this.addComponent(new AnimatedSpriteController(0, [{
            // Blank
            id: 0,
            textures: [fireTex.tileIdx(4)],
        }, {
            // Fire
            id: 1,
            textures: fireTex.tileSlice(0, 3),
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
                LD59.audio.stop("thrusters");
                fireSpr.setAnimation(0, false);
                landerSpr.setAnimation(0, false);
                // LD59.audio.play("out_of_range");
                LD59.audio.stop("in_range");

                return;
            }
            landerSpr.setAnimation(1, false);
            // LD59.audio.stop("out_of_range");
            LD59.audio.play("in_range");

            if (Game.keyboard.isKeyDown(Key.KeyA)) {
                body.rotate(MathUtil.degToRad(delta * -Phys.ROT_SPEED));
            }

            if (Game.keyboard.isKeyDown(Key.KeyD)) {
                body.rotate(MathUtil.degToRad(delta * Phys.ROT_SPEED));
            }
            if (Game.keyboard.isKeyDown(Key.KeyW)) {
                const moveVector = MathUtil.lengthDirXY(delta * Phys.THRUST, MathUtil.degToRad(-90) + entity.transform.rotation);
                body.move(moveVector.x, moveVector.y);
                LD59.audio.play("thrusters");
                fireSpr.setAnimation(1, false);
            } else {
                LD59.audio.stop("thrusters");
                fireSpr.setAnimation(0, false);
            }
        });

        this.addComponent(new Rigidbody());
        this.addComponent(new SimplePhysicsBody({angCap: 0.08, angDrag: 0.005, linCap: 1, linDrag: 0.0000005}));

        const col = this.addComponent(new CircleSatCollider({layer: Layers.SHIP, radius: 5}));
        col.onTriggerWithLayer(Layers.PAD, (caller, data) => {

            // It's kinda funny to launch across the map and land on the pad
            Log.info("SAFE")
            if (LD59.STATE === GameState.Dead || LD59.STATE === GameState.Scoring) {
                // Stop double collision triggers
                return;
            }
            LD59.STATE = GameState.Scoring;
            this.winMsg();
            LD59.audio.stop("thrusters");
            LD59.audio.play("landed", false);
            LD59.restore_music();

            this.scene.getGlobalSystem<GameTimerSystem>(GameTimerSystem)?.destroy();
            caller.destroy();
            caller.parent.getComponent(Rigidbody)?.destroy();
            caller.parent.getComponent(SimplePhysicsBody)?.destroy();

        });

        col.onTriggerWithLayer(Layers.SOLIDS, (caller, data) => {

            // DEAD
            if (LD59.STATE === GameState.Scoring) {
                // Stop double collision triggers
                return;
            }
            this.crashLander(caller);
        });
    }

    private crashLander(caller: SatCollider) {
        LD59.audio.stop("thrusters");
        this.scene.getGlobalSystem<GameTimerSystem>(GameTimerSystem)?.destroy();
        caller.parent.addComponent(new ScreenShake(0.5, 1500));
        caller.parent.getComponent(Rigidbody)?.destroy();
        caller.parent.getComponent(SimplePhysicsBody)?.destroy();
        caller.destroy();
        LD59.STATE = GameState.Dead;
        this.deadMsg(caller.getScene());
        LD59.restore_music();

        caller.parent.addComponent(new Timer(100, null)).onTrigger.register(() => {
            const debrisTex = Game.resourceLoader.get("lander_broken")
            for (let i = 0; i < 16; i++) {
                const e = this.scene.addEntity(new Entity("debris", caller.parent.transform.x, caller.parent.transform.y, Layers.DEBRIS));
                e.addComponent(new Sprite(debrisTex.tileIdx(i % 8), {
                    rotation: MathUtil.degToRad(MathUtil.randomRange(0, 360)),
                    xAnchor: 0.5,
                    yAnchor: 0.5
                }));
                const motion = MathUtil.lengthDirXY(MathUtil.randomRange(1, 9) * 0.01, MathUtil.degToRad(MathUtil.randomRange(0, 360)));
                const phys = e.addComponent(new SimplePhysicsBody({
                    angCap: 5,
                    linCap: 5,
                    linDrag: 0,
                    angDrag: 0
                }))
                phys.move(motion.x, motion.y);
                phys.rotate(MathUtil.degToRad(MathUtil.randomRange(0, 10) * 0.1));
                e.addComponent(new Rigidbody());
            }
            caller.parent.destroy();
        });
        this.scene.addEntity(new Entity("explosion", caller.parent.transform.x, caller.parent.transform.y, Layers.EXPLOSION))
            .addComponent(new AnimatedSprite(Game.resourceLoader.get("explosion").allTiles(), {
                xAnchor: 0.5,
                yAnchor: 0.5,
                rotation: MathUtil.degToRad(MathUtil.randomRange(0, 360)),
                animationSpeed: 80,
                animationEndEvent: (s) => s.parent.destroy()
            }))
        LD59.audio.play("crash", false);
    }

    private deadMsg(scene: Scene) {
        this.scene.entities.forEach((entity: Entity) => {
            if (entity.name === "instr") {
                entity.destroy()
            }
        });
        scene.addGUIEntity(new Instr(LD59.GAME_WIDTH / 2, LD59.GAME_HEIGHT / 2, "Ouch! Press Space to restart or E to edit", 14, true))

    }

    private winMsg() {
        const time_ms = this.scene.getEntityWithName("level_time")?.getComponent<TimerText>(TimerText)?.time_ms;
        if (time_ms) {
            const score = (time_ms / 1000) + LD59.ANTS.size * 5;

            getScores().then(resp => {

                this.scene.entities.forEach((entity: Entity) => {
                    if (entity.name === "instr") {
                        entity.destroy()
                    }
                });

                if (resp === null || (resp.length == 10 && score > resp[9].score)) {
                    this.scene.addGUIEntity(new HighScores(score, (time_ms / 1000), true))
                } else {
                    // new high score
                    this.scene.addGUIEntity(new SubmitScore(score, (time_ms / 1000)));
                }
            })
        }
    }
}
