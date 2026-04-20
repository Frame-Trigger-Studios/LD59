import {Component, Entity, Game, GlobalSystem, LagomType, Sprite, TextDisp} from "lagom-engine";
import {Layers, LD59, Palette} from "../LD59";

export class GameTimer extends Entity {
    timeTextComponent!: Component;

    constructor(x: number, y: number) {
        super("level_time", x, y, Layers.GUI);
    }

    onAdded() {
        super.onAdded();
        this.timeTextComponent = this.addComponent(new TimerText());
        this.addComponent(new Sprite(Game.resourceLoader.get("stopwatch").tileIdx(0), {
            xAnchor: 0.5,
            yAnchor: 0.5,
        }));
    }
}

export class TimerText extends TextDisp {
    time_ms: number = 0;

    constructor() {
        super(10, -2, "0", {
            fontFamily: "retro",
            fontSize: 12,
            fill: Palette.PINK,
        });
        this.pixiObj.anchor.set(0, 0.5);
    }

    reset() {
        this.time_ms = 0;
        this.setText();
    }

    increment(timePassed: number) {
        this.time_ms += timePassed
        this.setText();
    }

    setText() {
        this.text = `${(this.time_ms / 1000).toFixed(2)}`
    }
}

export class GameTimerSystem extends GlobalSystem<[]> {
    types: LagomType<Component>[] = [];

    update(delta: number): void {
        this.scene.getEntityWithName("level_time")?.getComponent<TimerText>(TimerText)?.increment(delta);
    }
}

export class AntennaDisp extends Entity {

    constructor(x: number, y: number) {
        super("antenna_disp", x, y, Layers.GUI);
    }

    onAdded() {
        super.onAdded();
        const numAntennas = this.addComponent(new NumAntennas());
        numAntennas.update_antennas();
        this.addComponent(new Sprite(Game.resourceLoader.get("antenna").tileIdx(0), {
            xAnchor: 0.5,
            yAnchor: 0.5,
        }));
        this.addComponent(new Sprite(Game.resourceLoader.get("antenna_active").tileIdx(0), {
            xAnchor: 0.5,
            yAnchor: 1,
            yOffset: 4
        }));
    }
}

export class NumAntennas extends TextDisp {

    constructor() {
        super(10, -2, "0", {
            fontFamily: "retro",
            fontSize: 12,
            fill: Palette.PINK,
        });
        this.pixiObj.anchor.set(0, 0.5);
    }

    update_antennas() {
        this.text = `${LD59.ANTS.size}`
    }
}

export class Score extends Entity {

    constructor(x: number, y: number) {
        super("score", x, y);
    }

    onAdded() {
        super.onAdded();
        this.addComponent(
            new TextDisp(0, -2, "You scored:", {
                fontFamily: "retro",
                fontSize: 12,
                fill: Palette.PINK,
            }),
        ).pixiObj.anchor.set(0, 0.5);
        this.addComponent(new ScoreDisplay(30));

    }
}

export class ScoreDisplay extends TextDisp {
    constructor(yOff: number) {
        super(0, yOff, "0", {
            fontFamily: "retro",
            fill: 0xffffff,
        });
        this.pixiObj.anchor.set(0.5, 0.5);
    }

    calc_score(time_ms: number, antennas: number) {
        let score = 0;
        if (antennas > 0) {
            score = (Math.max(180_000 - time_ms, 0) / antennas) / 1000;
            score = Math.floor(score);
        }

        this.text = `${score} points`
    }
}
