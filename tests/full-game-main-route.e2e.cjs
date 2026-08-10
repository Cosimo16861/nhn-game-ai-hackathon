/**
 * 처음부터 엔딩까지 — 본선 완주 1회.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 10장 최종 QA 매트릭스 "새 게임 본선"
 *
 * 진짜 GameDirector·ProgressStore·CompletionBundles·QuestRegistry 를 그대로 쓴다.
 * 대역은 화면 어댑터뿐이다 — 그리기와 채점은 각자의 테스트가 본다.
 *
 * 이 테스트가 확인하는 것
 *   시작 화면 → 오프닝 → Q0 → 완료 컷신 → 증거판 → … → Q5A → Q6 → 엔딩 → 시작 화면
 *   각 단계에서 "통과 ≠ 해금" 이 지켜지는가
 *   중간에 껐다 켜도 같은 지점에서 재개되는가
 *   엔딩 뒤 저장 상태가 네 가지를 분명히 말하는가
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
const registry = require(path.join(root, "src/data/quest-registry.js"));
const ProgressStoreFactory = require(path.join(root, "src/core/progress-store.js"));
const FinaleScreen = require(path.join(root, "src/screens/finale-screen.js"));
require(path.join(root, "src/app/game-director.js"));
const { QuestGraph } = win;

const MAIN_ROUTE = QuestGraph.mainRoute();
const RESTORATION_ROUTE = MAIN_ROUTE.filter((id) => id !== "Q6_FINALE");

function sharedStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

/** 저장소를 유지한 채 앱을 다시 띄운다. 브라우저를 껐다 켜는 것과 같다. */
function launch(storage, log) {
  const hooks = {};
  const shell = {
    show: (name) => ({ name }),
    setLoading() {}, showFatal(message) { log.push(`fatal:${message}`); },
    hideFatal() {}, visible: () => null,
  };

  win.TitleScreen = {
    mount() {
      return {
        setResumable(value) { hooks.resumable = value; },
        setEndingCompleted(value) { hooks.endingCompleted = value; },
        dispose() {},
      };
    },
  };
  win.BoardScreen = {
    mount(container, options) {
      hooks.selectQuest = options.onSelect;
      return { dispose() {} };
    },
  };
  win.CutsceneScreen = {
    mount(container, options) {
      hooks.finishBundle = options.onBundleComplete;
      return { playBundle: () => Promise.resolve(), dispose() {} };
    },
  };
  win.WorkbenchScreen = {
    isSupported: (questId) => registry.has(questId),
    mount(container, options) {
      // 실제 그리기·채점은 workbench 테스트와 브라우저 검증이 본다.
      hooks.passQuest = () => options.onPassed({ questId: options.questId });
      return { dispose() {} };
    },
  };
  win.FinaleScreen = Object.assign({}, FinaleScreen, {
    mount(container, options) {
      hooks.solveFinale = () => {
        FinaleScreen.LINKS.forEach((link) => {
          progressStore.setFlag(FinaleScreen.linkFlag(link.questId));
        });
        options.onSolved();
      };
      hooks.linkOne = (index) => {
        progressStore.setFlag(FinaleScreen.linkFlag(FinaleScreen.LINKS[index].questId));
      };
      return { dispose() {} };
    },
  });

  const progressStore = ProgressStoreFactory.create({ storage, bundles });
  const artworkStore = { clearAll: async () => { log.push("artwork:cleared"); } };
  const director = win.GameDirector.create({ shell, progressStore, artworkStore });
  return { director, progressStore, hooks };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

(async function run() {
  const storage = sharedStorage();
  const log = [];
  const steps = [];
  let session = launch(storage, log);

  // ── 시작 화면 ─────────────────────────────────────────────────────
  await session.director.boot();
  assert.equal(session.director.getState().name, "title");
  assert.equal(session.hooks.resumable, false, "저장이 없으면 이어하기가 아니다.");
  assert.equal(session.hooks.endingCompleted, false);
  steps.push("시작 화면");

  // ── 오프닝 ────────────────────────────────────────────────────────
  await session.director.continueGame();
  assert.deepEqual(session.director.getState(), { name: "cutscene", bundleId: "B_OPENING" });
  assert.equal(
    QuestGraph.statusOf("Q0_MONTAGE", session.progressStore),
    QuestGraph.LOCKED,
    "오프닝이 끝나기 전에는 Q0 도 잠겨 있다.",
  );
  session.hooks.finishBundle();
  await tick();
  steps.push("오프닝 B_OPENING");

  // 오프닝이 끝나면 증거판을 거치지 않고 바로 튜토리얼이다.
  assert.deepEqual(session.director.getState(), { name: "workbench", questId: "Q0_MONTAGE" });

  // ── 본선 복원 여섯 개 ─────────────────────────────────────────────
  for (let index = 0; index < RESTORATION_ROUTE.length; index += 1) {
    const questId = RESTORATION_ROUTE[index];
    const quest = registry.get(questId);
    assert.ok(quest, `${questId}: 등록되지 않았습니다.`);
    assert.deepEqual(session.director.getState(), { name: "workbench", questId });

    // 통과 전에는 자식이 잠겨 있다.
    quest.unlocks.questIds.forEach((childId) => {
      assert.equal(
        QuestGraph.statusOf(childId, session.progressStore),
        QuestGraph.LOCKED,
        `${questId} 통과 전에 ${childId} 가 열려 있습니다.`,
      );
    });

    session.hooks.passQuest();
    await tick();

    // 통과 직후: cleared + pending, 그러나 아직 해금은 아니다.
    assert.equal(session.progressStore.isQuestCleared(questId), true);
    assert.equal(
      session.progressStore.getPendingTransition().bundleId,
      quest.completion.bundleId,
    );
    quest.unlocks.questIds.forEach((childId) => {
      assert.equal(
        QuestGraph.statusOf(childId, session.progressStore),
        QuestGraph.LOCKED,
        `${questId} 컷신이 끝나기 전에 ${childId} 가 열렸습니다.`,
      );
    });
    assert.deepEqual(session.director.getState(),
      { name: "cutscene", bundleId: quest.completion.bundleId });

    // 첫 퀘스트 뒤에는 껐다 켜 본다. pending 이 살아 있어야 한다.
    if (index === 0) {
      session = launch(storage, log);
      assert.deepEqual(
        session.director.resumeTarget(),
        { kind: "cutscene", bundleId: quest.completion.bundleId },
        "통과 직후 종료했다면 완료 컷신부터 재개해야 합니다.",
      );
      await session.director.boot();
      assert.equal(session.hooks.resumable, true);
      await session.director.continueGame();
      assert.deepEqual(session.director.getState(),
        { name: "cutscene", bundleId: quest.completion.bundleId });
      steps.push(`재개 확인(${questId} 통과 직후)`);
    }

    session.hooks.finishBundle();
    await tick();

    // 번들 종료 시점에만 자식이 열린다.
    assert.equal(session.progressStore.isBundleCompleted(quest.completion.bundleId), true);
    assert.equal(session.progressStore.getPendingTransition(), null);
    quest.unlocks.questIds.forEach((childId) => {
      assert.equal(
        QuestGraph.statusOf(childId, session.progressStore),
        QuestGraph.OPEN,
        `${quest.completion.bundleId} 가 끝났는데 ${childId} 가 열리지 않았습니다.`,
      );
    });
    steps.push(`${questId} → ${quest.completion.bundleId}`);

    // 증거판에서 다음 본선을 고른다.
    assert.equal(session.director.getState().name, "board");
    const next = MAIN_ROUTE[index + 1];
    await session.hooks.selectQuest(next);
    await tick();
  }

  // ── Q6 증거의 방 ─────────────────────────────────────────────────
  assert.deepEqual(session.director.getState(), { name: "finale" });
  assert.equal(session.director.hasCompletedEnding(), false);
  steps.push("Q6 증거의 방");

  // 다섯 장만 이어도 엔딩은 시작되지 않는다.
  [0, 1, 2, 3, 4].forEach((index) => session.hooks.linkOne(index));
  assert.equal(FinaleScreen.isSolved(session.progressStore), false);
  assert.equal(session.progressStore.getPendingTransition(), null,
    "Q6 를 끝내기 전에 엔딩이 예약되면 안 됩니다.");
  assert.equal(session.progressStore.isQuestCleared("Q6_FINALE"), false);

  // 도중에 껐다 켜도 증거의 방으로 돌아온다.
  session = launch(storage, log);
  assert.deepEqual(session.director.resumeTarget(), { kind: "finale" });
  await session.director.continueGame();
  assert.deepEqual(session.director.getState(), { name: "finale" });
  steps.push("재개 확인(Q6 도중)");

  // 여섯 장을 모두 이으면 통과와 엔딩 예약이 한 번에 저장된다.
  session.hooks.solveFinale();
  await tick();
  assert.equal(session.progressStore.isQuestCleared("Q6_FINALE"), true);
  assert.equal(session.progressStore.getPendingTransition().bundleId, "B_AFTER_Q6");
  assert.deepEqual(session.director.getState(), { name: "cutscene", bundleId: "B_AFTER_Q6" });
  assert.equal(session.director.hasCompletedEnding(), false, "아직 엔딩을 다 본 것은 아니다.");
  steps.push("Q6 완료 → B_AFTER_Q6 예약");

  // ── 엔딩 ─────────────────────────────────────────────────────────
  session.hooks.finishBundle();
  await tick();
  assert.equal(session.director.hasCompletedEnding(), true);
  assert.equal(session.director.getState().name, "title", "엔딩 뒤에는 시작 화면이다.");
  steps.push("엔딩 CE_ENDING");

  // ── 엔딩 후 저장 상태 ────────────────────────────────────────────
  const completion = session.director.getCompletionState();
  assert.equal(completion.allRequiredCleared, true, "필수 퀘스트가 모두 완료돼야 합니다.");
  assert.deepEqual(completion.requiredCleared.slice(), MAIN_ROUTE);
  assert.equal(completion.endingCompleted, true);
  assert.equal(completion.endingSceneSeen, true);
  assert.deepEqual(completion.continueBehaviour, { kind: "board", afterEnding: true });
  assert.equal(completion.canStartNewGame, true);
  assert.deepEqual(completion.optionalCleared.slice(), [],
    "본선만 밟았으므로 가지는 비어 있어야 합니다.");
  steps.push("엔딩 후 상태 확인");

  // 저장을 다시 읽어도 결론이 같다.
  session = launch(storage, log);
  await session.director.boot();
  assert.equal(session.hooks.endingCompleted, true, "새 게임 메뉴가 열려 있어야 합니다.");
  assert.equal(session.director.getCompletionState().endingCompleted, true);
  assert.deepEqual(session.director.resumeTarget(), { kind: "board", afterEnding: true });

  // 계속하기는 증거판으로 간다. 남은 가지를 이어서 할 수 있다.
  await session.director.continueGame();
  assert.equal(session.director.getState().name, "board");
  assert.equal(QuestGraph.statusOf("Q1B_TAVERN_WALL", session.progressStore), QuestGraph.OPEN);
  steps.push("계속하기 → 증거판");

  // ── 새 게임 ──────────────────────────────────────────────────────
  await session.director.startNewGame();
  assert.ok(log.includes("artwork:cleared"), "새 게임은 그림 저장도 지웁니다.");
  const fresh = session.progressStore.getSnapshot();
  assert.deepEqual(fresh.clearedQuestIds.slice(), []);
  assert.deepEqual(fresh.completedBundleIds.slice(), []);
  assert.deepEqual(fresh.flags.slice(), []);
  assert.equal(session.director.hasCompletedEnding(), false);
  assert.deepEqual(session.director.getState(), { name: "cutscene", bundleId: "B_OPENING" });
  steps.push("새 게임 초기화");

  assert.deepEqual(log.filter((entry) => entry.startsWith("fatal:")), [],
    "완주 중 치명적 오류가 없어야 합니다.");

  console.log("Full main-route playthrough passed:");
  steps.forEach((step, index) => console.log(`  ${index + 1}. ${step}`));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
