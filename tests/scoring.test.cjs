const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "scoring.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const score = sandbox.window.PixelScoring.calculateColorScore;
const edgeScore = sandbox.window.PixelScoring.calculateEdgeScore;
const structureScore = sandbox.window.PixelScoring.calculateStructureScore;
const paletteScore = sandbox.window.PixelScoring.calculatePaletteScore;
const finalScore = sandbox.window.PixelScoring.calculateFinalScore;
const restorationScores =
  sandbox.window.PixelScoring.calculateRestorationScores;
const target = ["#ff0000", "#00ff00", "#0000ff", "#ffffff"];
const hiddenMask = [true, true, false, false];

const perfect = score(target, target, hiddenMask);
assert.equal(perfect.score, 100);
assert.equal(perfect.hiddenCount, 2);
assert.equal(perfect.filledCount, 2);
assert.equal(perfect.exactMatchCount, 2);
assert.equal(perfect.averageDeltaE, 0);

const blank = score(target, [null, null, "#000000", "#000000"], hiddenMask);
assert.equal(blank.score, 0);
assert.equal(blank.filledCount, 0);
assert.equal(blank.averageDeltaE, null);

const partial = score(
  target,
  ["#ff0000", "#00ee00", "#ffffff", "#ffffff"],
  hiddenMask,
);
assert.ok(partial.score > 50);
assert.ok(partial.score < 100);
assert.equal(partial.exactMatchCount, 1);

assert.throws(
  () => score(["#ffffff"], [], [true]),
  /길이가 일치하지 않습니다/,
);

const edgeGridSize = 8;
const edgeTarget = Array.from(
  { length: edgeGridSize * edgeGridSize },
  (_, index) =>
    index % edgeGridSize < edgeGridSize / 2 ? "#000000" : "#ffffff",
);
const edgeMask = edgeTarget.map(() => true);

const perfectEdge = edgeScore(
  edgeTarget,
  edgeTarget,
  edgeMask,
  edgeGridSize,
);
assert.equal(perfectEdge.score, 100);
assert.equal(perfectEdge.precision, 1);
assert.equal(perfectEdge.recall, 1);

const blankEdge = edgeScore(
  edgeTarget,
  edgeTarget.map(() => null),
  edgeMask,
  edgeGridSize,
);
assert.equal(blankEdge.score, 0);
assert.equal(blankEdge.coverage, 0);

const uniformEdge = edgeScore(
  edgeTarget,
  edgeTarget.map(() => "#000000"),
  edgeMask,
  edgeGridSize,
);
assert.equal(uniformEdge.score, 0);

const shiftedEdgePixels = Array.from(
  { length: edgeGridSize * edgeGridSize },
  (_, index) =>
    index % edgeGridSize < edgeGridSize / 2 - 1 ? "#000000" : "#ffffff",
);
const shiftedEdge = edgeScore(
  edgeTarget,
  shiftedEdgePixels,
  edgeMask,
  edgeGridSize,
);
assert.equal(shiftedEdge.score, 100);

const structurePerfect = structureScore(
  edgeTarget,
  edgeTarget,
  edgeMask,
  edgeGridSize,
);
assert.equal(structurePerfect.score, 100);
assert.equal(structurePerfect.coverage, 1);

const structureBlank = structureScore(
  edgeTarget,
  edgeTarget.map(() => null),
  edgeMask,
  edgeGridSize,
);
assert.equal(structureBlank.score, 0);
assert.equal(structureBlank.coverage, 0);

const structureUniform = structureScore(
  edgeTarget,
  edgeTarget.map(() => "#777777"),
  edgeMask,
  edgeGridSize,
);
assert.ok(structureUniform.score >= 0);
assert.ok(structureUniform.score < 100);

assert.throws(
  () => structureScore(["#ffffff"], [], [true], 1),
  /격자 크기가 일치하지 않습니다/,
);

const palettePerfect = paletteScore(target, target, hiddenMask);
assert.equal(palettePerfect.score, 100);

const paletteBlank = paletteScore(
  target,
  [null, null, "#000000", "#000000"],
  hiddenMask,
);
assert.equal(paletteBlank.score, 0);

const paletteReordered = paletteScore(
  target,
  ["#00ff00", "#ff0000", "#000000", "#000000"],
  hiddenMask,
);
assert.equal(paletteReordered.score, 100);

const combined = finalScore(
  { color: 100, edge: 50, structure: 0, palette: 100 },
  { color: 0.5, edge: 0.3, structure: 0.15, palette: 0.05 },
);
assert.equal(combined, 70);

const restorationPerfect = restorationScores(
  edgeTarget,
  edgeTarget,
  edgeMask,
  edgeGridSize,
  { color: 0.5, edge: 0.3, structure: 0.15, palette: 0.05 },
);
assert.equal(restorationPerfect.color.score, 100);
assert.equal(restorationPerfect.edge.score, 100);
assert.equal(restorationPerfect.structure.score, 100);
assert.equal(restorationPerfect.palette.score, 100);
assert.equal(restorationPerfect.finalScore, 100);
assert.equal(restorationPerfect.gridSize, edgeGridSize);

assert.throws(
  () =>
    finalScore(
      { color: 100, edge: 100, structure: 100, palette: 100 },
      { color: 0.5, edge: 0.3, structure: 0.15, palette: 0.1 },
    ),
  /가중치의 합은 1이어야 합니다/,
);

console.log("Scoring tests passed.");
