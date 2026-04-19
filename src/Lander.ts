import {
    CircleSatCollider,
    Component,
    Entity,
    Game,
    Key,
    MathUtil,
    RenderCircle,
    Rigidbody,
    SimplePhysicsBody,
    Sprite
} from "lagom-engine";
import {Layers} from "./LD59";


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
                return;
            }

            if (Game.keyboard.isKeyDown(Key.KeyA)) {
                body.rotate(MathUtil.degToRad(delta * -Phys.ROT_SPEED));
            }

            if (Game.keyboard.isKeyDown(Key.KeyD)) {
                body.rotate(MathUtil.degToRad(delta * Phys.ROT_SPEED));
            }
            if (Game.keyboard.isKeyDown(Key.KeyW)) {
                const moveVector = MathUtil.lengthDirXY(delta * Phys.THRUST, MathUtil.degToRad(-90) + entity.transform.rotation);
                body.move(moveVector.x, moveVector.y);
                // sprite.setAnimation(1, false);
                // (entity.scene.getEntityWithName("audio") as SoundManager).playSound("rocket");
            } else {
                // sprite.setAnimation(0, false);
                // (entity.scene.getEntityWithName("audio") as SoundManager).stopSound("rocket");
            }
        });

        this.addComponent(new Rigidbody());
        this.addComponent(new SimplePhysicsBody({angCap: 0.08, angDrag: 0.005, linCap: 1, linDrag: 0.0000005}));

        const col = this.addComponent(new CircleSatCollider({layer: Layers.SHIP, radius: 6}));
        col.onTriggerWithLayer(Layers.PAD, (caller, data) => {
            // Check if it was a safe landing or not.
            const ang = Math.abs(caller.parent.transform.angle % 360);
            const phys = caller.parent.getComponent<SimplePhysicsBody>(SimplePhysicsBody);
            const yVel = phys?.yVel ?? 1000;
            const xVel = phys?.xVel ?? 1000;

            if (ang < 15 && yVel < 0.5 && Math.abs(xVel) < 0.2) {
                console.log("SAFE")

            } else {
                // console.log("a", ang, "x", xVel, "y", yVel);
            }

            caller.parent.getComponent(Rigidbody)?.destroy();
            caller.parent.getComponent(SimplePhysicsBody)?.destroy();
        });

        col.onTriggerWithLayer(Layers.SOLIDS, (caller, data) => {

            // DEAD
            console.log("DEAD", caller, data.other);
            caller.parent.getComponent(Rigidbody)?.destroy();
            caller.parent.getComponent(SimplePhysicsBody)?.destroy();
            data.other.getEntity().addComponent(new RenderCircle({radius: 10}));
        })
    }
}