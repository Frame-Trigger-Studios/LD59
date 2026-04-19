import {
    Entity,
    Game,
    PolySatCollider,
    RectSatCollider,
    RenderPoly,
    RenderRect,
    Sprite,
    TiledMap,
    TiledMapLoader
} from "lagom-engine";
import levels from "./assets/Levels.json";
import {LanderPlaceholder} from "./Lander";
import {LandingPad} from "./LandingPad";
import {Layers} from "./LD59";

export class Tile extends Entity {
    constructor(readonly tileId: number, readonly x: number, readonly y: number) {
        super("tile", x, y);
    }

    onAdded() {
        super.onAdded();

        // this.addComponent(new Sprite(Game.resourceLoader.get("tiles").tileIdx(this.tileId), {
        //     xAnchor: 0.5,
        //     yAnchor: 0.5
        // }));

        const debug = false;

        switch (this.tileId) {
            case 4:
                if (debug) this.addComponent(new RenderPoly([[0, 8], [8, -8], [8, 8]]));
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[0, 8], [8, -8], [8, 8]]}));
                break;
            case 5:
                if (debug) this.addComponent(new RenderPoly([[-8, -8], [0, 8], [-8, 8]]));
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[-8, -8], [0, 8], [-8, 8]]}));
                break;
            case 7:
                if (debug) this.addComponent(new RenderRect({width: 16, height: 16, yOff: -8, xOff: -8}));
                this.addComponent(new RectSatCollider({
                    layer: Layers.SOLIDS,
                    xOff: -8,
                    yOff: -8,
                    width: 16,
                    height: 16
                }));
                break;
            case 8:
                if (debug) this.addComponent(new RenderPoly([[0, -8], [8, -8], [8, 8], [-8, 8]]));
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[0, -8], [8, -8], [8, 8], [-8, 8]]
                }));
                break;
            case 9:
                if (debug) this.addComponent(new RenderPoly([[-8, -8], [0, -8], [8, 8], [-8, 8]]));
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[-8, -8], [0, -8], [8, 8], [-8, 8]]
                }));
                break;
            case 10:
                if (debug) this.addComponent(new RenderPoly([[8, -8], [8, 8], [-8, 8]]));
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[8, -8], [8, 8], [-8, 8]]}));
                break;
            case 11:
                if (debug) this.addComponent(new RenderPoly([[-8, -8], [8, 8], [-8, 8]]));
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[-8, -8], [8, 8], [-8, 8]]}));
                break;
            case 12:
                if (debug) this.addComponent(new RenderPoly([[0, 8], [8, 8], [8, -8], [-8, -8]]));
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[0, 8], [8, 8], [8, -8], [-8, -8]]
                }));
                break;
            case 13:
                if (debug) this.addComponent(new RenderPoly([[-8, 8], [0, 8], [8, -8], [-8, -8]]));
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[-8, 8], [0, 8], [8, -8], [-8, -8]]
                }));
                break;
            case 14:
                if (debug) this.addComponent(new RenderPoly([[8, 8], [8, -8], [-8, -8]]));
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[8, 8], [8, -8], [-8, -8]]}));
                break;
            case 15:
                if (debug) this.addComponent(new RenderPoly([[-8, 8], [8, -8], [-8, -8]]));
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[-8, 8], [8, -8], [-8, -8]]}));
                break;
            case 16:
                if (debug) this.addComponent(new RenderPoly([[0, -8], [8, 8], [8, -8]]));
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[0, -8], [8, 8], [8, -8]]}));
                break;
            case 17:
                if (debug) this.addComponent(new RenderPoly([[-8, 8], [0, -8], [-8, -8]]));
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[-8, 8], [0, -8], [-8, -8]]}));
                break;
            case 20:
                if (debug) this.addComponent(new RenderPoly([[-8, 8], [8, 0], [8, 8]]));
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[-8, 8], [8, 0], [8, 8]]}));
                break;
            case 21:
                if (debug) this.addComponent(new RenderPoly([[-8, 0], [8, -8], [8, 8], [-8, 8]]));
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[-8, 0], [8, -8], [8, 8], [-8, 8]]
                }));
                break;
            case 22:
                if (debug) this.addComponent(new RenderPoly([[8, 0], [-8, -8], [-8, 8], [8, 8]]));
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[8, 0], [-8, -8], [-8, 8], [8, 8]]
                }));
                break;
            case 23:
                if (debug) this.addComponent(new RenderPoly([[8, 8], [-8, 0], [-8, 8]]));
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[8, 8], [-8, 0], [-8, 8]]}));
                break;
            case 24:
                if (debug) this.addComponent(new RenderPoly([[-8, -8], [8, 0], [8, -8]]));
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[-8, -8], [8, 0], [8, -8]]}));
                break;
            case 25:
                if (debug) this.addComponent(new RenderPoly([[-8, 0], [8, 8], [8, -8], [-8, -8]]));
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[-8, 0], [8, 8], [8, -8], [-8, -8]]
                }));
                break;
            case 26:
                if (debug) this.addComponent(new RenderPoly([[8, 0], [-8, 8], [-8, -8], [8, -8]]));
                this.addComponent(new PolySatCollider({
                    layer: Layers.SOLIDS,
                    points: [[8, 0], [-8, 8], [-8, -8], [8, -8]]
                }));
                break;
            case 27:
                if (debug) this.addComponent(new RenderPoly([[8, -8], [-8, 0], [-8, -8]]));
                this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[8, -8], [-8, 0], [-8, -8]]}));
                break;

        }
    }
}

export class LevelLoader
    extends Entity {
    constructor(readonly levelId: number = 1) {
        super("loader", 0, 0);
    }

    onAdded() {
        super.onAdded();

        const loader = new TiledMapLoader(levels as TiledMap);

        loader.loadFn(`Level${this.levelId}`, (tileId, x, y) => {
            tileId = tileId - 1;
            x = x + 8;
            y = y + 8;

            if (tileId === 28) {
                // Player
                this.scene.addEntity(new LanderPlaceholder(x, y));
            } else if (tileId === 29) {
                // Landing pad
                this.scene.addEntity(new LandingPad(x, y));
            } else if (tileId !== 0) {
                this.scene.addEntity(new Tile(tileId, x, y));
            }
        });

        this.destroy();
    }
}