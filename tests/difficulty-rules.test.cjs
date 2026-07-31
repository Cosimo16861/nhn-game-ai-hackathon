const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sandbox = { window: {} };
vm.createContext(sandbox);
["difficulty-rules.js", "mask-generator.js"].forEach((fileName) => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "scripts", fileName),
    "utf8",
  );
  vm.runInContext(source, sandbox);
});

const { DifficultyRules, MaskGenerator } = sandbox.window;
assert.equal(DifficultyRules.get("easy").label, "쉬움");
assert.equal(DifficultyRules.get("normal").label, "보통");
assert.equal(DifficultyRules.get("hard").label, "어려움");
assert.equal(DifficultyRules.get("easy").maxHints, 3);
assert.equal(DifficultyRules.get("normal").maxHints, 2);
assert.equal(DifficultyRules.get("hard").maxHints, 1);
assert.ok(
  DifficultyRules.get("easy").labelMinimumBlankRatio <
    DifficultyRules.get("normal").labelMinimumBlankRatio,
);
assert.ok(
  DifficultyRules.get("normal").labelMinimumBlankRatio <
    DifficultyRules.get("hard").labelMinimumBlankRatio,
);
assert.throws(() => DifficultyRules.get("unknown"), /지원하지 않는/);

const gridSize = 128;
const pixels = Array(gridSize * gridSize).fill("#446688");
const hiddenCounts = ["easy", "normal", "hard"].map((difficulty) => {
  const rules = DifficultyRules.get(difficulty);
  return MaskGenerator.generateMask(pixels, {
    gridSize,
    regionsPerSide: 4,
    hiddenRegionCount: 3,
    hiddenRegions: [0, 5, 15],
    seed: 9876,
    maskStyle: "irregular",
    maskInsetBase: rules.maskInsetBase,
    maskInsetVariation: rules.maskInsetVariation,
  }).hiddenCount;
});
assert.ok(hiddenCounts[0] < hiddenCounts[1]);
assert.ok(hiddenCounts[1] < hiddenCounts[2]);

console.log("Difficulty rules tests passed.");
