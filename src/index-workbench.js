(function (global) {
  "use strict";

  const introShell = document.querySelector(".game-shell");
  const workbenchShell = document.querySelector("[data-role=index-workbench]");
  const stage = workbenchShell.querySelector("[data-role=stage]");
  const help = workbenchShell.querySelector("[data-role=workbench-help]");
  let session = null;
  let activeQuestId = null;
  let activeConfig = null;

  async function open(questId = global.WorkbenchQuestConfig.defaultQuestId) {
    const config = global.WorkbenchQuestConfig.get(questId);
    if (!config) throw new Error(`작업대 설정을 찾을 수 없습니다: ${questId}`);

    introShell.hidden = true;
    workbenchShell.hidden = false;
    workbenchShell.setAttribute("aria-label", config.ariaLabel || config.title);
    help.textContent = config.helpText || "선화 안을 채색하세요.";
    document.title = `${config.title} 작업대`;
    global.GameProgress?.selectQuest(questId);
    activeConfig = config;

    if (!session || activeQuestId !== questId) {
      stage.replaceChildren();
      activeQuestId = questId;
      session = global.WorkbenchRuntime.mount(stage, config);
      global.WorkbenchSession = session;
      if (questId === "Q0_MONTAGE") global.MontageWorkbench = session;
    }

    await session.ready;
    return session;
  }

  global.IndexWorkbench = Object.freeze({
    open,
    getSession: () => session,
    getActiveQuestId: () => activeQuestId,
  });

  stage.addEventListener("workbench:passed", async (event) => {
    if (!activeConfig || event.detail?.questId !== activeConfig.id) return;
    const destination = await global.WorkbenchFlow.complete(activeConfig);
    global.location.href = destination;
  });

  stage.addEventListener("workbench:failed", (event) => {
    if (!activeConfig || event.detail?.questId !== activeConfig.id) return;
    introShell.hidden = true;
    workbenchShell.hidden = false;
  });

  const requestedQuestId = new URLSearchParams(global.location.search).get("workbench");
  if (requestedQuestId) {
    open(requestedQuestId).catch((error) => {
      console.error(error);
      global.location.href = "board.html";
    });
  }
})(window);
