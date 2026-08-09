const assert = require("node:assert/strict");
const path = require("node:path");

const scoring = require(path.join(__dirname, "..", "scripts", "highres-restoration-scoring.js"));

function imageData(width, height, colors) {
  const data = new Uint8ClampedArray(width * height * 4);
  colors.forEach((color, index) => data.set([...color, 255], index * 4));
  return { width, height, data };
}

const target = imageData(2, 2, [
  [180, 80, 60], [40, 70, 90],
  [230, 180, 120], [20, 25, 30],
]);
const exact = imageData(2, 2, [
  [180, 80, 60], [40, 70, 90],
  [230, 180, 120], [20, 25, 30],
]);
const close = imageData(2, 2, [
  [170, 90, 65], [45, 75, 95],
  [220, 175, 125], [28, 30, 35],
]);
const blank = imageData(2, 2, Array.from({ length: 4 }, () => [255, 255, 255]));
const mask = new Uint8Array([1, 1, 1, 1]);

const exactResult = scoring.evaluate({
  targetImageData: target,
  restoredImageData: exact,
  evaluationMask: mask,
  sampleStride: 1,
});
assert.equal(exactResult.colorScore, 100);
assert.equal(exactResult.coverageScore, 100);
assert.equal(exactResult.finalScore, 100);
assert.equal(exactResult.cleared, true);
assert.equal(exactResult.clipAvailable, false);

const closeResult = scoring.evaluate({
  targetImageData: target,
  restoredImageData: close,
  evaluationMask: mask,
  sampleStride: 1,
  clipScore: 72,
});
assert.ok(closeResult.finalScore >= 60);
assert.equal(closeResult.clipAvailable, true);

const blankResult = scoring.evaluate({
  targetImageData: target,
  restoredImageData: blank,
  evaluationMask: mask,
  sampleStride: 1,
});
assert.equal(blankResult.coverageScore, 0);
assert.equal(blankResult.cleared, false);

const outline = imageData(2, 2, [
  [0, 0, 0], [255, 255, 255],
  [120, 120, 120], [250, 250, 250],
]);
assert.deepEqual(
  Array.from(scoring.createEvaluationMask(outline, 205)),
  [0, 1, 0, 1],
);

const fallback = scoring.combineScores({ colorScore: 70, coverageScore: 50, clipScore: null });
assert.equal(fallback.clipAvailable, false);
assert.equal(fallback.finalScore, 66.4);

console.log("High-resolution restoration scoring tests passed.");
