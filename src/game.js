/**
 * 수직 슬라이스 오케스트레이션.
 * 경로: 선술집(코라 대화) → 작업대(고양이 복원) → 숨은 채점 → 정성 피드백
 *       → CAT_POSTER 플래그 → 코라에게 복귀
 */
(function () {
  "use strict";

  const scenes = {};
  let runner = null;
  let workbench = null;

  function show(sceneName) {
    Object.entries(scenes).forEach(([name, element]) => {
      element.hidden = name !== sceneName;
    });
    document.body.dataset.scene = sceneName;
  }

  function talkToCora() {
    show("tavern");

    let startId;
    if (window.GameState.has("CAT_POSTER")) {
      startId = "SIDE_CORA_TALK";
    } else if (window.GameState.has("REST_CAT")) {
      startId = "A1_CAT_DONE";
    } else if (window.GameState.has("QUEST_CAT_ACTIVE")) {
      startId = "A1_CAT_PENDING";
    } else {
      startId = window.DialogueCat.start;
    }

    runner.start(window.DialogueCat, startId, {
      onEnd: () => {
        updateHud();
        if (window.GameState.has("CAT_POSTER")) {
          showEpilogue();
        }
      },
    });
  }

  function goToWorkbench() {
    show("workbench");
    workbench.refresh();
  }

  function showEpilogue() {
    show("epilogue");
  }

  function updateHud() {
    const objective = document.querySelector("[data-role=objective]");
    const toWorkbench = document.querySelector("[data-action=to-workbench]");
    const toTavern = document.querySelector("[data-action=to-tavern]");

    const active = window.GameState.has("QUEST_CAT_ACTIVE");
    const cleared = window.GameState.has("REST_CAT");
    const done = window.GameState.has("CAT_POSTER");

    toWorkbench.hidden = !active || cleared;
    toTavern.hidden = !cleared || done;

    if (done) objective.textContent = "전단이 게시됐다.";
    else if (cleared) objective.textContent = "완성한 전단을 코라에게 보여준다";
    else if (active) objective.textContent = "사무소 작업대에서 안개의 초상을 복원한다";
    else objective.textContent = "선술집에서 코라의 이야기를 듣는다";
  }

  function boot() {
    scenes.tavern = document.querySelector("[data-scene=tavern]");
    scenes.workbench = document.querySelector("[data-scene=workbench]");
    scenes.epilogue = document.querySelector("[data-scene=epilogue]");

    window.GameState.load();

    runner = window.DialogueRunner.create(scenes.tavern);
    workbench = window.Restoration.create(scenes.workbench, {
      quest: window.QuestCat,
      onCleared: () => {
        window.GameState.set("REST_CAT");
        updateHud();
        talkToCora();
      },
    });

    document
      .querySelector("[data-action=to-workbench]")
      .addEventListener("click", goToWorkbench);
    document
      .querySelector("[data-action=to-tavern]")
      .addEventListener("click", talkToCora);
    document.querySelector("[data-action=restart]").addEventListener("click", () => {
      window.GameState.reset();
      window.location.reload();
    });

    updateHud();
    talkToCora();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
