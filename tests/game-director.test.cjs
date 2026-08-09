/**
 * GameDirector 전환 계약 — GAME_INTEGRATION_PLAN 단계 4.
 *
 * DOM 없이 화면 어댑터를 대역으로 갈아 끼워 전환 순서와 저장 시점만 검증한다.
 * 실제 렌더링은 브라우저 스모크 테스트가 확인한다.
 */
const assert = require("node:assert/strict");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

// 브라우저 전역을 흉내 낸다. src/* 는 window 하나에만 공개한다.
const win = {
  performance: { now: () => Date.now(), mark() {} },
  requestAnimationFrame: () => 0,
  cancelAnimationFrame() {},
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  console,
};
win.window = win;
global.window = win;

require(path.join(root, "src/data/quest-graph.js"));
const bundles = require(path.join(root, "src/data/completion-bundles.js"));
const ProgressStoreFactory = require(path.join(root, "src/core/progress-store.js"));
require(path.join(root, "src/app/game-director.js"));

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
  const disposed = [];

  const shell = {
    show(name) {
      events.push(`show:${name}`);
      return { name };
    },
    setLoading() {},
    showFatal(message) { events.push(`fatal:${message}`); },
    hideFatal() {},
    visible: () => null,
  };

  let cutsceneOnBundleComplete = null;
  let workbenchOnPassed = null;

  win.TitleScreen = {
    mount() {
      return { setResumable() {}, dispose: () => disposed.push("title") };
    },
  };
  win.BoardScreen = {
    mount() {
      return { dispose: () => disposed.push("board") };
    },
  };
  win.CutsceneScreen = {
    mount(container, options) {
      cutsceneOnBundleComplete = options.onBundleComplete;
      return {
        playBundle: () => Promise.resolve(),
        dispose: () => disposed.push("cutscene"),
      };
    },
  };
  // 고해상도 작업대로 이식이 끝난 것은 Q0·Q1A 뿐인 현재 상태를 흉내 낸다.
  win.WorkbenchScreen = {
    isSupported: (questId) => ["Q0_MONTAGE", "Q1A_IDEALIZED"].includes(questId),
    mount(container, options) {
      workbenchOnPassed = options.onPassed;
      return { dispose: () => disposed.push("workbench") };
    },
  };

  const progressStore = ProgressStoreFactory.create({ storage: fakeStorage(), bundles });
  const director = win.GameDirector.create({ shell, progressStore, artworkStore: null });

  return {
    events,
    disposed,
    director,
    progressStore,
    finishBundle: () => cutsceneOnBundleComplete(),
    passQuest: (questId) => workbenchOnPassed({ questId }),
  };
}

(async function run() {
  // ── 1. 새 게임: 타이틀 → 오프닝 → Q0 작업대 ─────────────────────
  {
    const h = harness();
    await h.director.boot();
    assert.equal(h.director.getState().name, "title");

    await h.director.continueGame();
    assert.deepEqual(h.director.getState(), { name: "cutscene", bundleId: "B_OPENING" });
    assert.ok(h.disposed.includes("title"), "타이틀 화면이 정리돼야 합니다.");

    h.finishBundle();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(h.progressStore.isBundleCompleted("B_OPENING"), true);
    assert.deepEqual(h.director.getState(), { name: "workbench", questId: "Q0_MONTAGE" });
    assert.ok(h.disposed.includes("cutscene"));

    // ── 2. 통과 → 완료 컷신. 이 시점에는 자식이 열리지 않는다 ──────
    h.passQuest("Q0_MONTAGE");
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(h.progressStore.isQuestCleared("Q0_MONTAGE"), true);
    assert.equal(h.progressStore.getPendingTransition().bundleId, "B_AFTER_Q0");
    assert.equal(h.progressStore.isBundleCompleted("B_AFTER_Q0"), false);
    assert.equal(
      win.QuestGraph.statusOf("Q1A_IDEALIZED", h.progressStore),
      win.QuestGraph.LOCKED,
      "컷신이 끝나기 전에 자식이 열리면 안 됩니다.",
    );
    assert.deepEqual(h.director.getState(), { name: "cutscene", bundleId: "B_AFTER_Q0" });

    // ── 3. 번들 종료 → 해금 + 증거판 ───────────────────────────────
    h.finishBundle();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(h.progressStore.getPendingTransition(), null);
    assert.equal(
      win.QuestGraph.statusOf("Q1A_IDEALIZED", h.progressStore),
      win.QuestGraph.OPEN,
    );
    assert.equal(h.director.getState().name, "board");
  }

  // ── 4. 재개 우선순위 ───────────────────────────────────────────
  {
    const h = harness();
    assert.deepEqual(
      h.director.resumeTarget(),
      { kind: "cutscene", bundleId: "B_OPENING" },
      "저장이 없으면 오프닝부터 시작해야 합니다.",
    );

    h.progressStore.completeBundle("B_OPENING");
    assert.deepEqual(h.director.resumeTarget(), { kind: "board" });

    h.progressStore.beginQuestCompletion("Q0_MONTAGE", "B_AFTER_Q0");
    assert.deepEqual(
      h.director.resumeTarget(),
      { kind: "cutscene", bundleId: "B_AFTER_Q0" },
      "통과 직후 종료했다면 완료 컷신부터 재개해야 합니다.",
    );
  }

  // ── 5. 작업대가 없는 노드는 막다른 오류로 두지 않는다 ───────────
  {
    const h = harness();
    h.progressStore.completeBundle("B_OPENING");
    h.progressStore.beginQuestCompletion("Q0_MONTAGE", "B_AFTER_Q0");
    h.progressStore.completeBundle("B_AFTER_Q0");

    // Q1A 는 이식이 끝났으므로 열려야 한다.
    await h.director.openQuest("Q1A_IDEALIZED");
    assert.deepEqual(h.director.getState(), { name: "workbench", questId: "Q1A_IDEALIZED" });

    // 아직 이식하지 않은 노드만 안내로 막는다.
    await h.director.openQuest("Q1B_TAVERN_WALL");
    assert.equal(h.director.getState().name, "fatal");
    assert.ok(
      h.events.some((event) => event.startsWith("fatal:")),
      "준비되지 않은 작업대는 안내를 띄워야 합니다.",
    );
  }

  console.log("Game director tests passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
