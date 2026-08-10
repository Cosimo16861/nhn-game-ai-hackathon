/**
 * 컷신 화면 어댑터. CutscenePlayer 를 셸의 cutscene 컨테이너에 붙인다.
 *
 * 입력 규약(GAME_INTEGRATION_PLAN 5.1)
 *   SPACE  현재 문장 완성 / 다음
 *   ESC    이미 끝까지 본 장면만 건너뛰기
 *   R      묶음 처음부터
 *
 * 탭이 비활성화되면 재생을 멈춘다. 되돌아오면 이어서 재생한다.
 */
(function (global) {
  "use strict";

  function mount(container, options) {
    const artCanvas = container.querySelector('[data-role="art"]');
    const textCanvas = container.querySelector('[data-role="text"]');
    const skipHint = container.querySelector('[data-role="skip-hint"]');
    const progressStore = options.progressStore;

    let disposed = false;

    const player = global.CutscenePlayer.create({
      artCanvas,
      textCanvas,
      live: container.querySelector('[data-role="cutscene-live"]'),
      progress: container.querySelector('[data-role="progress"]'),
      isSceneSeen: (sceneId) => progressStore.isSceneSeen(sceneId),
      // 조건부 beat 는 URL fixture 가 아니라 실제 통과 기록으로 판정한다.
      isQuestCleared: (questId) => progressStore.isQuestCleared(questId),
      onBeat(scene) {
        if (skipHint) skipHint.hidden = !progressStore.isSceneSeen(scene.id);
      },
      onSceneComplete(sceneId, info) {
        // 장면 하나가 끝났다. 번들 종료가 아니므로 해금은 하지 않는다.
        if (!info.skipped) progressStore.markSceneSeen(sceneId);
        options.onSceneComplete?.(sceneId, info);
      },
      onBundleComplete: options.onBundleComplete,
      onError: options.onError,
    });

    function onKeydown(event) {
      if (disposed) return;
      if (event.key === " " || event.key === "Enter") {
        if (event.target.matches("button")) return;
        event.preventDefault();
        player.advance();
        return;
      }
      if (event.key === "Escape") player.skip();
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        player.restart();
      }
    }

    function onPointerDown(event) {
      if (event.target.closest("button")) return;
      player.advance();
    }

    function onVisibilityChange() {
      if (global.document.hidden) player.pause();
      else player.resume();
    }

    global.document.addEventListener("keydown", onKeydown);
    container.addEventListener("pointerdown", onPointerDown);
    global.document.addEventListener("visibilitychange", onVisibilityChange);

    return Object.freeze({
      playBundle: (bundleId) => player.playBundle(bundleId),
      debugState: () => player.debugState(),
      dispose() {
        disposed = true;
        global.document.removeEventListener("keydown", onKeydown);
        container.removeEventListener("pointerdown", onPointerDown);
        global.document.removeEventListener("visibilitychange", onVisibilityChange);
        player.dispose();
      },
    });
  }

  global.CutsceneScreen = Object.freeze({ mount });
})(typeof window !== "undefined" ? window : globalThis);
