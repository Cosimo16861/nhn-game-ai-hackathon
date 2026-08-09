/**
 * ProgressStore v2 + v1 마이그레이션 — GAME_INTEGRATION_PLAN 단계 2.
 */
const assert = require("node:assert/strict");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
global.window = global.window || {};
require(path.join(root, "src/data/quest-graph.js"));
const bundles = require(path.join(root, "src/data/completion-bundles.js"));
const ProgressStoreFactory = require(path.join(root, "src/core/progress-store.js"));
const Migration = require(path.join(root, "src/core/migration-v1-v2.js"));
const { QuestGraph } = global.window;

function fakeStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    _map: map,
  };
}

function newStore(seed) {
  const storage = fakeStorage(seed);
  return { storage, store: ProgressStoreFactory.create({ storage, bundles }) };
}

// ── 1. 빈 상태 ──────────────────────────────────────────────────────
{
  const { store } = newStore();
  const snapshot = store.getSnapshot();
  assert.equal(snapshot.version, 2);
  assert.deepEqual(snapshot.clearedQuestIds, []);
  assert.equal(snapshot.pending, null);
  assert.equal(store.has("NODE_CLEARED_Q0_MONTAGE"), false);
}

// ── 2. 통과와 번들 종료는 다른 사건이다 ─────────────────────────────
{
  const { store, storage } = newStore();
  store.completeBundle("B_OPENING");
  assert.equal(QuestGraph.statusOf("Q0_MONTAGE", store), QuestGraph.OPEN);

  store.beginQuestCompletion("Q0_MONTAGE", "B_AFTER_Q0");
  assert.equal(store.isQuestCleared("Q0_MONTAGE"), true);
  assert.equal(store.isBundleCompleted("B_AFTER_Q0"), false);
  // 통과만으로는 자식이 열리지 않는다.
  assert.equal(QuestGraph.statusOf("Q1A_IDEALIZED", store), QuestGraph.LOCKED);

  const pending = store.getPendingTransition();
  assert.equal(pending.kind, "completion-cutscene");
  assert.equal(pending.bundleId, "B_AFTER_Q0");
  assert.equal(pending.sourceQuestId, "Q0_MONTAGE");

  // 같은 저장을 다시 읽어도(=새로고침) pending 이 살아 있다.
  const reloaded = ProgressStoreFactory.create({ storage, bundles });
  assert.equal(reloaded.getPendingTransition().bundleId, "B_AFTER_Q0");
  assert.equal(reloaded.isQuestCleared("Q0_MONTAGE"), true);

  reloaded.completeBundle("B_AFTER_Q0");
  assert.equal(reloaded.getPendingTransition(), null);
  assert.equal(reloaded.isBundleCompleted("B_AFTER_Q0"), true);
  assert.equal(QuestGraph.statusOf("Q1A_IDEALIZED", reloaded), QuestGraph.OPEN);
  assert.equal(QuestGraph.statusOf("Q1B_TAVERN_WALL", reloaded), QuestGraph.OPEN);
  // 손자는 아직 잠겨 있다.
  assert.equal(QuestGraph.statusOf("Q2A_TRUE_FACE", reloaded), QuestGraph.LOCKED);
}

// ── 3. 번들 종료가 장면 시청을 함께 기록한다 ────────────────────────
{
  const { store } = newStore();
  store.completeBundle("B_AFTER_Q0");
  assert.equal(store.isSceneSeen("C1A_RETURNED_HEIR"), true);
  assert.equal(store.isSceneSeen("C1B_TWELVE_YEARS_UNDER"), true);
  // 구 alias 플래그로도 조회된다(BranchMap·QuestGraph 호환).
  assert.equal(store.has("CUTSCENE_SEEN_C1_THE_CASE"), true);
}

// ── 4. 알 수 없는 번들은 거부한다 ───────────────────────────────────
{
  const { store } = newStore();
  assert.throws(() => store.beginQuestCompletion("Q0_MONTAGE", "B_NOPE"));
  assert.throws(() => store.completeBundle("B_NOPE"));
  assert.equal(store.getSnapshot().clearedQuestIds.length, 0);
}

// ── 5. 선택·구독·초기화 ────────────────────────────────────────────
{
  const { store } = newStore();
  const seen = [];
  const unsubscribe = store.subscribe((snapshot) => seen.push(snapshot.selectedQuestId));
  store.selectQuest("Q1A_IDEALIZED");
  assert.deepEqual(seen, ["Q1A_IDEALIZED"]);
  unsubscribe();
  store.selectQuest("Q1B_TAVERN_WALL");
  assert.equal(seen.length, 1);

  store.completeBundle("B_OPENING");
  store.reset();
  assert.deepEqual(store.getSnapshot().completedBundleIds, []);
  assert.equal(store.getSnapshot().selectedQuestId, null);
}

// ── 6. 저장 실패는 조용히 넘어가지 않는다 ───────────────────────────
{
  const storage = fakeStorage();
  storage.setItem = () => { throw new Error("quota"); };
  const store = ProgressStoreFactory.create({ storage, bundles });
  assert.throws(() => store.completeBundle("B_OPENING"), /quota/);
}

// ── 7. v1 → v2 마이그레이션 ─────────────────────────────────────────
{
  const v1 = {
    version: 1,
    flags: [
      "CUTSCENE_SEEN_C0_INTRO",
      "CUTSCENE_SEEN_C0B_THE_JOB",
      "NODE_CLEARED_Q0_MONTAGE",
      "CUTSCENE_SEEN_C1_THE_CASE",
      "NODE_CLEARED_Q1A_IDEALIZED",
      "EV_SOMETHING",
    ],
    selectedQuestId: "Q1A_IDEALIZED",
    updatedAt: 1700000000000,
  };
  const storage = fakeStorage({ heir_game_progress_v1: JSON.stringify(v1) });
  const store = ProgressStoreFactory.create({ storage, bundles });
  const result = Migration.migrateIfNeeded(store, { storage, bundles });

  assert.equal(result.migrated, true);
  const snapshot = store.getSnapshot();
  assert.deepEqual(
    snapshot.clearedQuestIds.slice(),
    ["Q0_MONTAGE", "Q1A_IDEALIZED"],
  );
  assert.ok(snapshot.completedBundleIds.includes("B_OPENING"));
  assert.ok(snapshot.completedBundleIds.includes("B_AFTER_Q0"));
  assert.ok(snapshot.seenSceneIds.includes("C1B_TWELVE_YEARS_UNDER"));
  assert.deepEqual(snapshot.flags.slice(), ["EV_SOMETHING"]);
  assert.equal(snapshot.selectedQuestId, "Q1A_IDEALIZED");

  // Q1A 는 통과했지만 그 완료 컷신을 못 봤다 → pending 으로 복원돼야 진행이 안 막힌다.
  assert.equal(snapshot.pending.bundleId, "B_AFTER_Q1A");
  assert.equal(snapshot.pending.sourceQuestId, "Q1A_IDEALIZED");

  // v1 키는 남아 있어야 한다.
  assert.ok(storage.getItem("heir_game_progress_v1"));

  // 두 번째 호출은 v2 를 덮어쓰지 않는다.
  const again = Migration.migrateIfNeeded(store, { storage, bundles });
  assert.equal(again.migrated, false);
  assert.equal(again.reason, "v2-present");
}

// ── 8. v1 이 없거나 비었으면 아무 일도 하지 않는다 ──────────────────
{
  const storage = fakeStorage();
  const store = ProgressStoreFactory.create({ storage, bundles });
  assert.equal(Migration.migrateIfNeeded(store, { storage, bundles }).reason, "no-v1");

  const emptyStorage = fakeStorage({
    heir_game_progress_v1: JSON.stringify({ version: 1, flags: [] }),
  });
  const emptyStore = ProgressStoreFactory.create({ storage: emptyStorage, bundles });
  assert.equal(
    Migration.migrateIfNeeded(emptyStore, { storage: emptyStorage, bundles }).reason,
    "empty-v1",
  );
}

console.log("Progress store v2 tests passed.");
