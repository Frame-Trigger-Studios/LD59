import {Entity, Game, MathUtil, PolySatCollider, RectSatCollider, Sprite, TiledMap, TiledMapLoader} from "lagom-engine";
import levels from "./assets/Levels.json";
import {LanderPlaceholder} from "./Lander";
import {LandingPad} from "./LandingPad";
import {Layers, LD59} from "./LD59";
import {Antenna} from "./antenna";

export class Tile extends Entity {
    constructor(readonly tileId: number, readonly x: number, readonly y: number) {
        super("tile", x, y);
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