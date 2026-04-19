import {
    CollisionMatrix,
    Entity,
    FrameTriggerSystem,
    Game,
    Key,
    Log,
    LogLevel,
    SatCollisionSystem,
    Scene,
    SimplePhysics,
    TextDisp,
    Timer,
    TimerSystem
} from "lagom-engine";
import {SoundManager} from "./util/SoundManager";
import {LevelLoader} from "./LevelLoad";
import {ClickDetectionSystem, ClickSpawnSystem} from "./antenna";
import {ActionOnPress} from "./util/ActionOnPress";

export enum Layers {
    SHIP,
    ANTENNA,
    ANTENNA_DESTROY,
    PAD,
    SOLIDS,
    CLICK,
}

export enum Palette {
    PURPLE = 0x292831,
    DARK_BLUE = 0x333f58,
    BLUE = 0x4a7a96,
    PINK = 0xee8695,
    CREAM = 0xfbbbad
}

class TitleScene extends Scene {
    onAdded() {
        super.onAdded();

        this.addGUIEntity(new SoundManager());
        this.addGlobalSystem(new TimerSystem());
        this.addGlobalSystem(new FrameTriggerSystem());

        this.addGUIEntity(new Entity("title")).addComponent(
            new TextDisp(100, 10, "GAME NAME", {
                fontFamily: "retro",
                fill: 0xffffff,
            }),
        );

        this.addSystem(
            new ActionOnPress(() => {
                this.game.setScene(new MainScene(this.game));
            }),
        );
    }
}

class MainScene extends Scene {
    onAdded() {
        super.onAdded();

        this.addGUIEntity(new SoundManager());
        this.addGlobalSystem(new TimerSystem());
        this.addGlobalSystem(new FrameTriggerSystem());

        this.addSystem(new SimplePhysics());

        const text = this.addGUIEntity(new Entity("title"));
        text.addComponent(
            new TextDisp(Game.GAME_WIDTH / 2, 20, "Click to Add an Antenna", {
                fontFamily: "retro",
                fill: 0xffffff,
            }),
        ).pixiObj.anchor.set(0.5);
        ;
        text.addComponent(
            new TextDisp(Game.GAME_WIDTH / 2, Game.GAME_HEIGHT - 20, "Press Space to Start", {
                fontFamily: "retro",
                fill: 0xffffff,
                align: "center"
            }),
        ).pixiObj.anchor.set(0.5);
        this.addSystem(new ActionOnPress((system) => {
            this.getEntityWithName("lander_placeholder")?.destroy();
            text.destroy();
            system.destroy();

        }, [Key.Space]));

        const matrix = new CollisionMatrix();
        matrix.addCollision(Layers.SHIP, Layers.SOLIDS);
        matrix.addCollision(Layers.SHIP, Layers.PAD);
        matrix.addCollision(Layers.CLICK, Layers.ANTENNA_DESTROY);

        this.addGlobalSystem(new SatCollisionSystem(matrix));
        this.addGlobalSystem(new ClickSpawnSystem());

        this.addSystem(new ClickDetectionSystem());

        this.addEntity(new LevelLoader(1));

        // Game.audio.startMusic("music", true);
    }
}

export class LD59 extends Game {
    startScene = () => new MainScene(this);
    resourceLoad = async () => {
        await Game.resourceLoader.autoLoad();
        console.log("loaded all resources");
    };

    constructor() {
        super({
            width: 640,
            height: 360,
            resolution: 1,
            backgroundColor: 0x292831,
        });

        // Set the global log level
        Log.logLevel = LogLevel.INFO;
    }
}
