const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "ai-analyzer.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const cosine = sandbox.window.AIImageAnalyzer.cosineSimilarity;
const calculateRecovery = sandbox.window.AIImageAnalyzer.calculateRecovery;
const approximatelyEqual = (first, second) =>
  Math.abs(first - second) < 0.0000001;

assert.ok(approximatelyEqual(cosine([1, 2, 3], [1, 2, 3]), 1));
assert.equal(cosine([1, 0], [0, 1]), 0);
assert.ok(approximatelyEqual(cosine([1, 2], [2, 4]), 1));
assert.equal(cosine([0, 0], [1, 1]), 0);
assert.throws(
  () => cosine([1], [1, 2]),
  /특징 벡터의 길이가 일치하지 않습니다/,
);

const fullRecovery = calculateRecovery([1, 0], [0, 1], [1, 0]);
assert.equal(fullRecovery.baselineScore, 0);
assert.equal(fullRecovery.restoredScore, 100);
assert.equal(fullRecovery.improvement, 100);

const negativeRecovery = calculateRecovery([1, 0], [1, 0], [0, 1]);
assert.equal(negativeRecovery.improvement, -100);

console.log("AI analyzer tests passed.");
