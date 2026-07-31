const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const prompts = ["prompt A", "prompt B", "prompt C"];
const pairs = prompts.map((prompt, index) => ({
  regionIndex: index,
  prompt,
  referenceCanvas: { type: "reference", index },
  restoredCanvas: { type: "restored", index },
}));
const compareCalls = [];
let preloadCount = 0;

function rankingsFor(correctIndex, recoveryRatio) {
  const margin = 0.5 * recoveryRatio;
  const distractorScore = (1 - margin) / 3;
  const correctScore = distractorScore + margin;
  return prompts.map((label, index) => ({
    label,
    score: index === correctIndex ? correctScore : distractorScore,
  }));
}

const analyzer = {
  async load(onProgress) {
    preloadCount++;
    onProgress?.({ status: "ready" });
    return {};
  },
  async compareImageToPrompts(canvas, receivedPrompts) {
    compareCalls.push({ canvas, prompts: receivedPrompts });
    return {
      rankings: rankingsFor(
        canvas.index,
        canvas.type === "reference" ? 1 : 0.5,
      ),
    };
  },
};

const sandbox = {
  window: {
    CLIPAnalyzer: {
      createAnalyzer() {
        return analyzer;
      },
    },
    CLIPRegionPreparer: {
      prepareRegionPairs(options) {
        assert.equal(options.referenceCanvas.id, "reference");
        assert.equal(options.restoredCanvas.id, "restored");
        return pairs;
      },
    },
  },
};
vm.createContext(sandbox);

[
  "clip-score-normalizer.js",
  "score-manager.js",
  "clip-score-manager.js",
].forEach((fileName) => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "scripts", fileName),
    "utf8",
  );
  vm.runInContext(source, sandbox);
});

async function run() {
  const manager = sandbox.window.CLIPScoreManager.create({ analyzer });
  const preloadStatuses = [];
  await manager.preload((progress) =>
    preloadStatuses.push(progress.status),
  );
  assert.equal(preloadCount, 1);
  assert.deepEqual(preloadStatuses, ["ready"]);

  const progressStatuses = [];
  const result = await manager.evaluate({
    referenceCanvas: { id: "reference" },
    restoredCanvas: { id: "restored" },
    hiddenRegions: [0, 1, 2],
    clipPrompts: prompts,
    visualScore: 80,
    regionsPerSide: 4,
    combinedWeights: { visual: 0.8, clip: 0.2 },
    referenceCacheKey: "test-case",
    onProgress: (progress) =>
      progressStatuses.push(progress.status),
  });

  assert.equal(compareCalls.length, 6);
  assert.equal(result.clip.score, 50);
  assert.equal(result.clip.coverage, 100);
  assert.equal(result.combined.finalScore, 74);
  assert.deepEqual(progressStatuses, [
    "reference",
    "restored",
    "reference",
    "restored",
    "reference",
    "restored",
  ]);

  await manager.evaluate({
    referenceCanvas: { id: "reference" },
    restoredCanvas: { id: "restored" },
    hiddenRegions: [0, 1, 2],
    clipPrompts: prompts,
    visualScore: 80,
    regionsPerSide: 4,
    combinedWeights: { visual: 0.8, clip: 0.2 },
    referenceCacheKey: "test-case",
  });
  assert.equal(compareCalls.length, 9);

  console.log("CLIP score manager tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
