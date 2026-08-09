const assert = require("node:assert/strict");
const path = require("node:path");

const values = new Map([["heir_intro_seen", "1"]]);
global.window = global;
global.localStorage = {
  getItem(key) {
    return values.has(key) ? values.get(key) : null;
  },
  setItem(key, value) {
    values.set(key, String(value));
  },
};

require(path.join(__dirname, "..", "src", "game-progress.js"));

const progress = global.GameProgress;
assert.equal(progress.has("CUTSCENE_SEEN_C0_INTRO"), true);
assert.equal(progress.has("CUTSCENE_SEEN_C0B_THE_JOB"), false);

let notifications = 0;
const unsubscribe = progress.subscribe(() => { notifications += 1; });
progress.markQuestCleared("Q0_MONTAGE");
progress.markCutsceneSeen("C1_THE_CASE");
progress.selectQuest("Q1A_IDEALIZED");
unsubscribe();

assert.equal(progress.has("NODE_CLEARED_Q0_MONTAGE"), true);
assert.equal(progress.has("CUTSCENE_SEEN_C1_THE_CASE"), true);
assert.equal(progress.get().selectedQuestId, "Q1A_IDEALIZED");
assert.equal(notifications, 3);

const stored = JSON.parse(values.get(progress.storageKey));
assert.ok(stored.flags.includes("NODE_CLEARED_Q0_MONTAGE"));
assert.equal(stored.selectedQuestId, "Q1A_IDEALIZED");

progress.reset({ openingComplete: true });
assert.deepEqual(progress.get().flags, [
  "CUTSCENE_SEEN_C0B_THE_JOB",
  "CUTSCENE_SEEN_C0_INTRO",
]);
assert.equal(progress.get().selectedQuestId, null);

console.log("Game progress tests passed.");
