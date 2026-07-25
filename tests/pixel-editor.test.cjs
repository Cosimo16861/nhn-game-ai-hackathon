const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "pixel-editor.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const listeners = new Map();
const context = {
  beginPath() {},
  clearRect() {},
  fillRect() {},
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
  hiddenMaskA: [true, false, false, false],
  hiddenMaskB: [false, true, false, false],
  gridSize: 2,
  palette: ["#ff0000", "#00ff00"],
  onChange(status) {
    latestStatus = status;
  },
});

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

editor.destroy();
assert.equal(listeners.size, 0);

console.log("Pixel editor tests passed.");
