import "./main.css";
import { LD59 } from "./LD59";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div id="main" style="align-items: center; justify-content: center; height: 100%; display: flex">
  </div>
  <!--  <canvas id="detect-render" width="768" height="768""></canvas>-->
`;
const main = document.querySelector<HTMLDivElement>("#main")!;
const game = new LD59();

game.start().then(() => {
    main.appendChild(game.application.canvas);
    game.application.canvas.focus();
});
