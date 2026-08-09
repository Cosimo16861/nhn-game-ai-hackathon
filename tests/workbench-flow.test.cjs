const assert = require("node:assert/strict");
const path = require("node:path");

const events = [];
global.window = global;
global.GameProgress = {
  markQuestCleared(id) {
    events.push(["quest", id]);
  },
  markCutsceneSeen(id) {
    events.push(["cutscene", id]);
  },
};

require(path.join(__dirname, "..", "src", "workbench-flow.js"));

(async () => {
  const destination = await global.WorkbenchFlow.complete({
    id: "Q0_MONTAGE",
    completionCutscene: "C1_THE_CASE",
    afterPassUrl: "board.html",
  });
  assert.deepEqual(events, [
    ["quest", "Q0_MONTAGE"],
    ["cutscene", "C1_THE_CASE"],
  ]);
  assert.equal(destination, "board.html");
  console.log("Workbench flow tests passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
