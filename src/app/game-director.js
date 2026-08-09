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
        });
        screen.setResumable(hasProgress());
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

      // 아직 작업대가 등록되지 않은 노드(GAME_INTEGRATION_PLAN 단계 5·7 대상)는
      // 막다른 오류로 두지 않고 증거판으로 되돌아갈 수 있게 한다.
      if (!global.WorkbenchQuestConfig?.get(questId)) {
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
          onBackToBoard: () => showBoard(),
          onPassed: (result) => handleQuestPassed(result),
          onFailed: () => {
            /* 실패해도 화면을 떠나지 않는다. 그림은 그대로 남는다. */
          },
        }),
      );
    }

    function openFinale() {
      // Q6 증거의 방은 단계 8 에서 붙인다. 그때까지는 완료 번들만 재생한다.
      const bundle = bundles.forQuest("Q6_FINALE");
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

    /** 재개 우선순위 — GAME_INTEGRATION_PLAN 3.3 */
    function resumeTarget() {
      const pending = progressStore.getPendingTransition();
      if (pending) return { kind: "cutscene", bundleId: pending.bundleId };

      const opening = bundles.opening();
      if (!progressStore.isBundleCompleted(opening.id)) {
        return { kind: "cutscene", bundleId: opening.id };
      }
      return { kind: "board" };
    }

    function continueGame() {
      const target = resumeTarget();
      if (target.kind === "cutscene") return playBundle(target.bundleId);
      return showBoard();
    }

    function startNewGame() {
      progressStore.reset();
      artworkStore?.clearAll?.();
      return playBundle(bundles.OPENING_BUNDLE_ID);
    }

    /** 통과 직후 새로고침 등으로 남은 완료 컷신을 복구한다. */
    function recoverPendingTransition() {
      const pending = progressStore.getPendingTransition();
      if (!pending) return null;
      return playBundle(pending.bundleId);
    }

    function boot() {
      graph.validate();
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
