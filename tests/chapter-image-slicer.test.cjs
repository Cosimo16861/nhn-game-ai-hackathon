const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(
    __dirname,
    "..",
    "scripts",
    "chapter-image-slicer.js",
  ),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const { calculateCropRect, drawStageCrop } =
  sandbox.window.ChapterImageSlicer;
const layout = { columns: 2, rows: 2 };

assert.deepEqual(
  { ...calculateCropRect(1254, 1254, layout, { column: 0, row: 0 }) },
  { x: 0, y: 0, width: 627, height: 627 },
);
assert.deepEqual(
  { ...calculateCropRect(1254, 1254, layout, { column: 1, row: 1 }) },
  { x: 627, y: 627, width: 627, height: 627 },
);
assert.deepEqual(
  { ...calculateCropRect(1001, 999, layout, { column: 1, row: 1 }) },
  { x: 500, y: 499, width: 501, height: 500 },
);
assert.throws(
  () => calculateCropRect(1254, 1254, layout, { column: 2, row: 0 }),
  /분할 범위/,
);

const calls = [];
const context = {
  clearRect(...args) {
    calls.push(["clearRect", ...args]);
  },
  drawImage(...args) {
    calls.push(["drawImage", ...args]);
  },
};
const image = { naturalWidth: 1254, naturalHeight: 1254 };
const canvas = {
  width: 256,
  height: 256,
  getContext() {
    return context;
  },
};
const drawnRect = drawStageCrop(
  image,
  canvas,
  layout,
  { column: 1, row: 0 },
);
assert.deepEqual(
  { ...drawnRect },
  { x: 627, y: 0, width: 627, height: 627 },
);
assert.deepEqual(calls[0], ["clearRect", 0, 0, 256, 256]);
assert.deepEqual(calls[1].slice(2), [
  627,
  0,
  627,
  627,
  0,
  0,
  256,
  256,
]);
assert.equal(context.imageSmoothingEnabled, true);
assert.equal(context.imageSmoothingQuality, "high");

const masterImage = fs.readFileSync(
  path.join(
    __dirname,
    "..",
    "assets",
    "cases",
    "museum-robbery-master-dark-color.png",
  ),
);
const masterWidth = masterImage.readUInt32BE(16);
const masterHeight = masterImage.readUInt32BE(20);
const allRects = [
  { column: 0, row: 0 },
  { column: 1, row: 0 },
  { column: 0, row: 1 },
  { column: 1, row: 1 },
].map((crop) =>
  calculateCropRect(masterWidth, masterHeight, layout, crop),
);
assert.equal(
  allRects.reduce((sum, rect) => sum + rect.width * rect.height, 0),
  masterWidth * masterHeight,
);

console.log("Chapter image slicer tests passed.");
