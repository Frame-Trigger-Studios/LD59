import {
    ActionOnPress,
    CollisionMatrix,
    Entity,
    FrameTriggerSystem,
    Game,
    Key,
    Log,
    LogLevel,
    MathUtil,
    SatCollisionSystem,
    Scene,
    ScreenShaker,
    SimplePhysics,
    Sprite,
    TextDisp,
    TimerSystem,
    Util
} from "lagom-engine";
import {SoundManager} from "./util/SoundManager";
import {LevelLoader} from "./LevelLoad";
import {AntennaRotator, MouseTracker} from "./antenna";
import {AntennaDisp, GameTimer, GameTimerSystem} from "./scoring/Scoring";

export enum Layers {
    BACKGROUND,
    ANT_PLACER,
    ANTENNA_PROBING,
    PAD,
    SHIP,
    EXPLOSION,
    ANTENNA_OBJ,
    SOLIDS,
    DEBRIS,
    CLICK,
    GUI
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

        this.addGUIEntity(new Entity("title", 0, 0, Layers.GUI)).addComponent(
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

        SatCollisionSystem.DEBUG_DRAW = false;

        this.addGUIEntity(new SoundManager());
        this.addGlobalSystem(new TimerSystem());
        this.addGlobalSystem(new ScreenShaker(LD59.GAME_WIDTH / 2, LD59.GAME_HEIGHT / 2));
        this.addGlobalSystem(new FrameTriggerSystem());

        this.addSystem(new SimplePhysics());

        // Load background
        if (LD59.BACKGROUNDS.length < LD59.CURRENT_LEVEL) {
            // Generate one
            const bg = [];
            for (let i = 0; i < 60; i++) {
                bg.push([MathUtil.randomRange(0, 20), Util.choose(-1, 1)]);
            }
            LD59.BACKGROUNDS.push(bg);
        }

        const bg = this.addEntity(new Entity("bg", 0, 0, Layers.BACKGROUND));
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 6; j++) {
                const idx = LD59.BACKGROUNDS[LD59.CURRENT_LEVEL - 1][(i * 6) + j];

                bg.addComponent(new Sprite(Game.resourceLoader.get("background").tileIdx(idx[0]), {
                    xOffset: i * 64 + 32,
                    yOffset: j * 64 + 32,
                    xScale: idx[1],
                    yScale: idx[1],
                    yAnchor: 0.5,
                    xAnchor: 0.5
                }));
            }
        }

        const mouse = this.addEntity(new MouseTracker("mouse", 0, 0, Layers.ANT_PLACER));
        this.addGUIEntity(new AntennaDisp(LD59.GAME_WIDTH - 112, 8));
        this.addGUIEntity(new GameTimer(LD59.GAME_WIDTH - 64, 8));

        if (LD59.STATE == GameState.AutoStart) {
            this.addGlobalSystem(new GameTimerSystem());
        }

        this.addSystem(new ActionOnPress(() => {
            LD59.CURRENT_LEVEL -= 1;
            if (LD59.CURRENT_LEVEL <= 0) LD59.CURRENT_LEVEL = 1;
            LD59.ANTS.clear();
            LD59.STATE = GameState.Planning;
            this.game.setScene(new MainScene(this.game));
        }, [Key.BracketLeft]));
        this.addSystem(new ActionOnPress(() => {
            LD59.CURRENT_LEVEL += 1;
            if (LD59.CURRENT_LEVEL > 11) LD59.CURRENT_LEVEL = 11;
            LD59.ANTS.clear();
            LD59.STATE = GameState.Planning;
            this.game.setScene(new MainScene(this.game));
        }, [Key.BracketRight]))

        this.addSystem(new ActionOnPress(() => {
            switch (LD59.STATE) {
                // This transitions Planning -> Game
                case GameState.Planning:
                    this.getEntityWithName("lander_placeholder")?.destroy();
                    mouse.destroy();

                    this.addGlobalSystem(new GameTimerSystem());
                    LD59.STATE = GameState.Game;
                    const txt = this.getEntityWithName("main_text")?.getComponent<TextDisp>(TextDisp);
                    if (txt) {
                        txt.text = ""
                    }
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
        matrix.addCollision(Layers.CLICK, Layers.PAD);
        matrix.addCollision(Layers.SOLIDS, Layers.ANTENNA_PROBING);
        matrix.addCollision(Layers.PAD, Layers.ANTENNA_PROBING);

        this.addGlobalSystem(new SatCollisionSystem(matrix));
        this.addGlobalSystem(new AntennaRotator());


        this.addEntity(new LevelLoader(LD59.CURRENT_LEVEL));

        if (LD59.STATE === GameState.AutoStart) {
            this.getEntityWithName("lander_placeholder")?.destroy();
            mouse.destroy();
            LD59.STATE = GameState.Game;
            const txt = this.getEntityWithName("main_text")?.getComponent<TextDisp>(TextDisp);
            if (txt) {
                txt.text = ""
            }
        }

        // Game.audio.startMusic("music", true);
    }
}

export enum GameState {
    AutoStart,
    Planning,
    Game,
    Dead,
    Win,
    Scoring
}

export class LD59 extends Game {
    startScene = () => new MainScene(this);
    resourceLoad = async () => {
        await Game.resourceLoader.autoLoad();
        Log.info("loaded all resources");
        LD59.audio.startMusic("music", true);
        LD59.musicVolume = Game.resourceLoader.getSound("music").volume;
        LD59.music = Game.resourceLoader.getSound("music");
    };

    static STATE = GameState.Planning;

    // tuples aren't hashable??? JS why
    static ANTS = new Set<string>();
    static CURRENT_LEVEL = 1;
    static BACKGROUNDS: number[][][] = [];

    static muted = false;
    static musicPlaying = false;
    static musicVolume = 0.2;
    static music = null;

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

    static restore_music() {
        const music = Game.resourceLoader.getSound("music");

        if (music.volume != LD59.musicVolume) {
            music.volume = LD59.musicVolume;
            console.log("Set music volume");
        }
        if (!music.isPlaying) {
            music.play();
        }
    }
}
