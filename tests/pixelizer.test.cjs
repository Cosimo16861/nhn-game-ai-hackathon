const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "pixelizer.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const plan = sandbox.window.Pixelizer.createResolutionPlan({
  analysisGridSize: 256,
  paintGridSize: 128,
  paletteSize: 8,
});

assert.equal(plan.analysisGridSize, 256);
assert.equal(plan.paintGridSize, 128);
assert.equal(plan.paintUnitSize, 2);
assert.equal(plan.paletteSize, 8);
assert.equal(Object.isFrozen(plan), true);

const expanded = sandbox.window.Pixelizer.expandPixelGrid(
  ["a", "b", "c", "d"],
  2,
  2,
);
assert.deepEqual(Array.from(expanded), [
  "a", "a", "b", "b",
  "a", "a", "b", "b",
  "c", "c", "d", "d",
  "c", "c", "d", "d",
]);

const reference = Array.from({ length: 16 }, (_, index) => `r${index}`);
const hiddenMask = [
  true, true, false, false,
  true, true, false, false,
  false, false, false, false,
  false, false, false, false,
];
const composite = sandbox.window.Pixelizer.composePixelLayers(
  reference,
  expanded,
  [hiddenMask],
);
assert.deepEqual(Array.from(composite), [
  "a", "a", "r2", "r3",
  "a", "a", "r6", "r7",
  "r8", "r9", "r10", "r11",
  "r12", "r13", "r14", "r15",
]);

const blankComposite = sandbox.window.Pixelizer.composePixelLayers(
  reference,
  sandbox.window.Pixelizer.expandPixelGrid(
    [null, "b", "c", "d"],
    2,
    2,
  ),
  [hiddenMask],
);
assert.equal(blankComposite[0], null);
assert.equal(blankComposite[1], null);
assert.equal(blankComposite[2], "r2");

assert.throws(
  () =>
    sandbox.window.Pixelizer.createResolutionPlan({
      analysisGridSize: 256,
      paintGridSize: 48,
      paletteSize: 8,
    }),
  /정수 배수/,
);

assert.throws(
  () =>
    sandbox.window.Pixelizer.createResolutionPlan({
      analysisGridSize: 256,
      paintGridSize: 64,
      paletteSize: 1,
    }),
  /2~256/,
);

console.log("Pixelizer tests passed.");
