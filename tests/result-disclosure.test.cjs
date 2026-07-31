const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "score-manager.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const { createFailureFeedback, getResultDisclosure } =
  sandbox.window.ScoreManager;

assert.deepEqual(
  { ...getResultDisclosure(64.9, 65) },
  { cleared: false, revealOriginal: false },
);
assert.deepEqual(
  { ...getResultDisclosure(65, 65) },
  { cleared: true, revealOriginal: true },
);
assert.throws(
  () => getResultDisclosure(101, 65),
  /결과 공개 기준/,
);

const failedResult = {
  finalScore: 50,
  passingScore: 65,
  logical: {
    hiddenCount: 100,
    filledCount: 90,
  },
  color: { score: 55 },
  edge: { score: 40 },
  structure: { score: 70 },
  palette: { score: 80 },
  clip: {
    regions: [
      { reliable: true, normalizedScore: 80 },
      { reliable: true, normalizedScore: 25 },
      { reliable: true, normalizedScore: 60 },
    ],
  },
};
const feedback = Array.from(createFailureFeedback(failedResult));
assert.equal(feedback.length, 3);
assert.match(feedback[0], /10개/);
assert.match(feedback[1], /윤곽/);
assert.match(feedback[2], /목격담 B/);

assert.equal(
  createFailureFeedback({
    ...failedResult,
    finalScore: 65,
  }).length,
  0,
);

const html = fs.readFileSync(
  path.join(__dirname, "..", "index.html"),
  "utf8",
);
const appSource = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "app.js"),
  "utf8",
);
assert.match(
  html,
  /id="originalResultFigure"/,
);
assert.match(
  html,
  /id="failureFeedback"[\s\S]*hidden/,
);
assert.match(
  appSource,
  /originalResultFigure\.hidden\s*=\s*!disclosure\.revealOriginal/,
);
assert.match(
  appSource,
  /failureFeedback\.hidden\s*=\s*disclosure\.cleared/,
);

console.log("Result disclosure tests passed.");
