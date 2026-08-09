(function (global) {
  "use strict";

  const registry = global.WorkbenchQuestConfig;
  const stage = document.querySelector("[data-role=stage]");
  const query = new URLSearchParams(global.location.search);
  const questId = query.get("tutorial") || registry.defaultQuestId;
  const config = registry.get(questId);

  if (!config) {
    stage.textContent = `작업대 설정을 찾을 수 없습니다: ${questId}`;
    stage.dataset.error = "unknown-quest";
    return;
  }

  document.title = `${config.title} 작업대`;
  stage.closest("main")?.setAttribute("aria-label", config.ariaLabel || config.title);
  const description = document.querySelector("meta[name=description]");
  if (description && config.description) description.content = config.description;
  const help = document.querySelector(".workbench-help");
  if (help && config.helpText) help.textContent = config.helpText;

  const session = global.WorkbenchRuntime.mount(stage, config);
  global.WorkbenchSession = session;

  // 이전 몽타주 검증 코드와의 호환성을 유지한다.
  if (questId === "Q0_MONTAGE") global.MontageWorkbench = session;
})(window);
