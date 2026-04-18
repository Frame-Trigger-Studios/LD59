import {Entity, Game, Key, System} from "lagom-engine";

export class ActionOnPress extends System<[]> {
    types: [] = [];

    constructor(
        readonly action: (system: ActionOnPress) => void,
        readonly keys: Key[] = [Key.Space, Key.KeyA, Key.KeyD, Key.KeyW, Key.KeyS, Key.KeyZ, Key.KeyX],
    ) {
        super();
    }

    update(delta: number): void {
        super.update(delta);
        if (Game.keyboard.isKeyPressed(...this.keys)) {
            this.action(this);
        }
    }

    runOnEntities(_delta: number, _entity: Entity): void {}
}
