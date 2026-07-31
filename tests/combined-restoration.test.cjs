const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sandbox = { window: {} };
vm.createContext(sandbox);

[
  "mask-generator.js",
  "scoring.js",
  "score-manager.js",
  "clip-score-normalizer.js",
].forEach((fileName) => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "scripts", fileName),
    "utf8",
  );
  vm.runInContext(source, sandbox);
});

const gridSize = 256;
const regionsPerSide = 4;
const hiddenRegions = [0, 4, 15];
const visualWeights = {
  color: 0.5,
  edge: 0.3,
  structure: 0.15,
  palette: 0.05,
};
const combinedWeights = { visual: 0.8, clip: 0.2 };
const palette = ["#14213d", "#fca311", "#e5e5e5", "#5f0f40"];
const targetPixels = Array.from(
  { length: gridSize * gridSize },
  (_, index) => {
    const row = Math.floor(index / gridSize);
    const column = index % gridSize;
    return palette[
      (Math.floor(row / 12) + Math.floor(column / 10)) %
        palette.length
    ];
  },
);
const mask = sandbox.window.MaskGenerator.generateMask(targetPixels, {
  gridSize,
  regionsPerSide,
  hiddenRegionCount: 3,
  hiddenRegions,
});
const hiddenIndices = mask.hiddenMask
  .map((hidden, index) => (hidden ? index : -1))
  .filter((index) => index >= 0);

function createRestoration(numerator, denominator) {
  let hiddenOrder = 0;
  return targetPixels.map((color, index) => {
    if (!mask.hiddenMask[index]) return color;
    const shouldRestore = hiddenOrder % denominator < numerator;
    hiddenOrder++;
    return shouldRestore ? color : null;
  });
}

function createRankings(prompts, correctIndex, recoveryRatio) {
  const referenceMargin = 0.5;
  const restoredMargin = referenceMargin * recoveryRatio;
  const distractorScore = (1 - restoredMargin) / prompts.length;
  const correctScore = distractorScore + restoredMargin;

  return prompts.map((label, index) => ({
    label,
    score: index === correctIndex ? correctScore : distractorScore,
  }));
}

function createClipAggregate(recoveryRatio) {
  const prompts = [
    "A broken window under moonlight.",
    "A red gemstone on a dark floor.",
    "A long human-shaped shadow.",
  ];
  const regionScores = prompts.map((prompt, index) =>
    sandbox.window.CLIPScoreNormalizer.normalizeRegionScore({
      regionIndex: hiddenRegions[index],
      prompt,
      referenceRankings: createRankings(prompts, index, 1),
      restoredRankings: createRankings(
        prompts,
        index,
        recoveryRatio,
      ),
    }),
  );
  return sandbox.window.CLIPScoreNormalizer.aggregateRegionScores(
    regionScores,
  );
}

function evaluateScenario(numerator, denominator, semanticRecovery) {
  const visual =
    sandbox.window.PixelScoring.calculateRestorationScores(
      targetPixels,
      createRestoration(numerator, denominator),
      mask.hiddenMask,
      gridSize,
      visualWeights,
    );
  const clip = createClipAggregate(semanticRecovery);
  const combined = sandbox.window.ScoreManager.combineWithClip(
    visual.finalScore,
    clip,
    combinedWeights,
  );
  return { visual, clip, combined };
}

const perfect = evaluateScenario(1, 1, 1);
const threeQuarters = evaluateScenario(3, 4, 0.75);
const half = evaluateScenario(1, 2, 0.5);
const semanticMismatch = evaluateScenario(1, 1, 0);

assert.ok(mask.hiddenCount > 3 * 64 * 64 * 0.45);
assert.ok(mask.hiddenCount < 3 * 64 * 64 * 0.8);
assert.equal(perfect.visual.finalScore, 100);
assert.equal(perfect.clip.score, 100);
assert.equal(perfect.combined.finalScore, 100);

assert.equal(threeQuarters.visual.color.score, 75);
assert.equal(threeQuarters.clip.score, 75);
assert.ok(threeQuarters.combined.finalScore >= 65);
assert.ok(threeQuarters.combined.finalScore <= 85);

assert.equal(half.visual.color.score, 50);
assert.equal(half.clip.score, 50);
assert.ok(half.combined.finalScore >= 35);
assert.ok(half.combined.finalScore <= 60);

assert.equal(semanticMismatch.visual.finalScore, 100);
assert.equal(semanticMismatch.clip.score, 0);
assert.equal(semanticMismatch.combined.finalScore, 80);

assert.ok(
  perfect.combined.finalScore >
    threeQuarters.combined.finalScore,
);
assert.ok(
  threeQuarters.combined.finalScore > half.combined.finalScore,
);

console.log(
  "Combined restoration tests passed.",
  JSON.stringify({
    perfect: perfect.combined.finalScore,
    threeQuarters: threeQuarters.combined.finalScore,
    half: half.combined.finalScore,
    semanticMismatch: semanticMismatch.combined.finalScore,
  }),
);
