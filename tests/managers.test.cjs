const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sandbox = { window: {} };
vm.createContext(sandbox);

[
  "screen-manager.js",
  "ui-renderer.js",
  "editor-manager.js",
  "score-manager.js",
].forEach((fileName) => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "scripts", fileName),
    "utf8",
  );
  vm.runInContext(source, sandbox);
});

assert.equal(typeof sandbox.window.ScreenManager.create, "function");
assert.equal(typeof sandbox.window.UIRenderer.renderRules, "function");
assert.equal(typeof sandbox.window.EditorManager.create, "function");
assert.equal(typeof sandbox.window.ScoreManager.evaluate, "function");

const screens = {
  cases: {
    hidden: false,
    scrollIntoView() {
      this.scrolled = true;
    },
  },
  preview: {
    hidden: true,
    scrollIntoView() {
      this.scrolled = true;
    },
  },
};
const scoreGuide = { hidden: false };
const manager = sandbox.window.ScreenManager.create({
  screens,
  companions: { cases: [scoreGuide] },
});

manager.show("preview", { scroll: false });
assert.equal(screens.cases.hidden, true);
assert.equal(screens.preview.hidden, false);
assert.equal(scoreGuide.hidden, true);

manager.show("cases");
assert.equal(screens.cases.hidden, false);
assert.equal(screens.preview.hidden, true);
assert.equal(scoreGuide.hidden, false);
assert.equal(screens.cases.scrolled, true);
assert.throws(() => manager.show("missing"), /알 수 없는 게임 화면/);

assert.equal(sandbox.window.EditorManager.formatTime(0), "00:00");
assert.equal(sandbox.window.EditorManager.formatTime(125), "02:05");
assert.equal(sandbox.window.ScoreManager.getGrade(95), "S");
assert.equal(sandbox.window.ScoreManager.getGrade(65), "B");
assert.equal(sandbox.window.ScoreManager.getGrade(10), "D");

const html = fs.readFileSync(
  path.join(__dirname, "..", "index.html"),
  "utf8",
);
const scriptOrder = [
  "screen-manager.js",
  "ui-renderer.js",
  "editor-manager.js",
  "score-manager.js",
  "app.js",
].map((fileName) => html.indexOf(fileName));
assert.equal(scriptOrder.every((index) => index >= 0), true);
assert.deepEqual(
  [...scriptOrder].sort((left, right) => left - right),
  scriptOrder,
);

console.log("Manager module tests passed.");
