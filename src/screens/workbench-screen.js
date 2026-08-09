/**
 * 작업대 화면 어댑터.
 *
 * questimage 계약이 이식된 퀘스트는 고해상도 controller 로 연다.
 * 아직 이식하지 않은 노드는 GameDirector 가 미리 걸러 낸다.
 *
 * URL 파라미터와 location.href 를 쓰지 않는다. 결과는 콜백으로만 나간다.
 */
(function (global) {
  "use strict";

  /**
   * 고해상도 작업대로 이식이 끝난 퀘스트.
   * GAME_INTEGRATION_PLAN 단계 5·7 에서 하나씩 늘린다. 한꺼번에 열지 않는다.
   */
  const HIGHRES_QUEST_IDS = Object.freeze(["Q0_MONTAGE", "Q1A_IDEALIZED"]);

  function isSupported(questId) {
    return HIGHRES_QUEST_IDS.includes(questId) &&
      Boolean(global.QuestImageContracts?.get(questId));
  }

  function mount(container, options) {
    const stage = container.querySelector('[data-role="workbench-stage"]');
    const help = container.querySelector('[data-role="workbench-help"]');
    const questId = options.questId;

    const contract = global.QuestImageContracts?.get(questId);
    if (!isSupported(questId)) {
      throw new Error(`고해상도 작업대가 아직 준비되지 않았습니다: ${questId}`);
    }

    container.setAttribute("aria-label", `${contract.title} 복원 작업대`);
    if (help) {
      help.textContent =
        "색과 도구를 고른 뒤 검은 선 안을 채우세요 · Shift+드래그로 확대한 그림을 옮깁니다.";
    }

    stage.replaceChildren();
    const controller = global.HighResWorkbench.mount(stage, {
      contract,
      artworkStore: options.artworkStore,
      evaluateClip: options.evaluateClip,
      onBackToBoard: () => options.onBackToBoard?.(),
      onPassed: (result) => options.onPassed?.(result),
      onFailed: (result) => options.onFailed?.(result),
    });

    return Object.freeze({
      questId,
      ready: controller.ready,
      getController: () => controller,
      dispose() {
        controller.dispose();
        stage.replaceChildren();
      },
    });
  }

  global.WorkbenchScreen = Object.freeze({ HIGHRES_QUEST_IDS, isSupported, mount });
})(typeof window !== "undefined" ? window : globalThis);
