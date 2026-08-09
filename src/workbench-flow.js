(function (global) {
  "use strict";

  async function complete(config, options = {}) {
    if (!config?.id) throw new Error("완료할 작업대 퀘스트 설정이 필요합니다.");
    if (!global.GameProgress) throw new Error("게임 진행 관리자가 준비되지 않았습니다.");

    global.GameProgress.markQuestCleared(config.id);

    // 통과 애니메이션이 제작되면 playCompletion에 재생 함수를 전달한다.
    if (typeof options.playCompletion === "function") {
      await options.playCompletion(config);
    }

    if (config.completionCutscene) {
      global.GameProgress.markCutsceneSeen(config.completionCutscene);
    }
    return config.afterPassUrl || config.backUrl || "board.html";
  }

  global.WorkbenchFlow = Object.freeze({ complete });
})(window);
