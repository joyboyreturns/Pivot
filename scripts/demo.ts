import { fitMatrix, formatFitMatrix, formatScenario, objectLibrary, placeLibrary, scenarios } from "../src/planner";

console.log("PIVOT route report\n");
for (const s of scenarios) console.log(formatScenario(s) + "\n");

const boxes = Object.fromEntries(objectLibrary.map((o) => [o.name, o.box]));
const routes = Object.fromEntries(placeLibrary.map((p) => [p.name, p.gates]));
console.log("## Will it fit? Every object in the library against every place");
console.log(formatFitMatrix(fitMatrix(boxes, routes)));
