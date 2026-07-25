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

console.log("Scoring tests passed.");
