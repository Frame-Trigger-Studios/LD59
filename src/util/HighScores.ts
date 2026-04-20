import {Component, Entity, Game, newSystem, RenderRect, Sprite, TextDisp, types} from "lagom-engine";
import {GameState, LD59, Palette} from "../LD59";

// TODO make this more generic
// TODO update values before use
// TODO check the colours
const submitUrl = "https://quackqack.pythonanywhere.com/GAME/submit";
const leaderboardUrl = "https://quackqack.pythonanywhere.com/leaderboard"
const secret = "";

export async function submitScore(name: string, score: number) {

    const hash = await sha256(score + secret);

    try {
        const resp = await fetch(submitUrl, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({name, score, hash}),
            signal: AbortSignal.timeout(5000),
        });
        return resp.ok;
    } catch (e) {
        return false;
    }
}

async function sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getScores(): Promise<Score[] | null> {
    try {
        const resp = await fetch(leaderboardUrl, {
            signal: AbortSignal.timeout(5000),
        });
        if (!resp.ok) {
            return null;
        }
        return resp.json().then((data) => data.slice(0, 10));
    } catch (error) {
        return null;
    }
}

interface Score {
    name: string;
    score: number;
}

class NameComp extends Component {
    static NAME_LENGTH = 6;
    static letters: string[] = "_".repeat(NameComp.NAME_LENGTH).split("");
    static index: number = 0;
}

class RenderName extends TextDisp {
}

export class SubmitScore extends Entity {
    constructor(readonly score: number, readonly time: number) {
        super("submitter", Game.GAME_WIDTH / 2, 0);
    }

    onAdded() {
        super.onAdded();

        this.addComponent(
            new RenderRect(
                {
                    xOff: -80,
                    yOff: 30,
                    width: 160,
                    height: Game.GAME_HEIGHT - 120,
                },
                Palette.DARK_BLUE,
                Palette.BLUE,
            ),
        );

        this.addComponent(
            new TextDisp(0, 40, "New Best Time!", {
                fontFamily: "retro",
                fill: Palette.CREAM,
                fontSize: 14,
            }),
        ).pixiObj.anchor.set(0.5);

        this.addComponent(
            new TextDisp(0, 80, "Enter Name", {
                fontFamily: "retro",
                fill: Palette.CREAM,
                fontSize: 12,
            }),
        ).pixiObj.anchor.set(0.5);

        this.addComponent(
            new RenderName(0, 100, "___", {
                fontFamily: "retro",
                fill: Palette.CREAM,
                fontSize: 16,
            }),
        ).pixiObj.anchor.set(0.5);

        this.addComponent(
            new TextDisp(0, 150, "Press Enter\nto Submit", {
                fontFamily: "retro",
                fill: Palette.PINK,
                align: "center",
                fontSize: 10,
            }),
        ).pixiObj.anchor.set(0.5);

        const nameComp = this.addComponent(new NameComp());

        const updateName = (e: KeyboardEvent) => {
            const key = e.key;

            if (/^[a-zA-Z0-9]$/.test(key) && NameComp.index < NameComp.NAME_LENGTH) {
                NameComp.letters[NameComp.index] = key;
                NameComp.index = (NameComp.index + 1) % (NameComp.NAME_LENGTH + 1);
            } else if (key === "Backspace" && NameComp.index > 0) {
                NameComp.index = (NameComp.index - 1 + NameComp.letters.length) % NameComp.NAME_LENGTH;
                NameComp.letters[NameComp.index] = "_";
            } else if (key === "Enter" && NameComp.index != 0) {
                submitScore(NameComp.letters.slice(0, NameComp.index).join(""), this.score).then((success) => {
                    document.removeEventListener("keydown", updateName);
                    this.destroy();
                    this.scene.addGUIEntity(new HighScores(this.score, this.time, success));
                });
            }
        };

        document.addEventListener("keydown", updateName);

        this.scene.addFnSystem(
            newSystem(types(NameComp, RenderName), (delta, entity, name, txt) => {
                txt.pixiObj.text = NameComp.letters.join("");
            }),
        );
    }
}

export class HighScores extends Entity {
    constructor(
        readonly score: number,
        readonly time: number,
        readonly submitSuccess: boolean,
    ) {
        super("highscores", Game.GAME_WIDTH / 2, 0);
    }

    onAdded() {
        super.onAdded();

        this.addComponent(
            new RenderRect(
                {
                    xOff: -80,
                    yOff: 30,
                    width: 160,
                    height: Game.GAME_HEIGHT - 120,
                },
                Palette.DARK_BLUE,
                Palette.BLUE,
            ),
        );
        this.addComponent(
            new TextDisp(0, 40, "Leaderboard", {
                fontFamily: "retro",
                fill: Palette.CREAM,
                fontSize: 14,
            }),
        ).pixiObj.anchor.set(0.5);

        // Add score breakdown
        this.addComponent(new Sprite(Game.resourceLoader.get("stopwatch").tileIdx(0), {
            xAnchor: 0.5,
            yAnchor: 0.5,
            xOffset: -36,
            yOffset: 180
        }));

        this.addComponent(
            new TextDisp(-16, 180, this.time.toFixed(2), {
                fontFamily: "retro",
                fill: Palette.CREAM,
                fontSize: 10,
            }),
        ).pixiObj.anchor.set(0, 0.5);

        this.addComponent(new Sprite(Game.resourceLoader.get("antenna").tileIdx(0), {
            xAnchor: 0.5,
            yAnchor: 0.5,
            xOffset: -36,
            yOffset: 205
        }));
        this.addComponent(new Sprite(Game.resourceLoader.get("antenna_active").tileIdx(0), {
            xAnchor: 0.5,
            yAnchor: 1,
            xOffset: -36,
            yOffset: 205
        }));

        this.addComponent(
            new TextDisp(-16, 205, `+${LD59.ANTS.size * 5}  (${LD59.ANTS.size} x 5)`, {
                fontFamily: "retro",
                fill: Palette.CREAM,
                fontSize: 10,
            }),
        ).pixiObj.anchor.set(0, 0.5);

        this.addComponent(
            new TextDisp(0, 228, `Your Time: ${this.score.toFixed(2)}`, {
                fontFamily: "retro",
                fill: Palette.CREAM,
                fontSize: 10,
            }),
        ).pixiObj.anchor.set(0.5);

        LD59.STATE = GameState.Win;

        this.addComponent(
            new TextDisp(0, 248, `Press Space to go to\nnext level or R to restart `, {
                fontFamily: "retro",
                fill: Palette.PINK,
                fontSize: 8,
                align: "center",
            }),
        ).pixiObj.anchor.set(0.5);

        if (!this.submitSuccess) {
            this.addComponent(
                new TextDisp(0, 166, "Failed to submit time", {
                    fontFamily: "retro",
                    fill: Palette.PINK,
                    fontSize: 6,
                }),
            ).pixiObj.anchor.set(0.5);
        }

        getScores().then((scores) => {
            if (scores === null) {
                this.addComponent(
                    new TextDisp(0, 102, "Error\nFetching Leaderboard", {
                        fontFamily: "retro",
                        fill: Palette.CREAM,
                        align: "center",
                        fontSize: 10,
                    }),
                ).pixiObj.anchor.set(0.5);
                return;
            }

            let yoff = 56;
            scores.forEach((score) => {
                this.addComponent(
                    new TextDisp(-70, yoff, score.name, {
                        fontFamily: "retro",
                        fill: Palette.CREAM,
                        fontSize: 10,
                    }),
                );

                this.addComponent(
                    new TextDisp(10, yoff, score.score.toString(), {
                        fontFamily: "retro",
                        align: "left",

                        fill: Palette.CREAM,
                        fontSize: 10,
                    }),
                );

                yoff += 10;
            });
        });
    }
}
