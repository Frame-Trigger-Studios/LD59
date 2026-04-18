import {Entity, Game, Key, MathUtil, newSystem, Rigidbody, SimplePhysicsBody, Sprite, TextDisp} from "lagom-engine";
import {InRange} from "./Signal";


class Phys {
    static GRAVITY = 0.000015;
    static ROT_SPEED = 0.0008;
    static THRUST = 0.00006;
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

        this.addComponent(new InRange());

        // Player mover
        this.getScene().addFnSystem([SimplePhysicsBody, InRange], (delta, entity, body: SimplePhysicsBody, inRange: InRange) => {
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

            body.move(0, Phys.GRAVITY * delta);
        });

        this.addComponent(new Rigidbody());
        this.addComponent(new SimplePhysicsBody({angCap: 0.08, angDrag: 0.005, linCap: 6}));
    }
}