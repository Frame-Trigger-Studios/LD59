import {
    Entity,
    Game,
    MathUtil,
    PolySatCollider,
    RectSatCollider,
    Sprite,
    TextDisp,
    TiledMap,
    TiledMapLoader
} from "lagom-engine";
import levels from "./assets/Levels.json";
import {LanderPlaceholder} from "./Lander";
import {LandingPad} from "./LandingPad";
import {Layers, LD59, Palette} from "./LD59";
import {Antenna} from "./antenna";

export class Tile extends Entity {
    constructor(readonly tileId: number, readonly x: number, readonly y: number) {
        super("tile", x, y, Layers.SOLIDS);
    }

    onAdded() {
        super.onAdded();

        if (this.tileId !== 7) {
            this.addComponent(new Sprite(Game.resourceLoader.get("tiles").tileIdx(this.tileId), {
                xAnchor: 0.5,
                yAnchor: 0.5
            }));
        } else {
            const pos = this.transform.getGlobalPosition();
            console.log(pos);
            this.addComponent(new Sprite(Game.resourceLoader.get("square").tileIdx(((pos.x / 64) + (pos.y / 64) * 7) % 8), {
                xAnchor: 0.5,
                yAnchor: 0.5,
                rotation: MathUtil.degToRad(MathUtil.randomRange(0, 4) * 90)
            }));
        }

        switch (this.tileId) {
            case 4:
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[0, 8], [8, -8], [8, 8]]}));
                break;
            case 5:
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[-8, -8], [0, 8], [-8, 8]]}));
                break;
            case 7:
                this.addComponent(new RectSatCollider({
                    layer: Layers.SOLIDS,
                    xOff: -8,
                    yOff: -8,
                    width: 16,
                    height: 16
                }));
                break;
            case 8:
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[0, -8], [8, -8], [8, 8], [-8, 8]]
                }));
                break;
            case 9:
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[-8, -8], [0, -8], [8, 8], [-8, 8]]
                }));
                break;
            case 10:
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[8, -8], [8, 8], [-8, 8]]}));
                break;
            case 11:
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[-8, -8], [8, 8], [-8, 8]]}));
                break;
            case 12:
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[0, 8], [8, 8], [8, -8], [-8, -8]]
                }));
                break;
            case 13:
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[-8, 8], [0, 8], [8, -8], [-8, -8]]
                }));
                break;
            case 14:
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[8, 8], [8, -8], [-8, -8]]}));
                break;
            case 15:
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[-8, 8], [8, -8], [-8, -8]]}));
                break;
            case 16:
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[0, -8], [8, 8], [8, -8]]}));
                break;
            case 17:
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[-8, 8], [0, -8], [-8, -8]]}));
                break;
            case 20:
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[-8, 8], [8, 0], [8, 8]]}));
                break;
            case 21:
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[-8, 0], [8, -8], [8, 8], [-8, 8]]
                }));
                break;
            case 22:
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[8, 0], [-8, -8], [-8, 8], [8, 8]]
                }));
                break;
            case 23:
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[8, 8], [-8, 0], [-8, 8]]}));
                break;
            case 24:
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[-8, -8], [8, 0], [8, -8]]}));
                break;
            case 25:
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[-8, 0], [8, 8], [8, -8], [-8, -8]]
                }));
                break;
            case 26:
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[8, 0], [-8, 8], [-8, -8], [8, -8]]
                }));
                break;
            case 27:
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[8, -8], [-8, 0], [-8, -8]]}));
                break;

        }
    }
}

export class LevelLoader
    extends Entity {
    constructor(readonly levelId: number = 1, clearAntenna = false) {
        super("loader", 0, 0);
        if (clearAntenna) {
            LD59.ANTS.clear();
        }
    }

    onAdded() {
        super.onAdded();

        const loader = new TiledMapLoader(levels as TiledMap);

        this.scene.addGUIEntity(new Instr(LD59.GAME_WIDTH / 2, 6, "Press Space To Start", 12 ,true, "main_text"))

        loader.loadFn(`Level${this.levelId}`, (tileId, x, y) => {
            tileId = tileId - 1;
            x = x + 8;
            y = y + 8;

            switch (tileId) {
                case 0:
                    // Empty
                    break;
                case 3:
                    // Player
                    this.scene.addEntity(new LanderPlaceholder(x, y));
                    break;
                case 32:
                case 33:
                case 34:
                case 35:
                    // Landing pad
                    this.scene.addEntity(new LandingPad(x, y, tileId - 32));
                    break;
                case 2:
                    this.scene.addGUIEntity(new Instr(x, y + 12, "Click next to a wall\nto place an antenna\n\nThe lander needs to be in \nrange to be controllable\n\n\n\nPress Space to start\n\n\n\nUse WASD to control the lander", 8));
                    break;
                case 1:
                    this.scene.addGUIEntity(new Instr(x, y + 12, "Aim for the  ↑\nlanding pad"));
                    break;
                case 6:
                    this.scene.addGUIEntity(new Instr(x - 140, y - 64, "You can only\nplace an antenna\non a flat surface"));
                    break;
                case 19:
                    this.scene.addGUIEntity(new Instr(x + 8, y + 16, "    Faster\n    = More Points\n\nFewer Antennas\n= Even More Points", 8));
                    break;
                case 18:
                    this.scene.addGUIEntity(new Instr(x + 12, y + 16, "Click an antenna\nagain to remove it"));
                    break;
                case 28:
                    this.scene.addGUIEntity(new Instr(x, y + 16, "You don't have to\nland slowly\n\n   ...or upright", 8));
                    break;
                case 29:
                    this.scene.addGUIEntity(new Instr(x, y + 16, "Press R to quick restart", 8));
                    break;
                case 30:
                    this.scene.addGUIEntity(new Instr(x, y + 16, "Thanks for playing!\n\nYou can use the '[' and ']' keys to cycle\nbetween levels to play them again", 14, true));
                    break;
                case 31:
                    this.scene.addGUIEntity(new Instr(x, y + 16, "This is the last level!\n\nYou can use the '[' and ']' keys to cycle\nbetween levels to play them again", 8));
                    break;
                default:
                    this.scene.addEntity(new Tile(tileId, x, y));
                    break;
            }
        });

        LD59.ANTS.forEach((_, value) => {
            const data = JSON.parse(value);
            this.getScene().addEntity(new Antenna(data[0], data[1], data[2]));
        })

        this.destroy();
    }
}

export class Instr extends Entity {
    constructor(x: number, y: number, readonly text: string, readonly size = 12, readonly centre = false, name = "instr") {
        super(name, x, y, Layers.GUI);
    }

    onAdded() {
        super.onAdded();
        const txt = this.addComponent(new TextDisp(0, 0, this.text, {
            fontFamily: "retro",
            fill: Palette.CREAM,
            fontSize: this.size,
        }));
        if (this.centre) {
            txt.pixiObj.anchor.set(0.5);
        }
    }
}