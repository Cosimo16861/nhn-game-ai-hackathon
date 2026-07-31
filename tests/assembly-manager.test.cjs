const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "assembly-manager.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const chapter = {
  id: "museum",
  masterImageSrc: "./master.png",
  layout: { columns: 2, rows: 2 },
  stages: [
    { id: "s1", order: 1, crop: { column: 0, row: 0 } },
    { id: "s2", order: 2, crop: { column: 1, row: 0 } },
    { id: "s3", order: 3, crop: { column: 0, row: 1 } },
    { id: "s4", order: 4, crop: { column: 1, row: 1 } },
  ],
};

const plan = sandbox.window.AssemblyManager.createPlan(
  chapter,
  new Set(["s1", "s2"]),
);
assert.equal(plan.tiles.length, 4);
assert.equal(plan.completedStageCount, 2);
assert.equal(plan.totalStageCount, 4);
assert.equal(plan.isComplete, false);
assert.equal(plan.tiles[0].cleared, true);
assert.equal(plan.tiles[2].cleared, false);
assert.equal(plan.tiles[0].backgroundPosition, "0% 0%");
assert.equal(plan.tiles[1].backgroundPosition, "100% 0%");
assert.equal(plan.tiles[2].backgroundPosition, "0% 100%");
assert.equal(plan.tiles[3].backgroundPosition, "100% 100%");
assert.equal(plan.tiles[0].backgroundSize, "200% 200%");

const completed = sandbox.window.AssemblyManager.createPlan(
  chapter,
  new Set(["s1", "s2", "s3", "s4"]),
);
assert.equal(completed.isComplete, true);
assert.equal(Object.isFrozen(completed), true);
assert.equal(Object.isFrozen(completed.tiles), true);

assert.throws(
  () => sandbox.window.AssemblyManager.createPlan({}, []),
  /조립 정보/,
);

console.log("Assembly manager tests passed.");
