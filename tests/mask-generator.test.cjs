const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "mask-generator.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const gridSize = 64;
const pixels = Array.from({ length: gridSize * gridSize }, (_, index) => {
  const row = Math.floor(index / gridSize);
  const column = index % gridSize;
  const insideObject =
    row >= 16 && row < 48 && column >= 16 && column < 48;
  return insideObject ? "#ff8844" : "#101828";
});

const options = { gridSize, hiddenQuadrantCount: 2, seed: 12345 };
const first = sandbox.window.MaskGenerator.generateMask(pixels, options);
const second = sandbox.window.MaskGenerator.generateMask(pixels, options);
const quadrantPixelCount = (gridSize / 2) ** 2;

assert.equal(first.hiddenMask.length, gridSize * gridSize);
assert.equal(first.playerPixels.length, gridSize * gridSize);
assert.equal(first.hiddenCountA, quadrantPixelCount);
assert.equal(first.hiddenCountB, quadrantPixelCount);
assert.equal(first.hiddenCount, first.hiddenCountA + first.hiddenCountB);
assert.equal(
  first.hiddenMaskA.filter(Boolean).length,
  first.hiddenCountA,
);
assert.equal(
  first.hiddenMaskB.filter(Boolean).length,
  first.hiddenCountB,
);
assert.equal(first.hiddenMask.filter(Boolean).length, first.hiddenCount);
assert.ok(
  first.hiddenMaskA.every(
    (hidden, index) => !hidden || !first.hiddenMaskB[index],
  ),
);
assert.equal(first.hiddenQuadrants.length, 2);
assert.equal(new Set(first.hiddenQuadrants).size, 2);
assert.deepEqual(first.hiddenMask, second.hiddenMask);
assert.deepEqual(first.hiddenMaskA, second.hiddenMaskA);
assert.deepEqual(first.hiddenMaskB, second.hiddenMaskB);
assert.deepEqual(first.hiddenQuadrants, second.hiddenQuadrants);
assert.equal(
  first.playerPixels.filter((pixel) => pixel === null).length,
  first.hiddenCount,
);

console.log("Mask generator tests passed.");
