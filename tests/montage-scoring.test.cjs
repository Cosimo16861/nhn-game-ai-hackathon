const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const scoringSource = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "scoring.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(scoringSource, sandbox);

const montageScoring = require("../scripts/montage-scoring.js");
const gridSize = 4;
const targetPixels = Array.from({ length: 16 }, (_, index) =>
  index % gridSize < 2 ? "#AA3322" : "#227744",
);
const leftMask = targetPixels.map((_, index) => index % gridSize < 2);
const rightMask = leftMask.map((value) => !value);
const regionMasks = { left: leftMask, right: rightMask };
const regionDefinitions = [
  { id: "left", label: "왼쪽", weight: 0.5 },
  { id: "right", label: "오른쪽", weight: 0.5 },
];

function evaluate(playerPixels) {
  return montageScoring.evaluate({
    targetPixels,
    playerPixels,
    regionMasks,
    regionDefinitions,
    gridSize,
    scoring: sandbox.window.PixelScoring,
  });
}

const perfect = evaluate(targetPixels.slice());
assert.equal(perfect.finalScore, 100);
assert.equal(perfect.coverage, 1);
assert.equal(perfect.passed, true);
assert.equal(perfect.regions.every((region) => region.passed), true);

const blank = evaluate(targetPixels.map(() => null));
assert.equal(blank.finalScore, 0);
assert.equal(blank.coverage, 0);
assert.equal(blank.passed, false);

const missingRight = evaluate(
  targetPixels.map((color, index) => (rightMask[index] ? null : color)),
);
assert.equal(missingRight.regions[0].passed, true);
assert.equal(missingRight.regions[1].passed, false);
assert.equal(missingRight.weakestRegion.id, "right");
assert.equal(missingRight.passed, false);

assert.throws(
  () => montageScoring.evaluate({
    targetPixels,
    playerPixels: targetPixels,
    regionMasks,
    regionDefinitions: [
      { id: "left", label: "왼쪽", weight: 0.8 },
      { id: "right", label: "오른쪽", weight: 0.8 },
    ],
    gridSize,
    scoring: sandbox.window.PixelScoring,
  }),
  /비중의 합은 1/,
);

console.log("Montage scoring tests passed.");
