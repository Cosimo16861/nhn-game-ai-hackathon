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

const options = {
  gridSize,
  regionsPerSide: 4,
  hiddenRegionCount: 3,
  seed: 12345,
};
const first = sandbox.window.MaskGenerator.generateMask(pixels, options);
const second = sandbox.window.MaskGenerator.generateMask(pixels, options);
const regionPixelCount = (gridSize / options.regionsPerSide) ** 2;

assert.equal(first.hiddenMask.length, gridSize * gridSize);
assert.equal(first.playerPixels.length, gridSize * gridSize);
for (const hiddenCount of [
  first.hiddenCountA,
  first.hiddenCountB,
  first.hiddenCountC,
]) {
  assert.ok(hiddenCount > regionPixelCount * 0.45);
  assert.ok(hiddenCount < regionPixelCount * 0.8);
}
assert.equal(first.maskStyle, "irregular");
assert.equal(
  first.hiddenCount,
  first.hiddenCountA + first.hiddenCountB + first.hiddenCountC,
);
assert.equal(
  first.hiddenMaskA.filter(Boolean).length,
  first.hiddenCountA,
);
assert.equal(
  first.hiddenMaskB.filter(Boolean).length,
  first.hiddenCountB,
);
assert.equal(
  first.hiddenMaskC.filter(Boolean).length,
  first.hiddenCountC,
);
assert.equal(first.hiddenMask.filter(Boolean).length, first.hiddenCount);
assert.ok(
  first.hiddenMaskA.every(
    (hidden, index) =>
      !hidden || (!first.hiddenMaskB[index] && !first.hiddenMaskC[index]),
  ),
);
assert.ok(
  first.hiddenMaskB.every(
    (hidden, index) => !hidden || !first.hiddenMaskC[index],
  ),
);
assert.equal(first.hiddenRegions.length, 3);
assert.equal(new Set(first.hiddenRegions).size, 3);
assert.deepEqual(first.hiddenMask, second.hiddenMask);
assert.deepEqual(first.hiddenMaskA, second.hiddenMaskA);
assert.deepEqual(first.hiddenMaskB, second.hiddenMaskB);
assert.deepEqual(first.hiddenMaskC, second.hiddenMaskC);
assert.deepEqual(first.hiddenRegions, second.hiddenRegions);
assert.equal(
  first.playerPixels.filter((pixel) => pixel === null).length,
  first.hiddenCount,
);

const fixed = sandbox.window.MaskGenerator.generateMask(pixels, {
  gridSize,
  regionsPerSide: 4,
  hiddenRegionCount: 3,
  hiddenRegions: [0, 4, 15],
});
assert.deepEqual(
  Array.from(fixed.hiddenRegions),
  [0, 4, 15],
);
assert.ok(fixed.hiddenCount < regionPixelCount * 3);

const dual = sandbox.window.MaskGenerator.generateDualResolutionMasks(
  Array(256 * 256).fill("#112233"),
  Array(128 * 128).fill("#112233"),
  {
    analysisGridSize: 256,
    paintGridSize: 128,
    regionsPerSide: 4,
    hiddenRegionCount: 3,
    hiddenRegions: [0, 4, 15],
  },
);
assert.deepEqual(Array.from(dual.hiddenRegions), [0, 4, 15]);
assert.deepEqual(
  Array.from(dual.analysisMask.hiddenRegions),
  Array.from(dual.paintMask.hiddenRegions),
);
assert.equal(dual.analysisMask.hiddenMask.length, 256 * 256);
assert.equal(dual.paintMask.hiddenMask.length, 128 * 128);
assert.equal(dual.scale, 2);
assert.equal(
  dual.analysisMask.hiddenCountA,
  dual.paintMask.hiddenCountA * 4,
);
assert.equal(
  dual.analysisMask.hiddenCountB,
  dual.paintMask.hiddenCountB * 4,
);
assert.equal(
  dual.analysisMask.hiddenCountC,
  dual.paintMask.hiddenCountC * 4,
);
assert.equal(
  dual.analysisMask.hiddenCount,
  dual.paintMask.hiddenCount * 4,
);
assert.ok(dual.paintMask.hiddenCount < 3072);
assert.ok(dual.paintMask.hiddenCount > 3072 * 0.45);
for (let paintIndex = 0; paintIndex < 128 * 128; paintIndex++) {
  const paintRow = Math.floor(paintIndex / 128);
  const paintColumn = paintIndex % 128;
  const expected = dual.paintMask.hiddenMask[paintIndex];
  for (let rowOffset = 0; rowOffset < 2; rowOffset++) {
    for (let columnOffset = 0; columnOffset < 2; columnOffset++) {
      const analysisIndex =
        (paintRow * 2 + rowOffset) * 256 +
        paintColumn * 2 +
        columnOffset;
      assert.equal(
        dual.analysisMask.hiddenMask[analysisIndex],
        expected,
      );
    }
  }
}

const block = sandbox.window.MaskGenerator.generateMask(pixels, {
  ...options,
  maskStyle: "block",
});
assert.equal(block.hiddenCountA, regionPixelCount);
assert.equal(block.hiddenCountB, regionPixelCount);
assert.equal(block.hiddenCountC, regionPixelCount);
assert.equal(block.maskStyle, "block");

assert.throws(
  () =>
    sandbox.window.MaskGenerator.generateMask(pixels, {
      gridSize,
      regionsPerSide: 4,
      hiddenRegionCount: 3,
      hiddenRegions: [0, 4, 4],
    }),
  /서로 다른 세 개/,
);

console.log("Mask generator tests passed.");
