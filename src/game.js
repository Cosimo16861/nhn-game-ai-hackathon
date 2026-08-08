/**
 * 장면 오케스트레이션.
 * 장면의 종류·장소·막·목표를 레지스트리에 두고, 라우터는 그 데이터만 보고
 * 화면을 전환한다. 1단계에서는 기존 고양이 수직 슬라이스만 실제 장면이며
 * 이후 막의 장소는 준비 화면으로 연결한다.
 */
(function () {
  "use strict";

  const STAGES = Object.freeze([
    "prologue",
    "act1",
    "act2",
    "act3",
    "finale",
    "ending",
  ]);
  const DEFAULT_STAGE = "prologue";
  const views = {};
  let runner = null;
  let workbench = null;
  let currentScene = null;
  let dialogueActive = false;

  function hasLegacyCatProgress() {
    return [
      "CAT_POSTER",
      "REST_CAT",
      "QUEST_CAT_ACTIVE",
      "CLUE_CAT_FUR",
      "CLUE_CAT_EAR",
      "CLUE_CAT_RIBBON",
    ].some((flag) => window.GameState.has(flag));
  }

  function prologueObjective() {
    return window.GameState.has("PRO_OFFICE_DONE")
      ? "경찰서로 가서 리드 경위를 만난다"
      : "책상 위에 놓인 리드 경위의 쪽지를 확인한다";
  }

  function act1Objective() {
    if (window.GameState.has("REST1")) {
      return "복원한 초상을 경찰서의 리드에게 보여준다";
    }
    if (window.GameState.has("KD1")) {
      return "사무소 작업대에서 에드먼드의 초상을 복원한다";
    }
    if (window.GameState.has("A1_ELEANOR_DONE")) {
      return "학교에서 옛 가정교사 홀트를 만난다";
    }
    return "아셔튼 저택에서 엘리너를 만난다";
  }

  function hasSealRestorationClues() {
    return [
      "CLUE_SEAL_WAVES",
      "CLUE_ANCHOR_ORIG",
      "CLUE_TATTOO_FRESH",
      "CLUE_CARVER_SEAL_4",
    ].every((flag) => window.GameState.has(flag));
  }

  function act2Objective() {
    if (
      window.GameState.has("KD2_WAITING") &&
      !window.GameState.has("CLUE_LEDGER_SEEN")
    ) {
      return "저택 유품 보관실의 반출 장부를 조사한다";
    }
    if (window.GameState.has("REST2")) {
      return "복원한 인장과 조사 기록을 경찰서의 리드에게 보여준다";
    }
    if (hasSealRestorationClues()) {
      return "사무소 작업대에서 인장과 문신을 복원한다";
    }
    return "저택 유품 보관실에서 인장과 문신 단서를 찾는다";
  }

  function act3Objective() {
    if (!window.GameState.has("KD3")) {
      return "부두에서 생존 선원 뱅크스를 만난다";
    }
    if (!window.GameState.has("REST3")) {
      const catNote = window.GameState.has("CAT_FOUND")
        ? " · 선술집에서 안개를 돌려보낼 수 있다"
        : "";
      return `사무소에서 안개 낀 부두를 복원한다${catNote}`;
    }
    return "경찰서 증거판에서 사건을 정리한다";
  }

  function mainObjective() {
    const stage = stageFromSave();
    if (stage === "prologue") return prologueObjective();
    if (stage === "act1") return act1Objective();
    if (stage === "act2") return act2Objective();
    if (stage === "act3") return act3Objective();
    if (stage === "finale") return "경찰서 증거판에서 사건을 정리한다";
    if (stage === "ending") return "사건 기록을 확인한다";
    return "다음 장면을 준비하고 있다";
  }

  function gameTitle() {
    const stage = stageFromSave();
    const titles = Object.freeze({
      prologue: "프롤로그 · 돌아온 상속자",
      act1: "1막 · 사라진 얼굴",
      act2: "2막 · 지워지지 않는 증거",
      act3: "3막 · 마지막 항해",
      finale: "최종 국면 · 증거판",
    });
    if (stage === "ending") {
      const endingTitle =
        window.GameState.get("LAST_END") === "A"
          ? "엔딩 A · 안개 너머의 진실"
          : "엔딩 B · 반쪽짜리 정의";
      return `안개항의 상속자 · ${endingTitle}`;
    }
    return `안개항의 상속자 · ${titles[stage] || "그레이박스"}`;
  }

  function catObjective() {
    if (window.GameState.has("CAT_POSTER")) return "전단이 게시됐다.";
    if (window.GameState.has("REST_CAT")) {
      return "완성한 전단을 코라에게 보여준다";
    }
    if (window.GameState.has("QUEST_CAT_ACTIVE")) {
      return "사무소 작업대에서 안개의 초상을 복원한다";
    }
    return "선술집에서 코라의 이야기를 듣는다";
  }

  function stageFromSave() {
    const saved = window.GameState.get("STAGE");
    if (STAGES.includes(saved)) return saved;

    // 완전한 새 저장은 프롤로그부터 시작한다. 1단계 이전 고양이 슬라이스의
    // 진행 흔적이 있으면 act1으로 이관해 기존 저장을 그대로 이어 간다.
    const migratedStage = hasLegacyCatProgress() ? "act1" : DEFAULT_STAGE;
    window.GameState.set("STAGE", migratedStage);
    return migratedStage;
  }

  function atOrAfter(minimum, stage = stageFromSave()) {
    return STAGES.indexOf(stage) >= STAGES.indexOf(minimum);
  }

  function beforeOrAt(maximum, stage = stageFromSave()) {
    return STAGES.indexOf(stage) <= STAGES.indexOf(maximum);
  }

  const SCENES = Object.freeze([
    Object.freeze({
      id: "prologue-office",
      type: "dialogue",
      view: "dialogue",
      location: "office",
      stage: { from: "prologue", to: "prologue" },
      priority: 300,
      objective: prologueObjective,
      when: () => !window.GameState.has("PRO_OFFICE_DONE"),
      enter: () => startDialogue(window.DialoguePrologue, "PRO_OFFICE_01"),
    }),
    Object.freeze({
      id: "prologue-police",
      type: "dialogue",
      view: "dialogue",
      location: "police",
      stage: { from: "prologue", to: "prologue" },
      priority: 300,
      objective: prologueObjective,
      when: () => window.GameState.has("PRO_OFFICE_DONE"),
      enter: () =>
        startDialogue(window.DialoguePrologue, "PRO_REED_01", {
          onEnd: (finishedNode) => {
            if (finishedNode && finishedNode.id === "PRO_REED_07") {
              goToLocation("mansion");
            }
          },
        }),
    }),
    Object.freeze({
      id: "act1-eleanor",
      type: "dialogue",
      view: "dialogue",
      location: "mansion",
      stage: { from: "act1", to: "act1" },
      priority: 300,
      objective: act1Objective,
      when: () => !window.GameState.has("A1_ELEANOR_DONE"),
      enter: () => startDialogue(window.DialogueAct1, window.DialogueAct1.eleanorStart),
    }),
    Object.freeze({
      id: "act1-eleanor-recontact",
      type: "dialogue",
      view: "dialogue",
      location: "mansion",
      stage: { from: "act1", to: "act1" },
      priority: 250,
      objective: act1Objective,
      when: () =>
        window.GameState.has("E_PRESSED") &&
        window.GameState.has("KD1") &&
        !window.GameState.has("A1_ELEANOR_RECONTACTED"),
      enter: () => startDialogue(window.DialogueAct1, "A1_ELEANOR_RECONTACT_X"),
    }),
    Object.freeze({
      id: "act1-carver",
      type: "dialogue",
      view: "dialogue",
      location: "mansion",
      stage: { from: "act1", to: "act1" },
      priority: 200,
      objective: act1Objective,
      when: () =>
        window.GameState.has("A1_ELEANOR_DONE") &&
        !window.GameState.has("A1_CARVER_TALKED"),
      enter: () => startDialogue(window.DialogueAct1, window.DialogueAct1.carverStart),
    }),
    Object.freeze({
      id: "act1-holt",
      type: "dialogue",
      view: "dialogue",
      location: "school",
      stage: { from: "act1", to: "act1" },
      priority: 300,
      objective: act1Objective,
      when: () =>
        window.GameState.has("A1_ELEANOR_DONE") && !window.GameState.has("KD1"),
      enter: () => startDialogue(window.DialogueAct1, window.DialogueAct1.holtStart),
    }),
    Object.freeze({
      id: "act1-holt-recall",
      type: "dialogue",
      view: "dialogue",
      location: "school",
      stage: { from: "act1", to: "act1" },
      priority: 200,
      objective: act1Objective,
      when: () => window.GameState.has("KD1"),
      enter: () => startDialogue(window.DialogueAct1, window.DialogueAct1.holtRecall),
    }),
    Object.freeze({
      id: "act1-portrait-restoration",
      type: "restoration",
      view: "workbench",
      location: "office",
      stage: { from: "act1", to: "act1" },
      priority: 300,
      objective: act1Objective,
      when: () => window.GameState.has("KD1") && !window.GameState.has("REST1"),
      enter: startPortraitRestoration,
    }),
    Object.freeze({
      id: "act1-portrait-result",
      type: "dialogue",
      view: "dialogue",
      location: "office",
      stage: { from: "act1", to: "act1" },
      objective: act1Objective,
      navigable: false,
      enter: startPortraitResult,
    }),
    Object.freeze({
      id: "act1-police-review",
      type: "dialogue",
      view: "dialogue",
      location: "police",
      stage: { from: "act1", to: "act1" },
      priority: 300,
      objective: act1Objective,
      when: () => window.GameState.has("REST1"),
      enter: () =>
        startDialogue(window.DialogueAct1, window.DialogueAct1.policeStart, {
          onEnd: (finishedNode) => {
            if (finishedNode && finishedNode.id === "A1_REST1_REED") {
              goToLocation("mansion");
            }
          },
        }),
    }),
    Object.freeze({
      id: "act2-mansion-investigation",
      type: "dialogue",
      view: "dialogue",
      location: "mansion",
      stage: { from: "act2", to: "act2" },
      priority: 300,
      objective: act2Objective,
      when: () => !window.GameState.has("KD2"),
      enter: startAct2Mansion,
    }),
    Object.freeze({
      id: "act2-seal-restoration",
      type: "restoration",
      view: "workbench",
      location: "office",
      stage: { from: "act2", to: "act2" },
      priority: 300,
      objective: act2Objective,
      when: () => hasSealRestorationClues() && !window.GameState.has("REST2"),
      enter: startSealRestoration,
    }),
    Object.freeze({
      id: "act2-seal-result",
      type: "dialogue",
      view: "dialogue",
      location: "office",
      stage: { from: "act2", to: "act2" },
      objective: act2Objective,
      navigable: false,
      enter: () =>
        startDialogue(window.DialogueAct2, window.DialogueAct2.resultStart, {
          onEnd: (finishedNode) => {
            if (finishedNode && finishedNode.id === "A2_REST2_RESULT") {
              goToLocation("police");
            }
          },
        }),
    }),
    Object.freeze({
      id: "act2-police-kd2",
      type: "dialogue",
      view: "dialogue",
      location: "police",
      stage: { from: "act2", to: "act2" },
      priority: 300,
      objective: mainObjective,
      when: () => window.GameState.has("REST2") && !window.GameState.has("KD2"),
      enter: () =>
        startDialogue(window.DialogueAct2, window.DialogueAct2.policeStart, {
          onEnd: (finishedNode) => {
            if (finishedNode && finishedNode.id === "A2_KD2_WAIT") {
              goToLocation("mansion");
            } else if (finishedNode && finishedNode.id === "A2_ACT_END") {
              goToLocation("dock");
            }
          },
        }),
    }),
    Object.freeze({
      id: "act3-banks-kd3",
      type: "dialogue",
      view: "dialogue",
      location: "dock",
      stage: { from: "act3", to: "act3" },
      priority: 300,
      objective: act3Objective,
      when: () => !window.GameState.has("KD3"),
      enter: () => startDialogue(window.DialogueAct3, window.DialogueAct3.banksStart),
    }),
    Object.freeze({
      id: "act3-logbook",
      type: "dialogue",
      view: "dialogue",
      location: "dock",
      stage: { from: "act3", to: "act3" },
      priority: 250,
      objective: act3Objective,
      when: () =>
        window.GameState.has("KD3") &&
        window.GameState.has("LOGBOOK_AVAILABLE") &&
        !window.GameState.has("SUB_LOGBOOK"),
      enter: () => startDialogue(window.DialogueAct3, window.DialogueAct3.logStart),
    }),
    Object.freeze({
      id: "act3-banks-recall",
      type: "dialogue",
      view: "dialogue",
      location: "dock",
      stage: { from: "act3", to: "act3" },
      priority: 100,
      objective: act3Objective,
      when: () => window.GameState.has("KD3"),
      enter: () => startDialogue(window.DialogueAct3, window.DialogueAct3.banksRecall),
    }),
    Object.freeze({
      id: "act3-dock-restoration",
      type: "restoration",
      view: "workbench",
      location: "office",
      stage: { from: "act3", to: "act3" },
      priority: 300,
      objective: act3Objective,
      when: () => window.GameState.has("KD3") && !window.GameState.has("REST3"),
      enter: startDockRestoration,
    }),
    Object.freeze({
      id: "act3-dock-result",
      type: "dialogue",
      view: "dialogue",
      location: "office",
      stage: { from: "act3", to: "finale" },
      objective: mainObjective,
      navigable: false,
      enter: startDockResult,
    }),
    Object.freeze({
      id: "act3-cat-return",
      type: "dialogue",
      view: "dialogue",
      location: "tavern",
      stage: { from: "act3" },
      priority: 400,
      objective: act3Objective,
      when: () =>
        window.GameState.has("CAT_FOUND") &&
        window.GameState.has("SUB_LOGBOOK") &&
        !window.GameState.has("SUB_CAT"),
      enter: () => startDialogue(window.DialogueAct3, window.DialogueAct3.catReturn),
    }),
    Object.freeze({
      id: "finale-board",
      type: "dialogue",
      view: "dialogue",
      location: "police",
      stage: { from: "finale", to: "finale" },
      priority: 500,
      objective: mainObjective,
      enter: () => startDialogue(window.DialogueFinale, window.DialogueFinale.boardStart),
    }),
    Object.freeze({
      id: "ending-menu",
      type: "ending",
      view: "dialogue",
      location: "police",
      stage: { from: "ending", to: "ending" },
      priority: 500,
      objective: mainObjective,
      enter: () => startDialogue(window.DialogueFinale, window.DialogueFinale.menuStart),
    }),
    Object.freeze({
      id: "cat-cora",
      type: "dialogue",
      view: "dialogue",
      location: "tavern",
      priority: 100,
      objective: catObjective,
      enter: startCoraDialogue,
    }),
    Object.freeze({
      id: "cat-restoration",
      type: "restoration",
      view: "workbench",
      location: "office",
      stage: { from: "act1" },
      priority: 100,
      objective: catObjective,
      when: () =>
        window.GameState.has("QUEST_CAT_ACTIVE") &&
        !window.GameState.has("REST_CAT"),
      enter: startCatRestoration,
    }),
    Object.freeze({
      id: "cat-poster",
      type: "board",
      view: "epilogue",
      location: "tavern",
      objective: "전단이 게시됐다.",
      navigable: false,
    }),
    Object.freeze({
      id: "office-ready",
      type: "board",
      view: "placeholder",
      location: "office",
      priority: 0,
      objective: mainObjective,
      title: "탐정 사무소",
      message: "작업대 위에는 마른 붓과 빈 캔버스뿐이다. 지금 복원할 증언이 없다.",
      hint: mainObjective,
    }),
    Object.freeze({
      id: "police-ready",
      type: "board",
      view: "placeholder",
      location: "police",
      priority: 0,
      objective: mainObjective,
      title: "경찰서",
      message:
        "리드 경위는 서류 더미에 파묻혀 있다. 아직 그에게 보일 것이 없다.",
      hint: mainObjective,
    }),
    Object.freeze({
      id: "mansion-ready",
      type: "board",
      view: "placeholder",
      location: "mansion",
      priority: 0,
      objective: mainObjective,
      title: "아셔튼 저택",
      message:
        "응접실은 조용하다. 지금 이 집에서 더 물을 것은 남아 있지 않다.",
      hint: mainObjective,
    }),
    Object.freeze({
      id: "school-ready",
      type: "board",
      view: "placeholder",
      location: "school",
      priority: 0,
      objective: mainObjective,
      title: "학교",
      message:
        "홀트는 아이들 앞에 서 있다. 지금은 말을 붙일 상황이 아니다.",
      hint: mainObjective,
    }),
    Object.freeze({
      id: "dock-ready",
      type: "board",
      view: "placeholder",
      location: "dock",
      priority: 0,
      objective: mainObjective,
      title: "부두·창고",
      message:
        "짠내와 안개뿐이다. 여기서 물어볼 사람은 아직 나타나지 않았다.",
      hint: mainObjective,
    }),
  ]);

  const LOCATIONS = Object.freeze([
    Object.freeze({ id: "office", label: "탐정 사무소", stage: { from: "prologue" } }),
    Object.freeze({ id: "police", label: "경찰서", stage: { from: "prologue" } }),
    Object.freeze({ id: "mansion", label: "아셔튼 저택", stage: { from: "act1" } }),
    Object.freeze({ id: "school", label: "학교", stage: { from: "act1" } }),
    Object.freeze({ id: "tavern", label: "선술집", stage: { from: "act1" } }),
    Object.freeze({ id: "dock", label: "부두·창고", stage: { from: "act3" } }),
  ]);

  /** 장면의 stage는 활성 장소 안에서 현재 막에 맞는 장면을 고를 때만 쓴다. */
  function stageSelectsScene(scene) {
    const stage = stageFromSave();
    const range = scene.stage || {};
    if (range.from && !atOrAfter(range.from, stage)) return false;
    if (range.to && !beforeOrAt(range.to, stage)) return false;
    return true;
  }

  /** 장소 진입 가능 여부의 단일 근거는 LOCATIONS의 stage 범위다. */
  function locationIsAccessible(location) {
    if (!location) return false;
    const stage = stageFromSave();
    const range = location.stage || {};
    if (range.from && !atOrAfter(range.from, stage)) return false;
    if (range.to && !beforeOrAt(range.to, stage)) return false;
    return true;
  }

  function scenePriority(scene) {
    return Number.isFinite(scene.priority) ? scene.priority : 0;
  }

  function compareScenes(left, right) {
    const priorityDifference = scenePriority(right) - scenePriority(left);
    if (priorityDifference !== 0) return priorityDifference;
    // 같은 우선순위에서도 등록 순서에 기대지 않고 ID 오름차순으로 결정한다.
    if (left.id < right.id) return -1;
    if (left.id > right.id) return 1;
    return 0;
  }

  function selectSceneForLocation(locationId) {
    return (
      SCENES.filter(
        (candidate) =>
          candidate.location === locationId &&
          candidate.navigable !== false &&
          stageSelectsScene(candidate) &&
          (!candidate.when || candidate.when()),
      ).sort(compareScenes)[0] || null
    );
  }

  function validateRegistry() {
    const knownTypes = new Set(["dialogue", "restoration", "board", "ending"]);
    const knownLocations = new Set(LOCATIONS.map((location) => location.id));
    const seenIds = new Set();

    SCENES.forEach((scene) => {
      if (seenIds.has(scene.id)) console.error(`중복 장면 ID: ${scene.id}`);
      seenIds.add(scene.id);
      if (!knownTypes.has(scene.type)) console.error(`알 수 없는 장면 유형: ${scene.id}`);
      if (!views[scene.view]) console.error(`장면 뷰가 없음: ${scene.id} → ${scene.view}`);
      if (!knownLocations.has(scene.location)) {
        console.error(`등록되지 않은 장소를 참조함: ${scene.id} → ${scene.location}`);
      }
    });

    // 현재 막에서 버튼이 활성인데 들어갈 장면이 없는 구성은 플레이를 막는다.
    LOCATIONS.filter(locationIsAccessible).forEach((location) => {
      if (!selectSceneForLocation(location.id)) {
        console.error(`활성 장소에 진입 가능한 장면이 없음: ${location.id}`);
      }
    });
  }

  function showView(viewName) {
    Object.entries(views).forEach(([name, element]) => {
      element.hidden = name !== viewName;
    });
    document.body.dataset.scene = currentScene ? currentScene.id : viewName;
    const locationLabel = document.querySelector("[data-role=scene-location]");
    const location = currentScene
      ? LOCATIONS.find((candidate) => candidate.id === currentScene.location)
      : null;
    if (locationLabel && location) locationLabel.textContent = location.label;
  }

  function startDialogue(table, startId, options = {}) {
    dialogueActive = true;
    updateHud();
    runner.start(table, startId, {
      onEnd: (finishedNode) => {
        dialogueActive = false;
        updateHud();
        if (options.onEnd) options.onEnd(finishedNode);
      },
    });
  }

  function startPortraitResult() {
    const startId = window.GameState.has("EV_FACE")
      ? "A1_REST1_RESULT_STRONG"
      : "A1_REST1_RESULT_WEAK";
    startDialogue(window.DialogueAct1, startId);
  }

  function startPortraitRestoration() {
    workbench.setQuest(window.QuestPortrait, {
      onCleared: () => {
        window.GameState.set("REST1");
        goToScene("act1-portrait-result");
      },
    });
  }

  function startAct2Mansion() {
    const startId = window.GameState.has("A2_ROOM_SEEN")
      ? window.DialogueAct2.mansionHub
      : window.DialogueAct2.mansionStart;
    startDialogue(window.DialogueAct2, startId);
  }

  function startSealRestoration() {
    workbench.setQuest(window.QuestSeal, {
      onCleared: () => {
        window.GameState.set("REST2");
        goToScene("act2-seal-result");
      },
    });
  }

  function startDockRestoration() {
    workbench.setQuest(window.QuestDock, {
      onCleared: () => {
        window.GameState.set("REST3");
        goToScene("act3-dock-result");
      },
    });
  }

  function startDockResult() {
    const startId =
      window.GameState.has("EV_CARRIAGE") || window.GameState.has("CLUE_LOGBOOK")
        ? "A3_REST3_RESULT_MARK"
        : "A3_REST3_RESULT_BLURRED";
    startDialogue(window.DialogueAct3, startId, {
      onEnd: (finishedNode) => {
        if (
          finishedNode &&
          ["A3_REST3_RESULT_MARK", "A3_REST3_RESULT_BLURRED"].includes(
            finishedNode.id,
          )
        ) {
          goToLocation("police");
        }
      },
    });
  }

  function startCatRestoration() {
    workbench.setQuest(window.QuestCat, {
      onCleared: () => {
        window.GameState.set("REST_CAT");
        goToLocation("tavern");
      },
    });
  }

  function startCoraDialogue() {
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

    startDialogue(window.DialogueCat, startId, {
      onEnd: (finishedNode) => {
        if (finishedNode && finishedNode.id === "A1_CAT_DONE") {
          goToScene("cat-poster");
        }
      },
    });
  }

  function renderPlaceholder(scene) {
    views.placeholder.querySelector("[data-role=placeholder-title]").textContent =
      scene.title;
    views.placeholder.querySelector("[data-role=placeholder-message]").textContent =
      typeof scene.message === "function" ? scene.message() : scene.message;

    // 왜 지금 할 일이 없는지 알려 준 뒤, 어디로 가야 하는지 짚어 준다.
    const hint = views.placeholder.querySelector("[data-role=placeholder-hint]");
    const guide = typeof scene.hint === "function" ? scene.hint() : scene.hint;
    hint.textContent = guide ? `다음에 할 일 — ${guide}` : "";
    hint.hidden = !guide;
  }

  function goToScene(sceneId) {
    const scene = SCENES.find((candidate) => candidate.id === sceneId);
    if (!scene || !stageSelectsScene(scene) || (scene.when && !scene.when())) {
      return false;
    }

    currentScene = scene;
    if (scene.view === "placeholder") renderPlaceholder(scene);
    showView(scene.view);
    updateHud();
    if (scene.enter) scene.enter();
    return true;
  }

  function goToLocation(location) {
    const locationDefinition = LOCATIONS.find((candidate) => candidate.id === location);
    if (!locationIsAccessible(locationDefinition)) return false;

    const scene = selectSceneForLocation(location);
    return scene ? goToScene(scene.id) : false;
  }

  function resumeCheckpoint(target) {
    const locationByCheckpoint = Object.freeze({
      FINAL: "police",
      KD3: "dock",
      KD2: "police",
      KD1: "school",
    });
    const location = locationByCheckpoint[target];
    if (!location) return false;
    dialogueActive = false;
    return goToLocation(location);
  }

  function restartMissedBranch() {
    const target = window.Ending.restartTarget(window.GameState);
    if (!window.GameState.restoreCheckpoint(target)) {
      console.error(`복귀할 체크포인트를 찾지 못했습니다: ${target}`);
      return false;
    }
    runner.resetHistory();
    return resumeCheckpoint(target);
  }

  function newGamePreservingEndings() {
    const seenA = window.GameState.has("SEEN_END_A");
    const seenB = window.GameState.has("SEEN_END_B");
    window.GameState.reset();
    if (seenA) window.GameState.set("SEEN_END_A");
    if (seenB) window.GameState.set("SEEN_END_B");
    window.GameState.set("STAGE", "prologue");
    runner.resetHistory();
    dialogueActive = false;
    return goToLocation("office");
  }

  function updateHud() {
    const objective = document.querySelector("[data-role=objective]");
    const title = document.querySelector("[data-role=game-title]");
    const sceneObjective = currentScene && currentScene.objective;
    objective.textContent =
      typeof sceneObjective === "function" ? sceneObjective() : sceneObjective || "—";
    title.textContent = gameTitle();

    document.querySelectorAll("[data-location]").forEach((button) => {
      const location = LOCATIONS.find((entry) => entry.id === button.dataset.location);
      const available = locationIsAccessible(location);
      button.disabled = dialogueActive || !available;
      if (dialogueActive) {
        button.title = "대화가 끝난 뒤 이동할 수 있다";
      } else {
        button.title = available ? "" : "현재 막에서는 갈 수 없다";
      }
      if (currentScene && currentScene.location === button.dataset.location) {
        button.setAttribute("aria-current", "location");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  function boot() {
    document.querySelectorAll("[data-scene]").forEach((element) => {
      views[element.dataset.scene] = element;
    });

    window.GameState.load();
    stageFromSave();
    validateRegistry();

    runner = window.DialogueRunner.create(views.dialogue);
    workbench = window.Restoration.create(views.workbench, {
      quest: window.QuestCat,
      onCleared: () => {
        window.GameState.set("REST_CAT");
        goToLocation("tavern");
      },
    });

    document.querySelectorAll("[data-location]").forEach((button) => {
      button.addEventListener("click", () => goToLocation(button.dataset.location));
    });
    document.querySelector("[data-action=restart]").addEventListener("click", () => {
      window.GameState.reset();
      window.location.reload();
    });

    window.GameState.subscribe(updateHud);

    const stage = stageFromSave();
    let initialLocation = "office";
    if (stage === "prologue" && window.GameState.has("PRO_OFFICE_DONE")) {
      initialLocation = "police";
    } else if (stage === "act1" && window.GameState.has("REST1")) {
      initialLocation = "police";
    } else if (stage === "act1" && window.GameState.has("KD1")) {
      initialLocation = "office";
    } else if (stage === "act1" && window.GameState.has("A1_ELEANOR_DONE")) {
      initialLocation = "school";
    } else if (
      stage === "act1" &&
      window.GameState.has("QUEST_CAT_ACTIVE") &&
      !window.GameState.has("REST_CAT")
    ) {
      initialLocation = "office";
    } else if (
      stage === "act1" &&
      [
        "CAT_POSTER",
        "REST_CAT",
        "CLUE_CAT_FUR",
        "CLUE_CAT_EAR",
        "CLUE_CAT_RIBBON",
      ].some((flag) => window.GameState.has(flag))
    ) {
      initialLocation = "tavern";
    } else if (stage === "act1") {
      initialLocation = "mansion";
    } else if (
      stage === "act2" &&
      window.GameState.has("KD2_WAITING") &&
      !window.GameState.has("CLUE_LEDGER_SEEN")
    ) {
      initialLocation = "mansion";
    } else if (stage === "act2" && window.GameState.has("REST2")) {
      initialLocation = "police";
    } else if (stage === "act2" && hasSealRestorationClues()) {
      initialLocation = "office";
    } else if (stage === "act2") {
      initialLocation = "mansion";
    } else if (stage === "act3" && window.GameState.has("KD3")) {
      initialLocation = "office";
    } else if (stage === "act3") {
      initialLocation = "dock";
    } else if (stage === "finale") {
      initialLocation = "police";
    } else if (stage === "ending") {
      initialLocation = "police";
    }
    if (!goToLocation(initialLocation)) goToLocation("office");
  }

  window.SceneRegistry = Object.freeze({
    all: SCENES,
    goTo: goToScene,
    goToLocation,
  });

  window.GameFlow = Object.freeze({
    restartMissedBranch,
    newGamePreservingEndings,
  });

  document.addEventListener("DOMContentLoaded", boot);
})();
