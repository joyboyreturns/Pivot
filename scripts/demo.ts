import { fitMatrix, formatFitMatrix, formatScenario, furniture, routes, scenarios } from "../src/planner";

console.log("PIVOT route report\n");
for (const s of scenarios) console.log(formatScenario(s) + "\n");
console.log("## Fit matrix (every object against every route)");
console.log(formatFitMatrix(fitMatrix(furniture, routes)));
