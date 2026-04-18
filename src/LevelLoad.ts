import {Entity, Game, RectSatCollider, Sprite, TiledMap, TiledMapLoader} from "lagom-engine";
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

        this.addComponent(new Sprite(Game.resourceLoader.get("tiles").tileIdx(this.tileId), {
            xAnchor: 0.5,
            yAnchor: 0.5
        }));

        // TODO make all of the wall hitboxes make sense
        this.addComponent(new RectSatCollider({layer: Layers.SOLIDS, xOff: -8, yOff: -8, width: 16, height: 16}));

        switch (this.tileId) {
            case 4:
            // this.addComponent(new PolySatCollider({layer: Layers.SOLIDS, points: [[0, 8], [-8, 8], [8, 8]], }));
        }
    }
}

export class LevelLoader extends Entity {
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