import {Component, Entity, Game, GlobalSystem, LagomType, MathUtil, Sprite, TextDisp} from "lagom-engine";
import {LD59} from "../LD59";

export class GameTimer extends Entity {
    timeTextComponent;

    constructor(x: number, y: number) {
        super("level_time", x, y,);
    }

    onAdded() {
        super.onAdded();
        this.timeTextComponent = this.addComponent(new TimerText());
        this.addComponent(new Sprite(Game.resourceLoader.get("stopwatch").tileIdx(0), {
            xAnchor: 0.5,
            yAnchor: 0.5,
            xOffset: 13,
            yOffset: -8
        }));
    }
}

class TimerText extends TextDisp {
    time_ms: number;

    constructor() {
        super(0, 0, "0", {
            fontFamily: "retro",
            fill: 0xffffff,
        });
        this.time_ms = 0;
        this.pixiObj.anchor.set(1,1);
    }

    reset() {
        this.time_ms = 0;
        this.set_text();
    }

    increment(time_passed) {
        this.time_ms += time_passed
        this.set_text();
    }

    set_text() {
        this.text = `${(this.time_ms/1000).toFixed(0)}`
    }
}

export class GameTimerSystem extends GlobalSystem<[]> {
    types: LagomType<Component>[] = [];

    update(delta: number): void
    {
        this.scene.getEntityWithName("level_time")?.getComponent<TimerText>(TimerText)?.increment(delta);
    }
}

export class AntennaDisp extends Entity {

    constructor(x: number, y: number) {
        super("antenna_disp", x, y);
    }

    onAdded() {
        super.onAdded();
        const numAntennas = this.addComponent(new NumAntennas());
        numAntennas.update_antennas();
        this.addComponent(new Sprite(Game.resourceLoader.get("antenna").tileIdx(0), {
            xAnchor: 0.5,
            yAnchor: 0.5,
            xOffset: 12,
            yOffset: -8
        }));
        this.addComponent(new Sprite(Game.resourceLoader.get("antenna").tileIdx(1), {
            xAnchor: 0.5,
            yAnchor: 0.5,
            xOffset: 12,
            yOffset: -10
        }));
    }
}

export class NumAntennas extends TextDisp {

    constructor() {
        super(0, 0, "0", {
            fontFamily: "retro",
            fill: 0xffffff,
        });
        this.pixiObj.anchor.set(1,1);
    }

    update_antennas() {
        this.text = `${LD59.ANTS.size}`
    }
}
