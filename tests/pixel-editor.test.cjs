const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sandbox = { window: {} };
vm.createContext(sandbox);
["pixelizer.js", "pixel-editor.js"].forEach((fileName) => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "scripts", fileName),
    "utf8",
  );
  vm.runInContext(source, sandbox);
});

const listeners = new Map();
const fillCalls = [];
const context = {
  beginPath() {},
  clearRect() {},
  fillRect(x, y, width, height) {
    fillCalls.push({ color: this.fillStyle, x, y, width, height });
  },
  lineTo() {},
  moveTo() {},
  stroke() {},
};
const canvas = {
  width: 100,
  height: 100,
  addEventListener(type, listener) {
    listeners.set(type, listener);
  },
  removeEventListener(type) {
    listeners.delete(type);
  },
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 100, height: 100 };
  },
  getContext() {
    return context;
  },
  setPointerCapture() {},
};

let latestStatus;
const editor = sandbox.window.PixelEditor.create({
  canvas,
  targetPixels: ["#111111", "#222222", "#333333", "#444444"],
  initialPlayerPixels: [null, null, "#333333", "#444444"],
  hiddenMaskA: [true, true, false, false],
  hiddenMaskB: [false, false, false, false],
  hiddenMaskC: [false, false, false, false],
  gridSize: 2,
  analysisGridSize: 4,
  paintUnitSize: 2,
  analysisPixels: Array(16).fill("#aaaaaa"),
  analysisHiddenMaskA: [
    true, true, true, true,
    true, true, true, true,
    false, false, false, false,
    false, false, false, false,
  ],
  analysisHiddenMaskB: Array(16).fill(false),
  analysisHiddenMaskC: Array(16).fill(false),
  palette: ["#ff0000", "#00ff00"],
  onChange(status) {
    latestStatus = status;
  },
});
assert.equal(fillCalls.length, 16);
assert.ok(fillCalls.some((call) => call.color === "#aaaaaa"));

const pointerEvent = (clientX, clientY) => ({
  button: 0,
  clientX,
  clientY,
  pointerId: 1,
  preventDefault() {},
});

listeners.get("pointerdown")(pointerEvent(25, 25));
listeners.get("pointerup")(pointerEvent(25, 25));
assert.equal(editor.getPlayerPixels()[0], "#ff0000");
assert.ok(
  fillCalls.filter((call) => call.color === "#ff0000").length >= 4,
);
assert.equal(latestStatus.filledCount, 1);
assert.equal(latestStatus.canUndo, true);

editor.undo();
assert.equal(editor.getPlayerPixels()[0], null);
assert.equal(latestStatus.filledCount, 0);

listeners.get("pointerdown")(pointerEvent(25, 75));
listeners.get("pointerup")(pointerEvent(25, 75));
assert.equal(editor.getPlayerPixels()[2], "#333333");

editor.setColor("#00ff00");
listeners.get("pointerdown")(pointerEvent(75, 25));
listeners.get("pointerup")(pointerEvent(75, 25));
assert.equal(editor.getPlayerPixels()[1], "#00ff00");

editor.reset();
assert.equal(editor.getPlayerPixels()[1], null);
assert.equal(latestStatus.filledCount, 0);

editor.setColor("#ff0000");
editor.setTool("fill");
assert.equal(editor.getTool(), "fill");
listeners.get("pointerdown")(pointerEvent(25, 25));
assert.deepEqual(
  Array.from(editor.getPlayerPixels()),
  ["#ff0000", "#ff0000", "#333333", "#444444"],
);
assert.equal(latestStatus.filledCount, 2);
editor.undo();
assert.deepEqual(
  Array.from(editor.getPlayerPixels()),
  [null, null, "#333333", "#444444"],
);

const keyboardEvent = (key) => ({
  key,
  preventDefault() {},
});
editor.setTool("brush");
editor.setColor("#00ff00");
listeners.get("focus")();
listeners.get("keydown")(keyboardEvent("Enter"));
listeners.get("keydown")(keyboardEvent("ArrowRight"));
listeners.get("keydown")(keyboardEvent(" "));
assert.deepEqual(
  Array.from(editor.getPlayerPixels()),
  ["#00ff00", "#00ff00", "#333333", "#444444"],
);
listeners.get("blur")();

editor.destroy();
assert.equal(listeners.size, 0);

console.log("Pixel editor tests passed.");
