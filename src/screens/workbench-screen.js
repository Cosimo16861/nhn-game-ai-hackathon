/**
 * 작업대 화면 어댑터.
 *
 * 퀘스트별 코드가 없다. QuestRegistry 에 등록된 descriptor 를 그대로 넘긴다.
 * 새 퀘스트를 여는 데 필요한 것은 데이터뿐이다.
 *
 * URL 파라미터와 location.href 를 쓰지 않는다. 결과는 콜백으로만 나간다.
 */
(function (global) {
  "use strict";

  function isSupported(questId) {
    return Boolean(global.QuestRegistry?.get(questId));
  }

  function mount(container, options) {
    const stage = container.querySelector('[data-role="workbench-stage"]');
    const help = container.querySelector('[data-role="workbench-help"]');
    const questId = options.questId;

    const quest = global.QuestRegistry?.get(questId);
    if (!quest) throw new Error(`등록되지 않은 복원 퀘스트입니다: ${questId}`);

    container.setAttribute("aria-label", `${quest.title} 복원 작업대`);
    if (help) {
      help.textContent =
        "색과 도구를 고른 뒤 검은 선 안을 채우세요 · Shift+드래그로 확대한 그림을 옮깁니다.";
    }

    stage.replaceChildren();
    const controller = global.HighResWorkbench.mount(stage, {
      quest,
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

  global.WorkbenchScreen = Object.freeze({ isSupported, mount });
})(typeof window !== "undefined" ? window : globalThis);
