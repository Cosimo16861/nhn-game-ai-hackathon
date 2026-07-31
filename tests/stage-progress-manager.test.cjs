const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "stage-progress-manager.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const chapter = {
  id: "chapter",
  stages: [
    { id: "stage-1", order: 1, passingScore: 60 },
    { id: "stage-2", order: 2, passingScore: 70 },
    { id: "stage-3", order: 3, passingScore: 80 },
  ],
};
const { StageProgressManager } = sandbox.window;
assert.equal(StageProgressManager.calculateStars(59, 60), 0);
assert.equal(StageProgressManager.calculateStars(60, 60), 1);
assert.equal(StageProgressManager.calculateStars(75, 60), 2);
assert.equal(StageProgressManager.calculateStars(85, 60), 3);

const manager = StageProgressManager.create([chapter]);

assert.equal(manager.get("chapter").unlockedStageCount, 1);
assert.throws(
  () => manager.recordResult("chapter", "stage-2", 100),
  /잠긴 세부 사건/,
);
const failed = manager.recordResult("chapter", "stage-1", 59.9);
assert.equal(failed.cleared, false);
assert.equal(manager.get("chapter").unlockedStageCount, 1);

const cleared = manager.recordResult("chapter", "stage-1", 60);
assert.equal(cleared.cleared, true);
assert.equal(cleared.hasNextStage, true);
assert.equal(cleared.stars, 1);
assert.equal(manager.get("chapter").unlockedStageCount, 2);
assert.equal(manager.get("chapter").clearedStageIds.has("stage-1"), true);

manager.recordResult("chapter", "stage-2", 75);
assert.throws(
  () => manager.recordDeduction("chapter", true),
  /모든 세부 사건/,
);
manager.recordResult("chapter", "stage-3", 85);
const finalProgress = manager.get("chapter");
assert.equal(finalProgress.unlockedStageCount, 3);
assert.equal(finalProgress.clearedStageIds.size, 3);
assert.equal(finalProgress.deductionCleared, false);
assert.equal(
  manager.recordDeduction("chapter", false).deductionCleared,
  false,
);
assert.equal(
  manager.recordDeduction("chapter", true).deductionCleared,
  true,
);
assert.equal(manager.get("chapter").deductionCleared, true);

assert.throws(
  () => manager.recordResult("chapter", "missing", 100),
  /결과 정보/,
);
assert.throws(() => manager.get("missing"), /등록되지 않은/);

const memory = new Map();
const storage = {
  getItem(key) {
    return memory.get(key) ?? null;
  },
  setItem(key, value) {
    memory.set(key, value);
  },
};
const savedManager = StageProgressManager.create([chapter], {
  storage,
  storageKey: "test-progress",
});
savedManager.recordResult("chapter", "stage-1", 90);
savedManager.recordResult("chapter", "stage-2", 75);
const restoredManager = StageProgressManager.create([chapter], {
  storage,
  storageKey: "test-progress",
});
const restored = restoredManager.get("chapter");
assert.equal(restored.unlockedStageCount, 3);
assert.equal(restored.clearedStageIds.size, 2);
assert.equal(restored.bestScores.get("stage-1"), 90);
assert.equal(restored.stageStars.get("stage-1"), 3);
assert.equal(restored.stageStars.get("stage-2"), 1);

console.log("Stage progress manager tests passed.");
