/**
 * 작업대 화면 어댑터.
 *
 * 현재는 Q0 의 구형 WorkbenchRuntime 만 감싼다. GAME_INTEGRATION_PLAN 단계 5 에서
 * 고해상도 questimage 컨트롤러로 교체할 자리이며, Director 가 보는 계약은 그대로다.
 *
 * URL 파라미터와 location.href 를 쓰지 않는다. 결과는 콜백으로만 나간다.
 */
(function (global) {
  "use strict";

  function mount(container, options) {
    const stage = container.querySelector('[data-role="workbench-stage"]');
    const help = container.querySelector('[data-role="workbench-help"]');
    const questId = options.questId;

    const baseConfig = global.WorkbenchQuestConfig?.get(questId);
    if (!baseConfig) throw new Error(`작업대 설정을 찾을 수 없습니다: ${questId}`);

    // 구 설정의 URL 이동 항목을 Director 콜백으로 바꾼다.
    const config = Object.assign({}, baseConfig, {
      onBackToBoard: () => options.onBackToBoard?.(),
    });

    let disposed = false;
    let session = null;

    if (help) help.textContent = config.helpText || "선화 안을 채색하세요.";
    container.setAttribute("aria-label", config.ariaLabel || config.title);

    function onPassed(event) {
      if (disposed || event.detail?.questId !== questId) return;
      options.onPassed?.({ questId, result: event.detail.result });
    }

    function onFailed(event) {
      if (disposed || event.detail?.questId !== questId) return;
      options.onFailed?.({ questId, result: event.detail.result });
    }

    stage.replaceChildren();
    stage.addEventListener("workbench:passed", onPassed);
    stage.addEventListener("workbench:failed", onFailed);
    session = global.WorkbenchRuntime.mount(stage, config);

    return Object.freeze({
      questId,
      ready: session.ready,
      getSession: () => session,
      dispose() {
        disposed = true;
        stage.removeEventListener("workbench:passed", onPassed);
        stage.removeEventListener("workbench:failed", onFailed);
        // PixelScreen 의 resize 리스너와 그리기 표면까지 함께 떼어 낸다.
        session?.destroy?.();
        stage.replaceChildren();
        session = null;
      },
    });
  }

  global.WorkbenchScreen = Object.freeze({ mount });
})(typeof window !== "undefined" ? window : globalThis);
