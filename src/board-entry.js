(function (global) {
  "use strict";

  const MAIN = Object.freeze([
    "Q0_MONTAGE",
    "Q1A_IDEALIZED",
    "Q2A_TRUE_FACE",
    "Q3A_SEAL",
    "Q4A_LEDGER",
    "Q5A_DOCK",
    "Q6_FINALE",
  ]);
  const BRANCH_AFTER = Object.freeze({
    1: Object.freeze(["Q1B_TAVERN_WALL"]),
    2: Object.freeze(["Q2B_CAT", "Q2C_CHILD_ROOM"]),
    3: Object.freeze(["Q3B_TATTOO", "Q3C_WAREHOUSE"]),
    4: Object.freeze(["Q4B_LOGBOOK", "Q4C_SQUARE_BET"]),
    5: Object.freeze(["Q5B_SIREN"]),
  });

  const params = new URLSearchParams(global.location.search);
  const devbar = document.querySelector(".devbar");
  const stepLabel = document.querySelector("[data-role=step]");
  const branchToggle = document.querySelector("[data-action=branches]");
  const previousButton = document.querySelector("[data-action=prev]");
  const nextButton = document.querySelector("[data-action=next]");
  const log = document.querySelector("[data-role=log]");
  const hasSimulationParams = params.has("step") || params.has("branches");
  const devMode = global.__BOARD_FORCE_DEV__ === true ||
    params.get("dev") === "1" || hasSimulationParams;
  let step = Math.max(0, Math.min(MAIN.length, Number(params.get("step")) || 0));
  let withBranches = params.get("branches") === "1";
  const started = Date.now();

  function clock() {
    const elapsed = Math.floor((Date.now() - started) / 1000);
    const pad = (number) => String(number).padStart(2, "0");
    return `${pad(Math.floor(elapsed / 3600))}:` +
      `${pad(Math.floor(elapsed / 60) % 60)}:${pad(elapsed % 60)}`;
  }

  function draw() {
    global.BranchMap.render(global.GameProgress, { clock: clock() });
  }

  function updateDevControls() {
    stepLabel.textContent = step === 0
      ? "오프닝 완료 · 첫 의뢰 대기"
      : `본선 ${step}단계 · ${global.QuestGraph.get(MAIN[step - 1]).title}`;
    previousButton.disabled = step === 0;
    nextButton.disabled = step >= MAIN.length;
    branchToggle.checked = withBranches;
  }

  function applyDevProgress() {
    const flags = new Set([
      "CUTSCENE_SEEN_C0_INTRO",
      "CUTSCENE_SEEN_C0B_THE_JOB",
    ]);
    const clear = (id) => {
      const node = global.QuestGraph.get(id);
      if (!node) return;
      flags.add(`NODE_CLEARED_${id}`);
      flags.add(`CUTSCENE_SEEN_${node.cutscene}`);
    };
    for (let index = 0; index < step; index += 1) {
      clear(MAIN[index]);
      if (withBranches) (BRANCH_AFTER[index] || []).forEach(clear);
    }
    global.GameProgress.replaceFlags(flags);
    updateDevControls();
  }

  global.QuestGraph.validate();
  global.GameProgress.ensureOpeningComplete();
  if (global.__BOARD_FORCE_DEV__ === true && !hasSimulationParams) {
    step = MAIN.reduce(
      (count, id) => global.GameProgress.has(`NODE_CLEARED_${id}`) ? count + 1 : count,
      0,
    );
    withBranches = Object.values(BRANCH_AFTER).flat().some(
      (id) => global.GameProgress.has(`NODE_CLEARED_${id}`),
    );
  }
  global.BranchMap.mount(document.querySelector("[data-role=stage]"), {
    reserveHeight: 76,
    onSelect(id) {
      global.GameProgress.selectQuest(id);
      const node = global.QuestGraph.get(id);
      // board.html 은 단일 셸로 이전되기 전의 확인용 fallback 이다.
      // 제품 진행은 index.html 의 GameDirector 가 담당한다.
      if (global.WorkbenchQuestConfig?.get(id)) {
        global.location.href = `workbench.html?tutorial=${encodeURIComponent(id)}`;
        return;
      }
      log.textContent = `→ ${node.title} · 작업대 준비 중`;
    },
  });
  global.GameProgress.subscribe(draw);

  if (devMode) {
    devbar.classList.add("is-visible");
    if (hasSimulationParams) applyDevProgress();
    else {
      updateDevControls();
      draw();
    }
  } else {
    draw();
  }

  nextButton.addEventListener("click", () => {
    if (step < MAIN.length) step += 1;
    applyDevProgress();
  });
  previousButton.addEventListener("click", () => {
    if (step > 0) step -= 1;
    applyDevProgress();
  });
  document.querySelector("[data-action=reset]").addEventListener("click", () => {
    step = 0;
    withBranches = false;
    applyDevProgress();
  });
  branchToggle.addEventListener("change", (event) => {
    withBranches = event.target.checked;
    applyDevProgress();
  });

  setInterval(draw, 1000);
})(window);
