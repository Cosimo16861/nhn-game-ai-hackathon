const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(
    __dirname,
    "..",
    "scripts",
    "clip-region-preparer.js",
  ),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const { getRegionCropBounds, prepareRegionPairs } =
  sandbox.window.CLIPRegionPreparer;

const topLeft = getRegionCropBounds(0, 256, 4, 0.25);
assert.deepEqual(
  {
    x: topLeft.x,
    y: topLeft.y,
    size: topLeft.size,
    regionSize: topLeft.regionSize,
  },
  { x: 0, y: 0, size: 96, regionSize: 64 },
);

const middleLeft = getRegionCropBounds(4, 256, 4, 0.25);
assert.equal(middleLeft.x, 0);
assert.equal(middleLeft.y, 48);
assert.equal(middleLeft.size, 96);

const bottomRight = getRegionCropBounds(15, 256, 4, 0.25);
assert.equal(bottomRight.x, 160);
assert.equal(bottomRight.y, 160);
assert.equal(bottomRight.size, 96);

assert.throws(
  () => getRegionCropBounds(16, 256, 4, 0.25),
  /좌표 설정/,
);

function createFakeCanvas(label, width = 0, height = 0) {
  const calls = [];
  return {
    label,
    width,
    height,
    calls,
    getContext(type) {
      assert.equal(type, "2d");
      return {
        imageSmoothingEnabled: true,
        clearRect(...args) {
          calls.push(["clearRect", ...args]);
        },
        drawImage(...args) {
          calls.push(["drawImage", ...args]);
        },
      };
    },
  };
}

const referenceCanvas = createFakeCanvas("reference", 512, 512);
const restoredCanvas = createFakeCanvas("restored", 512, 512);
let outputIndex = 0;
const pairs = prepareRegionPairs({
  referenceCanvas,
  restoredCanvas,
  hiddenRegions: [0, 4, 15],
  clipPrompts: ["prompt A", "prompt B", "prompt C"],
  createCanvas: () => createFakeCanvas(`output-${outputIndex++}`),
});

assert.equal(pairs.length, 3);
assert.equal(Object.isFrozen(pairs), true);
assert.deepEqual(
  Array.from(pairs, (pair) => pair.regionIndex),
  [0, 4, 15],
);
assert.deepEqual(
  Array.from(pairs, (pair) => pair.prompt),
  ["prompt A", "prompt B", "prompt C"],
);
assert.equal(pairs[0].referenceCanvas.width, 224);
assert.equal(pairs[0].referenceCanvas.height, 224);
assert.equal(pairs[0].referenceCanvas.calls[1][0], "drawImage");
assert.equal(pairs[0].referenceCanvas.calls[1][1], referenceCanvas);
assert.deepEqual(
  pairs[0].referenceCanvas.calls[1].slice(2),
  [0, 0, 192, 192, 0, 0, 224, 224],
);
assert.deepEqual(
  pairs[2].restoredCanvas.calls[1].slice(2),
  [320, 320, 192, 192, 0, 0, 224, 224],
);

assert.throws(
  () =>
    prepareRegionPairs({
      referenceCanvas,
      restoredCanvas: createFakeCanvas("wrong", 256, 256),
      hiddenRegions: [0],
      clipPrompts: ["prompt"],
      createCanvas: () => createFakeCanvas("output"),
    }),
  /크기가 같은 정사각형/,
);

assert.throws(
  () =>
    prepareRegionPairs({
      referenceCanvas,
      restoredCanvas,
      hiddenRegions: [0, 4],
      clipPrompts: ["prompt"],
      createCanvas: () => createFakeCanvas("output"),
    }),
  /같은 개수/,
);

console.log("CLIP region preparer tests passed.");
