const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "hint-manager.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const puzzleSource = {
  caseInfo: {
    hints: ["창문의 큰 형태부터 확인하세요."],
    hiddenRegions: [0, 5, 15],
  },
  difficultyRules: { maxHints: 3 },
  pixels: ["#ff0000", "#ff0000", "#00ff00", "#0000ff"],
  hiddenMaskA: [true, false, false, false],
  hiddenMaskB: [false, true, true, false],
  hiddenMaskC: [false, false, false, true],
};

const hints = sandbox.window.HintManager.buildHints(puzzleSource);
assert.equal(hints.length, 3);
assert.equal(hints[0].title, "수사 방향");
assert.equal(hints[0].message, "창문의 큰 형태부터 확인하세요.");
assert.match(hints[1].message, /단서 B/);
assert.match(hints[1].message, /손상 구역 6/);
assert.equal(hints[2].color, "#ff0000");
assert.equal(Object.isFrozen(hints), true);
assert.equal(Object.isFrozen(hints[0]), true);

const hardHints = sandbox.window.HintManager.buildHints({
  ...puzzleSource,
  difficultyRules: { maxHints: 1 },
});
assert.equal(hardHints.length, 1);

assert.throws(
  () => sandbox.window.HintManager.buildHints({}),
  /퍼즐 정보/,
);

console.log("Hint manager tests passed.");
