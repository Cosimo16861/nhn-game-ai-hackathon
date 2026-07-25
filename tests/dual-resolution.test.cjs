const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sandbox = { window: {} };
vm.createContext(sandbox);

[
  "pixelizer.js",
  "mask-generator.js",
  "scoring.js",
].forEach((fileName) => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "scripts", fileName),
    "utf8",
  );
  vm.runInContext(source, sandbox);
});

const paintGridSize = 128;
const analysisGridSize = 256;
const paintUnitSize = 2;
const paintPixels = Array.from(
  { length: paintGridSize * paintGridSize },
  (_, index) =>
    (Math.floor(index / paintGridSize) + index) % 2 === 0
      ? "#223344"
      : "#ddaa55",
);
const analysisPixels = sandbox.window.Pixelizer.expandPixelGrid(
  paintPixels,
  paintGridSize,
  paintUnitSize,
);
const masks =
  sandbox.window.MaskGenerator.generateDualResolutionMasks(
    analysisPixels,
    paintPixels,
    {
      analysisGridSize,
      paintGridSize,
      regionsPerSide: 4,
      hiddenRegionCount: 3,
      hiddenRegions: [0, 4, 15],
    },
  );
const weights = {
  color: 0.5,
  edge: 0.3,
  structure: 0.15,
  palette: 0.05,
};

const perfect = sandbox.window.PixelScoring.calculateRestorationScores(
  analysisPixels,
  analysisPixels,
  masks.analysisMask.hiddenMask,
  analysisGridSize,
  weights,
);
assert.equal(perfect.finalScore, 100);
assert.equal(perfect.color.hiddenCount, 3 * 64 * 64);

const blankAnalysisPixels = sandbox.window.Pixelizer.expandPixelGrid(
  Array(paintGridSize * paintGridSize).fill(null),
  paintGridSize,
  paintUnitSize,
);
const blank = sandbox.window.PixelScoring.calculateRestorationScores(
  analysisPixels,
  blankAnalysisPixels,
  masks.analysisMask.hiddenMask,
  analysisGridSize,
  weights,
);
assert.equal(blank.color.score, 0);
assert.equal(blank.color.filledCount, 0);
assert.equal(blank.finalScore, 0);

const halfPlayerPixels = paintPixels.map((color, index) =>
  masks.paintMask.hiddenMask[index] ? null : color,
);
const hiddenPaintIndices = masks.paintMask.hiddenMask
  .map((hidden, index) => (hidden ? index : -1))
  .filter((index) => index >= 0);
hiddenPaintIndices
  .slice(0, hiddenPaintIndices.length / 2)
  .forEach((index) => {
    halfPlayerPixels[index] = paintPixels[index];
  });
const halfAnalysisPixels = sandbox.window.Pixelizer.expandPixelGrid(
  halfPlayerPixels,
  paintGridSize,
  paintUnitSize,
);
const half = sandbox.window.PixelScoring.calculateRestorationScores(
  analysisPixels,
  halfAnalysisPixels,
  masks.analysisMask.hiddenMask,
  analysisGridSize,
  weights,
);
assert.equal(half.color.score, 50);
assert.ok(half.finalScore > 35);
assert.ok(half.finalScore < 60);

console.log("Dual-resolution integration tests passed.");
