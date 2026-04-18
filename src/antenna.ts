import {
    Button,
    CircleSatCollider,
    Component,
    CType,
    Entity,
    Game,
    GlobalSystem,
    RenderCircle,
    RenderRect,
    System, Timer
} from "lagom-engine";
import {Layers} from "./LD59";

export class Antenna extends Entity {

    constructor(x: number, y: number, depth: number) {
        super("antenna", x, y, depth);
    }

    onAdded() {
        const width = 10;
        const height = 30;
        this.addComponent(new RenderRect({width: width, height: height}, 0xff0000, 0x000000));

        const radius = 10;
        const deleteButton = this.addChild(new Entity("deleteButton", 0, 0, Layers.ANTENNA_DESTROY));
        deleteButton.addComponent(new RenderCircle({radius: radius, xOff: width / 2, yOff: height + radius + 10}, 0xffffff, 0xff0000));
        deleteButton.addComponent(new CircleSatCollider({radius: radius, xOff: width / 2, yOff: height + radius + 10, layer: Layers.ANTENNA_DESTROY}));
    }
}

class ClickDetector extends Entity {

    constructor(x: number, y: number, depth: number) {
        super("clickDetector", x, y, depth);
    }

    onAdded() {
        this.addComponent(new CircleSatCollider({radius: 10, layer: Layers.CLICK})).onTrigger
            .register((caller, data) => {
                data.other.parent.parent?.addComponent(new ClickAndDestroy());
                this.destroy();
            });
        this.addComponent(new Timer(20, null, false)).onTrigger.register(caller => {
            const pos = Game.mouse.canvasPos();
            this.getScene().addEntity(new Antenna(pos.x, pos.y, Layers.ANTENNA));
        })
    }
}

class ClickAndDestroy extends Component {}

export class ClickSpawnSystem extends GlobalSystem<[]> {
    types: [] = [];

    update(delta: number): void {
        if (Game.mouse.isButtonPressed(Button.LEFT)) {
            const pos = Game.mouse.canvasPos();
            this.getScene().addEntity(new ClickDetector(pos.x, pos.y, Layers.CLICK));
        }
    }
}

export class ClickDetectionSystem extends System<[ClickAndDestroy]> {
    types: [CType<ClickAndDestroy>] = [ClickAndDestroy];

    runOnEntities(delta: number, entity: Entity, args: ClickAndDestroy): void {
        entity.destroy();
    }
}