import {Component, Entity, Game, newSystem, Sprite} from "lagom-engine";


class AddGravity extends Component {
    static AMT = 0.05;
}

// class

export class Lander extends Entity {

    constructor(x: number, y: number) {
        super("lander", x, y);
    }


    onAdded() {
        super.onAdded();

        this.addComponent(new Sprite(Game.resourceLoader.get("lander").tileIdx(0)));

        this.addComponent(new AddGravity());

        this.getScene().addFnSystem(newSystem([AddGravity], (delta, entity, components) => {
            entity.transform.y += AddGravity.AMT * delta;
        }))
    }
}