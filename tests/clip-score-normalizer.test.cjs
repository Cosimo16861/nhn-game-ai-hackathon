const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(
    __dirname,
    "..",
    "scripts",
    "clip-score-normalizer.js",
  ),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const {
  aggregateRegionScores,
  getPromptEvidence,
  normalizeRegionScore,
} = sandbox.window.CLIPScoreNormalizer;

const prompt = "A red gemstone on a dark floor.";
const distractorA = "A broken window under moonlight.";
const distractorB = "A long human-shaped shadow.";

const referenceRankings = [
  { label: prompt, score: 0.7 },
  { label: distractorA, score: 0.2 },
  { label: distractorB, score: 0.1 },
];
const perfectRankings = [
  { label: prompt, score: 0.7 },
  { label: distractorA, score: 0.2 },
  { label: distractorB, score: 0.1 },
];
const partialRankings = [
  { label: prompt, score: 0.5 },
  { label: distractorA, score: 0.3 },
  { label: distractorB, score: 0.2 },
];
const incorrectRankings = [
  { label: distractorA, score: 0.6 },
  { label: prompt, score: 0.25 },
  { label: distractorB, score: 0.15 },
];

const evidence = getPromptEvidence(referenceRankings, prompt);
assert.equal(evidence.promptScore, 0.7);
assert.equal(evidence.strongestDistractor, 0.2);
assert.ok(Math.abs(evidence.margin - 0.5) < 0.0000001);

const perfect = normalizeRegionScore({
  regionIndex: 4,
  prompt,
  referenceRankings,
  restoredRankings: perfectRankings,
});
assert.equal(perfect.reliable, true);
assert.equal(perfect.normalizedScore, 100);
assert.equal(perfect.referenceMargin, 50);
assert.equal(perfect.restoredMargin, 50);

const partial = normalizeRegionScore({
  regionIndex: 4,
  prompt,
  referenceRankings,
  restoredRankings: partialRankings,
});
assert.equal(partial.normalizedScore, 40);

const incorrect = normalizeRegionScore({
  regionIndex: 4,
  prompt,
  referenceRankings,
  restoredRankings: incorrectRankings,
});
assert.equal(incorrect.normalizedScore, 0);

const strongerThanReference = normalizeRegionScore({
  regionIndex: 4,
  prompt,
  referenceRankings,
  restoredRankings: [
    { label: prompt, score: 0.9 },
    { label: distractorA, score: 0.05 },
    { label: distractorB, score: 0.05 },
  ],
});
assert.equal(strongerThanReference.normalizedScore, 100);

const unreliable = normalizeRegionScore({
  regionIndex: 0,
  prompt,
  referenceRankings: [
    { label: prompt, score: 0.35 },
    { label: distractorA, score: 0.33 },
    { label: distractorB, score: 0.32 },
  ],
  restoredRankings: perfectRankings,
});
assert.equal(unreliable.reliable, false);
assert.equal(unreliable.normalizedScore, null);

const aggregate = aggregateRegionScores([
  perfect,
  partial,
  unreliable,
]);
assert.equal(aggregate.score, 70);
assert.equal(aggregate.reliableRegionCount, 2);
assert.equal(aggregate.totalRegionCount, 3);
assert.equal(aggregate.coverage, 66.7);

const unavailable = aggregateRegionScores([unreliable]);
assert.equal(unavailable.score, null);
assert.equal(unavailable.coverage, 0);

assert.throws(
  () => getPromptEvidence([{ label: prompt, score: 1 }], prompt),
  /두 개 이상/,
);
assert.throws(
  () =>
    getPromptEvidence(
      [
        { label: distractorA, score: 0.5 },
        { label: distractorB, score: 0.5 },
      ],
      prompt,
    ),
  /정답 문장/,
);

console.log("CLIP score normalizer tests passed.");
