import {
    ActionOnPress,
    CollisionMatrix,
    Entity,
    FrameTriggerSystem,
    Game,
    Log,
    LogLevel,
    SatCollisionSystem,
    Scene,
    SimplePhysics,
    TextDisp,
    TimerSystem
} from "lagom-engine";
import {SoundManager} from "./util/SoundManager";
import {LevelLoader} from "./LevelLoad";
import {ClickDetectionSystem, ClickSpawnSystem} from "./antenna";

export enum Layers {
    SHIP,
    ANTENNA,
    ANTENNA_DESTROY,
    PAD,
    SOLIDS,
    CLICK,
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

        this.addGUIEntity(new Entity("main scene")).addComponent(
            new TextDisp(100, 10, "MAIN SCENE", {
                fontFamily: "pixeloid",
                fill: 0xffffff,
            }),
        );

        const matrix = new CollisionMatrix();
        matrix.addCollision(Layers.SHIP, Layers.SOLIDS);
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
            resolution: 2,
            backgroundColor: 0x292831,
        });

        // Set the global log level
        Log.logLevel = LogLevel.INFO;
    }
}
