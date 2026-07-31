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
assert.equal(typeof sandbox.window.EditorManager.create, "function");
assert.equal(typeof sandbox.window.ScoreManager.evaluate, "function");

const screens = {
  cases: {
    hidden: false,
    scrollIntoView() {
      this.scrolled = true;
    },
    focus() {
      this.focused = true;
    },
  },
  preview: {
    hidden: true,
    scrollIntoView() {
      this.scrolled = true;
    },
    focus() {
      this.focused = true;
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
assert.equal(screens.cases.focused, true);
assert.throws(() => manager.show("missing"), /알 수 없는 게임 화면/);

function createProgressStep() {
  const classes = new Set();
  const attributes = new Map();
  return {
    classes,
    attributes,
    classList: {
      toggle(name, enabled) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      },
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
  };
}

const progressSteps = {
  cases: createProgressStep(),
  preview: createProgressStep(),
};
const progressManager = sandbox.window.ScreenManager.create({
  screens,
  progressSteps,
});
progressManager.show("preview", { scroll: false });
assert.equal(progressSteps.cases.classes.has("is-complete"), true);
assert.equal(progressSteps.preview.classes.has("is-current"), true);
assert.equal(
  progressSteps.preview.attributes.get("aria-current"),
  "step",
);

const aliasedScreens = {
  ...screens,
  stages: {
    hidden: true,
    scrollIntoView() {},
  },
};
const aliasManager = sandbox.window.ScreenManager.create({
  screens: aliasedScreens,
  progressSteps,
  progressAliases: { stages: "cases" },
});
aliasManager.show("stages", { scroll: false });
assert.equal(progressSteps.cases.classes.has("is-current"), true);
assert.equal(progressSteps.preview.classes.has("is-current"), false);

assert.equal(sandbox.window.EditorManager.formatTime(0), "00:00");
assert.equal(sandbox.window.EditorManager.formatTime(125), "02:05");
assert.equal(
  sandbox.window.EditorManager.getProgressPercentage(0, 0),
  0,
);
assert.equal(
  sandbox.window.EditorManager.getProgressPercentage(25, 100),
  25,
);
assert.equal(
  sandbox.window.EditorManager.getProgressPercentage(150, 100),
  100,
);
assert.equal(sandbox.window.ScoreManager.getGrade(95), "S");
assert.equal(sandbox.window.ScoreManager.getGrade(65), "B");
assert.equal(sandbox.window.ScoreManager.getGrade(10), "D");

const fullCoverageScore = sandbox.window.ScoreManager.combineWithClip(
  80,
  { score: 60, coverage: 100 },
);
assert.equal(fullCoverageScore.available, true);
assert.equal(fullCoverageScore.finalScore, 76);
assert.equal(fullCoverageScore.effectiveVisualWeight, 0.8);
assert.equal(fullCoverageScore.effectiveClipWeight, 0.2);

const partialCoverageScore =
  sandbox.window.ScoreManager.combineWithClip(
    80,
    { score: 60, coverage: 50 },
  );
assert.equal(partialCoverageScore.finalScore, 78);
assert.equal(partialCoverageScore.effectiveVisualWeight, 0.9);
assert.equal(partialCoverageScore.effectiveClipWeight, 0.1);

const unavailableScore = sandbox.window.ScoreManager.combineWithClip(
  80,
  { score: null, coverage: 0 },
);
assert.equal(unavailableScore.available, false);
assert.equal(unavailableScore.finalScore, null);
assert.match(unavailableScore.reason, /신뢰할 수 있는 CLIP/);

assert.throws(
  () =>
    sandbox.window.ScoreManager.combineWithClip(
      80,
      { score: 60, coverage: 100 },
      { visual: 0.5, clip: 0.4 },
    ),
  /결합 설정/,
);

const assistedScore = sandbox.window.ScoreManager.applyHintPenalty(
  88.5,
  2,
);
assert.equal(assistedScore.baseScore, 88.5);
assert.equal(assistedScore.hintPenalty, 4);
assert.equal(assistedScore.finalScore, 84.5);
assert.throws(
  () => sandbox.window.ScoreManager.applyHintPenalty(80, -1),
  /힌트 감점/,
);

const scoreElements = Object.fromEntries(
  [
    "finalScore",
    "message",
    "outcome",
    "grade",
    "visual",
    "clip",
    "clipCoverage",
    "color",
    "edge",
    "structure",
    "palette",
    "stars",
    "hintsUsed",
    "hintPenalty",
    "time",
    "filled",
    "exact",
    "delta",
    "visualWeight",
    "clipWeight",
    "colorWeight",
    "edgeWeight",
    "structureWeight",
    "paletteWeight",
  ].map((key) => [
    key,
    {
      textContent: "",
      setAttribute(name, value) {
        this[name] = value;
      },
    },
  ]),
);
sandbox.window.ScoreManager.render(
  {
    finalScore: 84,
    hintsUsed: 2,
    hintPenalty: 4,
    stageStars: 2,
    passingScore: 65,
    visualFinalScore: 80,
    combined: {
      effectiveVisualWeight: 0.8,
      effectiveClipWeight: 0.2,
    },
    clip: {
      score: 100,
      reliableRegionCount: 3,
      totalRegionCount: 3,
    },
    scoreWeights: {
      color: 0.5,
      edge: 0.3,
      structure: 0.15,
      palette: 0.05,
    },
    logical: {
      hiddenCount: 10,
      filledCount: 10,
      exactMatchCount: 8,
    },
    color: { score: 80, averageDeltaE: 4.25 },
    edge: { score: 80 },
    structure: { score: 80 },
    palette: { score: 80 },
  },
  scoreElements,
  125,
);
assert.equal(scoreElements.finalScore.textContent, "84.0");
assert.equal(scoreElements.outcome.textContent, "수사 성공 · 통과 65점");
assert.match(scoreElements.outcome.className, /is-cleared/);
assert.equal(scoreElements.visual.textContent, "80.0점");
assert.equal(scoreElements.clip.textContent, "100.0점");
assert.equal(scoreElements.clipCoverage.textContent, "3 / 3");
assert.equal(scoreElements.visualWeight.textContent, "80%");
assert.equal(scoreElements.clipWeight.textContent, "20%");
assert.equal(scoreElements.colorWeight.textContent, "40%");
assert.equal(scoreElements.edgeWeight.textContent, "24%");
assert.equal(scoreElements.structureWeight.textContent, "12%");
assert.equal(scoreElements.paletteWeight.textContent, "4%");
assert.equal(scoreElements.hintsUsed.textContent, "2회");
assert.equal(scoreElements.hintPenalty.textContent, "-4.0점");
assert.equal(scoreElements.stars.textContent, "★★☆");
assert.equal(scoreElements.stars["aria-label"], "별점 3개 중 2개");

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
assert.match(html, /id="visualDetail"/);
assert.match(html, /id="clipDetail"/);
assert.doesNotMatch(html, /id="aiAnalyzeButton"/);

console.log("Manager module tests passed.");
