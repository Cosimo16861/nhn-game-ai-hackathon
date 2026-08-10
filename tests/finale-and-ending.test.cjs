/**
 * Q6 증거의 방과 엔딩 — GAME_INTEGRATION_PLAN 9장.
 *
 *   1. Q6 를 완료하기 전에는 엔딩이 재생되지 않는다.
 *   2. 여섯 연결이 끝나야 통과와 엔딩 예약이 한 번에 저장된다.
 *   3. 엔딩 완료 후 저장 상태가 네 가지를 분명히 말한다.
 *      필수 퀘스트 완료 / 엔딩 완료 / 계속하기 동작 / 새 게임 초기화 가능
 *   4. 새 게임은 진행과 그림을 함께 지운다.
 */
const assert = require("node:assert/strict");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const win = {
  performance: { now: () => Date.now(), mark() {} },
  requestAnimationFrame: () => 0,
  cancelAnimationFrame() {},
  setTimeout, clearTimeout, setInterval, clearInterval, console,
};
win.window = win;
global.window = win;

require(path.join(root, "src/data/quest-graph.js"));
const bundles = require(path.join(root, "src/data/completion-bundles.js"));
const ProgressStoreFactory = require(path.join(root, "src/core/progress-store.js"));
const FinaleScreen = require(path.join(root, "src/screens/finale-screen.js"));
require(path.join(root, "src/app/game-director.js"));
const { QuestGraph } = win;

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

function harness() {
  const events = [];
  const artworkCleared = [];
  let cutsceneOnBundleComplete = null;
  let finaleOnSolved = null;
  let titleFlags = {};

  const shell = {
    show: (name) => { events.push(`show:${name}`); return { name }; },
    setLoading() {}, showFatal(message) { events.push(`fatal:${message}`); },
    hideFatal() {}, visible: () => null,
  };

  win.TitleScreen = {
    mount() {
      return {
        setResumable(value) { titleFlags.resumable = value; },
        setEndingCompleted(value) { titleFlags.endingCompleted = value; },
        dispose() {},
      };
    },
  };
  win.BoardScreen = { mount: () => ({ dispose() {} }) };
  win.CutsceneScreen = {
    mount(container, options) {
      cutsceneOnBundleComplete = options.onBundleComplete;
      return { playBundle: () => Promise.resolve(), dispose() {} };
    },
  };
  win.WorkbenchScreen = {
    isSupported: () => true,
    mount: () => ({ dispose() {} }),
  };
  win.FinaleScreen = Object.assign({}, FinaleScreen, {
    mount(container, options) {
      finaleOnSolved = options.onSolved;
      return { dispose() {} };
    },
  });

  const progressStore = ProgressStoreFactory.create({ storage: fakeStorage(), bundles });
  const artworkStore = { clearAll: async () => { artworkCleared.push(Date.now()); } };
  const director = win.GameDirector.create({ shell, progressStore, artworkStore });

  return {
    events, titleFlags, artworkCleared, director, progressStore,
    finishBundle: () => cutsceneOnBundleComplete(),
    solveFinale: () => finaleOnSolved(),
    isFinaleMounted: () => Boolean(finaleOnSolved),
  };
}

/** 본선을 Q5A 까지 끝내고 Q6 만 열린 상태를 만든다. */
function reachFinale(progressStore) {
  const mainRoute = ["Q0_MONTAGE", "Q1A_IDEALIZED", "Q2A_TRUE_FACE",
    "Q3A_SEAL", "Q4A_LEDGER", "Q5A_DOCK"];
  progressStore.completeBundle(bundles.OPENING_BUNDLE_ID);
  for (const questId of mainRoute) {
    const bundle = bundles.forQuest(questId);
    progressStore.beginQuestCompletion(questId, bundle.id);
    progressStore.completeBundle(bundle.id);
  }
}

(async function run() {
  // ── 1. 연결표와 화면 계약 ────────────────────────────────────────
  {
    assert.equal(FinaleScreen.LINKS.length, 6, "증거는 여섯 장이어야 합니다.");
    assert.deepEqual(
      FinaleScreen.REQUIRED_QUEST_IDS.slice(),
      QuestGraph.mainRoute().filter((id) => id !== "Q6_FINALE"),
      "증거 여섯 장은 본선 복원 퀘스트와 같아야 합니다.",
    );
    const claims = new Set(FinaleScreen.LINKS.map((link) => link.claim));
    assert.equal(claims.size, 6, "주장이 중복됩니다.");
    FinaleScreen.LINKS.forEach((link) => {
      assert.ok(link.card, `${link.questId}: 카드 이름이 없습니다.`);
      assert.match(link.fallback, /^assets\/cutscenes\/l5-l6\/evidence\/EV_.+\.png$/,
        `${link.questId}: 대체 이미지 경로가 계획서 9.1 과 다릅니다.`);
    });
  }

  // ── 2. Q6 완료 전에는 엔딩이 재생되지 않는다 ─────────────────────
  {
    const h = harness();
    reachFinale(h.progressStore);
    assert.equal(QuestGraph.statusOf("Q6_FINALE", h.progressStore), QuestGraph.OPEN);

    await h.director.openQuest("Q6_FINALE");
    assert.deepEqual(h.director.getState(), { name: "finale" },
      "Q6 를 고르면 증거의 방이 열려야 합니다.");
    assert.equal(h.progressStore.isBundleCompleted("B_AFTER_Q6"), false);
    assert.equal(h.progressStore.getPendingTransition(), null,
      "연결 전에는 엔딩이 예약되면 안 됩니다.");
    assert.equal(h.director.hasCompletedEnding(), false);

    // 다섯 장만 이어도 엔딩은 열리지 않는다.
    FinaleScreen.LINKS.slice(0, 5).forEach((link) => {
      h.progressStore.setFlag(FinaleScreen.linkFlag(link.questId));
    });
    assert.equal(FinaleScreen.isSolved(h.progressStore), false);
    await h.director.openQuest("Q6_FINALE");
    assert.deepEqual(h.director.getState(), { name: "finale" },
      "다섯 장만 이어서는 엔딩으로 넘어가면 안 됩니다.");
    assert.equal(h.progressStore.isQuestCleared("Q6_FINALE"), false);
  }

  // ── 3. 여섯 연결 → 통과 + 엔딩 예약 → 엔딩 ───────────────────────
  {
    const h = harness();
    reachFinale(h.progressStore);
    await h.director.openQuest("Q6_FINALE");

    FinaleScreen.LINKS.forEach((link) => {
      h.progressStore.setFlag(FinaleScreen.linkFlag(link.questId));
    });
    assert.equal(FinaleScreen.isSolved(h.progressStore), true);

    h.solveFinale();
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(h.progressStore.isQuestCleared("Q6_FINALE"), true);
    assert.equal(h.progressStore.getPendingTransition().bundleId, "B_AFTER_Q6");
    assert.deepEqual(h.director.getState(), { name: "cutscene", bundleId: "B_AFTER_Q6" });
    // 아직 엔딩을 끝까지 본 것은 아니다.
    assert.equal(h.director.hasCompletedEnding(), false);

    // 통과 직후 종료했다가 다시 열면 엔딩부터 재개한다.
    assert.deepEqual(h.director.resumeTarget(), { kind: "cutscene", bundleId: "B_AFTER_Q6" });

    h.finishBundle();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // ── 4. 엔딩 완료 후 저장 상태 ──────────────────────────────────
    assert.equal(h.director.hasCompletedEnding(), true);
    assert.equal(h.progressStore.getPendingTransition(), null);
    assert.equal(h.director.getState().name, "title", "엔딩 뒤에는 시작 화면으로 돌아갑니다.");

    const completion = h.director.getCompletionState();
    // (1) 모든 필수 퀘스트 완료
    assert.deepEqual(completion.requiredQuestIds.slice(), QuestGraph.mainRoute());
    assert.equal(completion.allRequiredCleared, true);
    assert.deepEqual(completion.requiredCleared.slice(), QuestGraph.mainRoute());
    // 가지는 엔딩 필수가 아니다.
    assert.deepEqual(completion.optionalCleared.slice(), []);
    assert.equal(completion.optionalQuestIds.length, 8);
    // (2) 엔딩 완료
    assert.equal(completion.endingBundleId, "B_AFTER_Q6");
    assert.equal(completion.endingCompleted, true);
    assert.equal(completion.endingSceneSeen, true);
    // (3) 계속하기 동작
    assert.deepEqual(completion.continueBehaviour, { kind: "board", afterEnding: true });
    assert.equal(completion.pending, null);
    // (4) 새 게임으로 초기화 가능
    assert.equal(completion.canStartNewGame, true);

    // 저장을 다시 읽어도 같은 결론이 나온다.
    assert.equal(h.titleFlags.endingCompleted, true,
      "엔딩을 본 저장에서만 새 게임 메뉴가 열려야 합니다.");
    assert.equal(h.titleFlags.resumable, true);

    // 계속하기는 증거판으로 간다.
    await h.director.continueGame();
    assert.equal(h.director.getState().name, "board");

    // ── 5. 새 게임 초기화 ──────────────────────────────────────────
    await h.director.startNewGame();
    assert.equal(h.artworkCleared.length, 1, "새 게임은 그림 저장도 지웁니다.");
    const fresh = h.progressStore.getSnapshot();
    assert.deepEqual(fresh.clearedQuestIds.slice(), []);
    assert.deepEqual(fresh.completedBundleIds.slice(), []);
    assert.deepEqual(fresh.seenSceneIds.slice(), []);
    assert.deepEqual(fresh.flags.slice(), [], "Q6 연결 플래그도 지워져야 합니다.");
    assert.equal(h.director.hasCompletedEnding(), false);
    assert.equal(FinaleScreen.isSolved(h.progressStore), false);
    assert.deepEqual(h.director.getState(), { name: "cutscene", bundleId: "B_OPENING" });
  }

  // ── 6. 엔딩을 안 본 저장에서는 새 게임 메뉴가 없다 ────────────────
  {
    const h = harness();
    reachFinale(h.progressStore);
    await h.director.showTitle();
    assert.equal(h.titleFlags.endingCompleted, false);
    assert.deepEqual(h.director.resumeTarget(), { kind: "finale" },
      "Q6 가 열려 있으면 계속하기가 증거의 방으로 갑니다.");
  }

  console.log("Finale and ending tests passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
