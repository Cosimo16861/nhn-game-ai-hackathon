/**
 * GameDirector — 유일한 화면 전환 주체.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 6.2
 *
 * 제품 코드는 location.href 로 화면을 옮기지 않는다. 모든 전환은 여기를 지난다.
 *
 * 상태
 *   boot / title / cutscene:{bundleId} / board / workbench:{questId} / finale / fatal
 *
 * 전환 중 중복 클릭을 막는 단일 lock 을 둔다. 이전 화면 dispose 가 끝나기 전에
 * 다음 화면을 mount 하지 않는다.
 */
(function (global) {
  "use strict";

  function create(options) {
    const shell = options.shell;
    const progressStore = options.progressStore;
    const artworkStore = options.artworkStore;
    const bundles = options.bundles || global.CompletionBundles;
    const graph = options.graph || global.QuestGraph;

    let state = { name: "boot" };
    let current = null;
    let transitioning = false;

    function isRestorationQuest(questId) {
      return graph.get(questId)?.kind === "restoration";
    }

    function disposeCurrentScreen() {
      try {
        current?.dispose?.();
      } catch (error) {
        console.error("[director] 화면 정리 중 오류", error);
      }
      current = null;
    }

    /** 화면 하나를 통째로 갈아 끼운다. mount 는 dispose 뒤에만 일어난다. */
    async function transition(nextState, mountScreen) {
      if (transitioning) return null;
      transitioning = true;
      try {
        disposeCurrentScreen();
        const container = shell.show(nextState.name);
        state = nextState;
        current = await mountScreen(container);
        return current;
      } catch (error) {
        transitioning = false;
        fatal(error, () => transition(nextState, mountScreen));
        return null;
      } finally {
        transitioning = false;
      }
    }

    function fatal(error, retry) {
      console.error("[director]", error);
      state = { name: "fatal", reason: String(error?.message || error) };
      shell.showFatal(
        error?.message || "알 수 없는 오류가 발생했습니다.",
        retry,
      );
    }

    // ── 화면들 ───────────────────────────────────────────────────────

    function showTitle() {
      return transition({ name: "title" }, (container) => {
        const screen = global.TitleScreen.mount(container, {
          onStart: () => continueGame(),
          onReplayPrologue: () => playBundle(bundles.OPENING_BUNDLE_ID),
          onNewGame: () => startNewGame(),
        });
        screen.setResumable(hasProgress());
        // 엔딩을 본 저장에서만 "새 이야기 시작"을 보여 준다.
        screen.setEndingCompleted(hasCompletedEnding());
        return screen;
      });
    }

    function showBoard() {
      return transition({ name: "board" }, (container) =>
        global.BoardScreen.mount(container, {
          progressStore,
          artworkStore,
          onSelect: (questId) => openQuest(questId),
        }),
      );
    }

    /**
     * 완료 컷신 묶음 재생. 번들이 끝나야 completeBundle 이 호출되고 자식이 열린다.
     * 재생 중 오류가 나면 완료로 기록하지 않는다.
     */
    function playBundle(bundleId) {
      const bundle = bundles.get(bundleId);
      if (!bundle) return Promise.reject(new Error(`알 수 없는 완료 번들: ${bundleId}`));

      return transition({ name: "cutscene", bundleId }, (container) => {
        const screen = global.CutsceneScreen.mount(container, {
          progressStore,
          onBundleComplete: () => {
            try {
              progressStore.completeBundle(bundle.id);
            } catch (error) {
              // 저장에 실패하면 다음 화면으로 넘어가지 않는다.
              fatal(error, () => playBundle(bundleId));
              return;
            }
            afterBundle(bundle);
          },
          onError: (error) => fatal(error, () => playBundle(bundleId)),
        });
        screen.playBundle(bundle.id).catch(() => {
          /* onError 가 이미 처리했다. */
        });
        return screen;
      });
    }

    /** 번들이 끝난 뒤 어디로 가는가. */
    function afterBundle(bundle) {
      if (bundle.id === bundles.OPENING_BUNDLE_ID) {
        // 오프닝이 끝나면 증거판을 거치지 않고 곧바로 튜토리얼로 들어간다.
        openQuest("Q0_MONTAGE");
        return;
      }
      if (bundle.sourceQuestId === "Q6_FINALE") {
        showTitle();
        return;
      }
      showBoard();
    }

    function openQuest(questId) {
      const node = graph.get(questId);
      if (!node) return Promise.reject(new Error(`알 수 없는 퀘스트: ${questId}`));
      if (node.kind === "finale") return openFinale();

      // 등록되지 않은 노드는 막다른 오류로 두지 않고 증거판으로 되돌아가게 한다.
      if (!global.WorkbenchScreen.isSupported(questId)) {
        fatal(
          new Error(`${node.title} 작업대는 아직 준비되지 않았습니다.`),
          () => showBoard(),
        );
        return Promise.resolve(null);
      }

      progressStore.selectQuest(questId);
      return transition({ name: "workbench", questId }, (container) =>
        global.WorkbenchScreen.mount(container, {
          questId,
          artworkStore,
          onBackToBoard: () => showBoard(),
          onPassed: (result) => handleQuestPassed(result),
          onFailed: () => {
            /* 실패해도 화면을 떠나지 않는다. 그림은 그대로 남는다. */
          },
        }),
      );
    }

    /**
     * Q6 증거의 방. 여섯 연결이 모두 맞아야 엔딩이 예약된다.
     * 그전에는 CE_ENDING 이 재생되지 않는다 — GAME_INTEGRATION_PLAN 9.1.
     */
    function openFinale() {
      progressStore.selectQuest("Q6_FINALE");

      // 이미 여섯 연결을 마쳤는데 엔딩을 못 본 상태면 바로 엔딩부터 재개한다.
      if (global.FinaleScreen.isSolved(progressStore) &&
          !progressStore.isQuestCleared("Q6_FINALE")) {
        return completeFinale();
      }

      return transition({ name: "finale" }, (container) =>
        global.FinaleScreen.mount(container, {
          progressStore,
          artworkStore,
          onBackToBoard: () => showBoard(),
          onSolved: () => completeFinale(),
        }),
      );
    }

    /** 여섯 연결 완료. 통과와 엔딩 예약을 한 번의 저장으로 남긴 뒤 재생한다. */
    function completeFinale() {
      const bundle = bundles.forQuest("Q6_FINALE");
      try {
        if (!progressStore.isQuestCleared("Q6_FINALE")) {
          progressStore.beginQuestCompletion("Q6_FINALE", bundle.id);
        }
      } catch (error) {
        fatal(error, () => completeFinale());
        return Promise.resolve(null);
      }
      return playBundle(bundle.id);
    }

    /**
     * 그림 통과. 퀘스트 완료와 완료 컷신 예약을 한 번의 저장으로 남긴 뒤 재생한다.
     * 이 저장이 끝나기 전에는 컷신으로 넘어가지 않는다 — 중간에 창을 닫아도
     * 다음 실행이 완료 컷신부터 재개된다.
     */
    function handleQuestPassed(result) {
      const questId = result.questId;
      const bundle = bundles.forQuest(questId);
      if (!bundle) {
        fatal(new Error(`${questId} 의 완료 컷신 번들이 없습니다.`));
        return;
      }
      try {
        if (!progressStore.isQuestCleared(questId)) {
          progressStore.beginQuestCompletion(questId, bundle.id);
        }
      } catch (error) {
        fatal(error, () => handleQuestPassed(result));
        return;
      }
      playBundle(bundle.id);
    }

    // ── 부팅과 재개 ──────────────────────────────────────────────────

    function hasProgress() {
      const snapshot = progressStore.getSnapshot();
      return snapshot.clearedQuestIds.length > 0 ||
        snapshot.completedBundleIds.length > 0 ||
        snapshot.seenSceneIds.length > 0;
    }

    const ENDING_BUNDLE_ID = bundles.forQuest("Q6_FINALE").id;

    /** 엔딩까지 봤는가. 저장 상태가 "완주"인지 판단하는 단일 기준이다. */
    function hasCompletedEnding() {
      return progressStore.isBundleCompleted(ENDING_BUNDLE_ID);
    }

    /** 재개 우선순위 — GAME_INTEGRATION_PLAN 3.3 */
    function resumeTarget() {
      const pending = progressStore.getPendingTransition();
      if (pending) return { kind: "cutscene", bundleId: pending.bundleId };

      const opening = bundles.opening();
      if (!progressStore.isBundleCompleted(opening.id)) {
        return { kind: "cutscene", bundleId: opening.id };
      }
      // 엔딩을 본 뒤에는 남은 가지를 자유롭게 이어서 한다.
      if (hasCompletedEnding()) return { kind: "board", afterEnding: true };
      // 증거의 방을 열어 두고 나갔다면 거기부터.
      if (graph.statusOf("Q6_FINALE", progressStore) === graph.OPEN) {
        return { kind: "finale" };
      }
      return { kind: "board" };
    }

    function continueGame() {
      const target = resumeTarget();
      if (target.kind === "cutscene") return playBundle(target.bundleId);
      if (target.kind === "finale") return openFinale();
      return showBoard();
    }

    /**
     * 새 게임. 진행 저장과 그림 저장을 함께 지운다 — GAME_INTEGRATION_PLAN 9.2.
     * 확인 절차는 호출자(TitleScreen)가 맡는다. 여기서는 되돌릴 수 없다.
     */
    async function startNewGame() {
      progressStore.reset();
      try {
        await artworkStore?.clearAll?.();
      } catch (error) {
        console.warn("[director] 이전 그림을 지우지 못했습니다.", error);
      }
      return playBundle(bundles.OPENING_BUNDLE_ID);
    }

    /**
     * 저장된 게임 상태 요약. 엔딩 후 무엇이 확정됐는지 한곳에서 읽는다.
     * E2E·진단용이며 제품 UI 는 이 값을 화면에 그대로 뿌리지 않는다.
     */
    function getCompletionState() {
      const snapshot = progressStore.getSnapshot();
      const required = graph.mainRoute();
      const clearedRequired = required.filter((id) => progressStore.isQuestCleared(id));
      const optional = graph.NODES
        .filter((node) => node.route === "branch")
        .map((node) => node.id);

      return Object.freeze({
        // 1. 모든 필수 퀘스트 완료
        requiredQuestIds: Object.freeze(required.slice()),
        requiredCleared: Object.freeze(clearedRequired.slice()),
        allRequiredCleared: clearedRequired.length === required.length,
        // 가지는 엔딩 필수가 아니다 — 계획서 14장 계약.
        optionalQuestIds: Object.freeze(optional),
        optionalCleared: Object.freeze(optional.filter((id) => progressStore.isQuestCleared(id))),
        // 2. 엔딩 완료
        endingBundleId: ENDING_BUNDLE_ID,
        endingCompleted: hasCompletedEnding(),
        endingSceneSeen: progressStore.isSceneSeen("CE_ENDING"),
        // 3. 계속하기 동작
        continueBehaviour: resumeTarget(),
        // 4. 새 게임으로 초기화 가능
        canStartNewGame: true,
        pending: snapshot.pending,
        updatedAt: snapshot.updatedAt,
      });
    }

    /** 통과 직후 새로고침 등으로 남은 완료 컷신을 복구한다. */
    function recoverPendingTransition() {
      const pending = progressStore.getPendingTransition();
      if (!pending) return null;
      return playBundle(pending.bundleId);
    }

    function boot() {
      graph.validate();
      // 퀘스트 등록부 부팅 검증 — GAME_INTEGRATION_PLAN 7.5.
      const problems = global.QuestRegistry?.validate?.() || [];
      if (problems.length) {
        console.error("[quest-registry] 계약 문제\n" + problems.join("\n"));
      }
      global.AssetLoader?.mark?.("app_boot");
      return showTitle();
    }

    return Object.freeze({
      boot,
      startNewGame,
      continueGame,
      showTitle,
      showBoard,
      playBundle,
      openQuest,
      openFinale,
      handleQuestPassed,
      recoverPendingTransition,
      resumeTarget,
      hasCompletedEnding,
      getCompletionState,
      disposeCurrentScreen,
      hasProgress,
      isRestorationQuest,
      getState: () => state,
      /** 읽기 전용. E2E 와 콘솔 진단용이며 제품 UI 는 쓰지 않는다. */
      getCurrentScreen: () => current,
    });
  }

  global.GameDirector = Object.freeze({ create });
})(typeof window !== "undefined" ? window : globalThis);
