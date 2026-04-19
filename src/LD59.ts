import {
    ActionOnPress,
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
    TimerSystem
} from "lagom-engine";
import {SoundManager} from "./util/SoundManager";
import {LevelLoader} from "./LevelLoad";
import {AntennaRotator, MouseTracker} from "./antenna";

export enum Layers {
    SHIP,
    ANTENNA_OBJ,
    ANTENNA_PROBING,
    LOS_PROBE,
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

        text.addComponent(
            new TextDisp(Game.GAME_WIDTH / 2, Game.GAME_HEIGHT - 20, "Press Space to Start", {
                fontFamily: "retro",
                fill: 0xffffff,
                align: "center"
            }),
        ).pixiObj.anchor.set(0.5);

        const mouse = this.addEntity(new MouseTracker("mouse", 0, 0));

        this.addSystem(new ActionOnPress(() => {
            switch (LD59.STATE) {
                // This transitions Planning -> Game
                case GameState.Planning:
                    this.getEntityWithName("lander_placeholder")?.destroy();
                    text.destroy();
                    mouse.destroy();
                    LD59.STATE = GameState.Game;
                    break
                // Transition from Dead -> Restart (skip planning)
                case GameState.Dead:
                    LD59.STATE = GameState.AutoStart;
                    this.game.setScene(new MainScene(this.game));
                    break;

                case GameState.Win:
                    LD59.CURRENT_LEVEL += 1;
                    LD59.ANTS.clear();
                    LD59.STATE = GameState.Planning;
                    this.game.setScene(new MainScene(this.game));
                    break;
            }
        }, [Key.Space]));


        // Quick restart
        this.addSystem(new ActionOnPress(() => {
            switch (LD59.STATE) {
                // Transition from Game -> Game
                // If you cleared the level, allow retry.
                case GameState.Game:
                case GameState.Dead:
                case GameState.Win:
                    LD59.STATE = GameState.AutoStart;
                    this.game.setScene(new MainScene(this.game));
                    break;
            }
        }, [Key.KeyR]));

        this.addSystem(new ActionOnPress(() => {
            switch (LD59.STATE) {
                // Transition from Game or Dead -> Planning
                case GameState.Dead:
                case GameState.Game:
                case GameState.Win:
                    LD59.STATE = GameState.Planning;
                    this.game.setScene(new MainScene(this.game));
                    break;
            }
        }, [Key.KeyE]));


        const matrix = new CollisionMatrix();
        matrix.addCollision(Layers.SHIP, Layers.SOLIDS);
        matrix.addCollision(Layers.SHIP, Layers.PAD);
        matrix.addCollision(Layers.CLICK, Layers.ANTENNA_OBJ);
        matrix.addCollision(Layers.CLICK, Layers.SOLIDS);
        matrix.addCollision(Layers.SOLIDS, Layers.ANTENNA_PROBING);
        matrix.addCollision(Layers.SOLIDS, Layers.LOS_PROBE);

        this.addGlobalSystem(new SatCollisionSystem(matrix));
        this.addGlobalSystem(new AntennaRotator());

        SatCollisionSystem.DEBUG_DRAW = false;

        this.addEntity(new LevelLoader(LD59.CURRENT_LEVEL));

        if (LD59.STATE === GameState.AutoStart) {
            this.getEntityWithName("lander_placeholder")?.destroy();
            text.destroy();
            mouse.destroy();
            LD59.STATE = GameState.Game;
        }

        // Game.audio.startMusic("music", true);
    }
}

export enum GameState {
    AutoStart,
    Planning,
    Game,
    Dead,
    Win
}

export class LD59 extends Game {
    startScene = () => new MainScene(this);
    resourceLoad = async () => {
        await Game.resourceLoader.autoLoad();
        Log.info("loaded all resources");
    };

    static STATE = GameState.Planning;

    // tuples aren't hashable??? JS why
    static ANTS = new Set<string>();
    static CURRENT_LEVEL = 1;

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
