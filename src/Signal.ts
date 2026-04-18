import {Button, Component, Game, GlobalSystem} from "lagom-engine";
import {Layers} from "./LD59";


export class InRange extends Component {}
export class LineOfSight extends GlobalSystem<[]> {
    types: [] = [];

    update(delta: number): void {
        // if line of sight between antenna and lander
        // add component
        // else
        // remove component
    }
}