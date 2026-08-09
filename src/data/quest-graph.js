/**
 * 퀘스트 가지 그래프 — 노드·간선·해금 정본 데이터.
 * 근거: docs/QUEST_BRANCH.md (구조), docs/STORY_OUTLINE.md (이야기),
 *       docs/script/07_CUTSCENES.md (컷신 대본)
 *
 * 이 파일 하나가 게임의 진행 구조 전부다. 월드 이동·대화 분기는 폐기됐고,
 * 플레이어의 유일한 결정은 "다음에 어느 원을 고를 것인가"다.
 *
 * 규약
 *   route: "main"   주황 — 엔딩까지 이어지는 유일한 루트. 레이어당 정확히 1개
 *          "branch" 파랑 — 플레이 가능하지만 엔딩으로 이어지지 않는다
 *          "start"  빨강 — 튜토리얼
 *          "end"    초록 — 종점
 *   kind:  "restoration" 복원 퀘스트 / "finale" 증거 연결 + 엔딩
 *
 * 해금은 "부모 통과"가 아니라 "부모의 컷신 종료"로 일어난다.
 * 컷신 중 이탈해도 grants/unlocks가 유실되지 않도록 종료 시 일괄 적용한다.
 */
(function () {
  "use strict";

  /** 노드 상태 */
  const LOCKED = "locked";
  const OPEN = "open";
  const CLEARED = "cleared";

  const NODES = Object.freeze([
    Object.freeze({
      id: "Q0_MONTAGE",
      layer: 0,
      route: "start",
      kind: "restoration",
      title: "골목의 손",
      subject: "소매치기 수배 몽타주",
      why: "목격자의 말뿐이라 경찰이 얼굴을 못 쥔다",
      place: "office",
      witness: "마르타",
      gridSize: 64,
      budgetMinutes: 3,
      questModule: "QuestMontage", // 신규
      parents: Object.freeze([]),
      cutscene: "C1_THE_CASE",
    }),

    // ── L1 ──────────────────────────────────────────────────────────
    Object.freeze({
      id: "Q1A_IDEALIZED",
      layer: 1,
      route: "main",
      kind: "restoration",
      title: "미화된 초상",
      subject: "엘리너가 간직한 12년 전 초상",
      why: "물감이 벗겨졌다. 남은 유일한 열여덟 살 얼굴이다",
      place: "asherton-parlor",
      witness: "엘리너",
      gridSize: 256,
      budgetMinutes: 5,
      questModule: "QuestIdealized", // 신규
      parents: Object.freeze(["Q0_MONTAGE"]),
      cutscene: "C2A_WHAT_WAS_ERASED",
    }),
    Object.freeze({
      id: "Q1B_TAVERN_WALL",
      layer: 1,
      route: "branch",
      kind: "restoration",
      title: "선술집 벽",
      subject: "20년치 낙서 중 12년 전 층의 얼굴",
      why: "카버가 12년 전에도 이 도시에 있었는지 알려면 그 층을 꺼내야 한다",
      place: "tavern",
      witness: "코라",
      gridSize: 96,
      budgetMinutes: 3,
      questModule: "QuestTavernWall", // 신규
      parents: Object.freeze(["Q0_MONTAGE"]),
      cutscene: "C2B_THE_WALL",
    }),

    // ── L2 ──────────────────────────────────────────────────────────
    Object.freeze({
      id: "Q2A_TRUE_FACE",
      layer: 2,
      route: "main",
      kind: "restoration",
      title: "기억되지 않은 얼굴",
      subject: "홀트의 증언으로 세운 에드먼드",
      why: "미화되지 않은 얼굴은 홀트의 기억에만 있다",
      place: "school",
      witness: "홀트",
      gridSize: 256,
      budgetMinutes: 6,
      questModule: "QuestPortrait", // 기존 src/data/quest-portrait.js (REST1)
      parents: Object.freeze(["Q1A_IDEALIZED"]),
      cutscene: "C3A_THE_SEAL_HE_DREW",
    }),
    Object.freeze({
      id: "Q2B_CAT",
      layer: 2,
      route: "branch",
      kind: "restoration",
      title: "안개를 찾습니다",
      subject: "잃어버린 고양이 전단",
      why: "전단을 붙이려면 그림이 필요하다",
      place: "tavern",
      witness: "코라",
      gridSize: 16,
      budgetMinutes: 3,
      questModule: "QuestCat", // 기존 src/data/quest-cat.js
      parents: Object.freeze(["Q1B_TAVERN_WALL"]),
      cutscene: "C3B_THE_FLYER",
    }),
    Object.freeze({
      id: "Q2C_CHILD_ROOM",
      layer: 2,
      route: "branch",
      kind: "restoration",
      title: "닫힌 방",
      subject: "벽에 남은 아이의 크레용 그림",
      why: "물이 새어 번지고 있다. 지금 옮기지 않으면 사라진다",
      place: "asherton-west-hall",
      witness: "베스",
      gridSize: 128,
      budgetMinutes: 3,
      questModule: "QuestChildRoom", // 신규
      parents: Object.freeze(["Q1A_IDEALIZED"]),
      cutscene: "C3C_THE_DOOR",
    }),

    // ── L3 ──────────────────────────────────────────────────────────
    Object.freeze({
      id: "Q3A_SEAL",
      layer: 3,
      route: "main",
      kind: "restoration",
      title: "봉인의 세 줄",
      subject: "깨진 밀랍 봉인과 편지에 눌린 자국",
      why: "조각나 있어 맞춰 그려야 문양이 나온다",
      place: "asherton-keepsake",
      witness: "엘리너",
      gridSize: 128,
      budgetMinutes: 5,
      questModule: "QuestSeal", // 기존 quest-seal.js에서 문신 요소를 분리한 뒤 승계
      parents: Object.freeze(["Q2A_TRUE_FACE"]),
      cutscene: "C4A_WET_LEDGER",
    }),
    Object.freeze({
      id: "Q3B_TATTOO",
      layer: 3,
      route: "branch",
      kind: "restoration",
      title: "너무 새것인 닻",
      subject: "카버의 손목 문신",
      why: "조서에 붙여야 한다. 내일 소매를 안 걷으면 안 남는다",
      place: "police-station",
      witness: "카버",
      gridSize: 128,
      budgetMinutes: 3,
      questModule: "QuestTattoo", // quest-seal.js에서 분할 신설
      parents: Object.freeze(["Q2A_TRUE_FACE"]),
      cutscene: "C4B_TOO_NEW",
    }),
    Object.freeze({
      id: "Q3C_WAREHOUSE",
      layer: 3,
      route: "branch",
      kind: "restoration",
      title: "창고의 불빛",
      subject: "등불로 비춘 창고 내부",
      why: "창문이 없다. 비춘 자리를 이어 붙여야 안이 보인다",
      place: "dock-warehouse",
      witness: "부두 인부",
      gridSize: 128,
      budgetMinutes: 4,
      questModule: "QuestWarehouse", // 신규
      parents: Object.freeze(["Q2B_CAT"]),
      cutscene: "C4C_WHAT_THE_CAT_FOUND",
    }),

    // ── L4 ──────────────────────────────────────────────────────────
    Object.freeze({
      id: "Q4A_LEDGER",
      layer: 4,
      route: "main",
      kind: "restoration",
      title: "번진 장부",
      subject: "물에 번진 재산 관리 장부 면",
      why: "필경사도 못 읽는다. 남은 자국을 봐야 한다",
      place: "police-station",
      witness: "리드",
      gridSize: 128,
      budgetMinutes: 5,
      questModule: "QuestLedger", // 신규 — 얼굴이 아닌 글자·선을 복원하는 유일한 퀘스트
      parents: Object.freeze(["Q3A_SEAL"]),
      cutscene: "C5A_THE_BLACK_CARRIAGE",
    }),
    Object.freeze({
      id: "Q4B_LOGBOOK",
      layer: 4,
      route: "branch",
      kind: "restoration",
      title: "잃어버린 항해일지",
      subject: "찢어진 일지 조각",
      why: "조각나 있고, 주인에게 돌려줘야 한다",
      place: "dock",
      witness: "뱅크스",
      gridSize: 128,
      budgetMinutes: 4,
      questModule: "QuestLogbook", // 신규
      parents: Object.freeze(["Q3C_WAREHOUSE"]),
      cutscene: "C5B_A_WEEK_BEFORE",
    }),
    Object.freeze({
      id: "Q4C_SQUARE_BET",
      layer: 4,
      route: "branch",
      kind: "restoration",
      title: "광장의 내기",
      subject: "떠돌이 화가의 반쯤 지워진 그림",
      why: "군중 앞에서 간판을 걸고 도전받았다",
      place: "town-square",
      witness: "램",
      gridSize: 96,
      budgetMinutes: 3,
      questModule: "QuestSquareBet", // 신규
      parents: Object.freeze(["Q3A_SEAL"]),
      cutscene: "C5C_THE_PAINTER",
    }),

    // ── L5 ──────────────────────────────────────────────────────────
    Object.freeze({
      id: "Q5A_DOCK",
      layer: 5,
      route: "main",
      kind: "restoration",
      title: "안개 낀 부두",
      subject: "가스등 아래 검은 마차의 밤",
      why: "뱅크스는 봤지만 그리지 못한다",
      place: "dock",
      witness: "뱅크스",
      gridSize: 256,
      budgetMinutes: 6,
      questModule: "QuestDock", // 기존 quest-dock.js (REST3) + fourth-wave 이관
      parents: Object.freeze(["Q4A_LEDGER"]),
      cutscene: "C6_EVIDENCE_WALL",
    }),
    Object.freeze({
      id: "Q5B_SIREN",
      layer: 5,
      route: "branch",
      kind: "restoration",
      title: "세이렌 호의 밤",
      subject: "기울어지는 배",
      why: "그 밤을 본 사람은 뱅크스뿐이고, 그가 죽으면 같이 없어진다",
      place: "tavern",
      witness: "뱅크스",
      gridSize: 128,
      budgetMinutes: 4,
      questModule: "QuestSiren", // 신규
      parents: Object.freeze(["Q4B_LOGBOOK"]),
      cutscene: "C6B_THAT_NIGHT",
    }),

    // ── L6 ──────────────────────────────────────────────────────────
    Object.freeze({
      id: "Q6_FINALE",
      layer: 6,
      route: "end",
      kind: "finale",
      title: "증거의 방",
      subject: "붉은 실로 잇는 증거판",
      place: "office",
      witness: null,
      gridSize: null,
      budgetMinutes: 4,
      questModule: null, // 복원이 아니다. 실 잇기 + CE_ENDING 재생
      parents: Object.freeze(["Q5A_DOCK"]),
      cutscene: "CE_ENDING",
    }),
  ]);

  /**
   * 컷신 → 해금 매핑.
   * parents에서 자동 산출할 수도 있지만, 명시해 두고 부팅 시 교차 검증한다.
   * 대본과 어긋나면 콘솔에 경고를 남긴다.
   */
  /**
   * 게임 시작 시 연속 재생되는 오프닝. 마지막 컷이 끝나면 튜토리얼로 바로 들어간다
   * (증거판을 거치지 않는다 — 판은 C1_THE_CASE 이후 처음 등장한다).
   */
  const OPENING = Object.freeze(["C0_INTRO", "C0B_THE_JOB"]);

  /** 첫 노드를 여는 컷신. 오프닝의 마지막 컷이다. */
  const GATE_CUTSCENE = OPENING[OPENING.length - 1];

  const UNLOCKS = Object.freeze({
    C0_INTRO: Object.freeze([]),
    C0B_THE_JOB: Object.freeze(["Q0_MONTAGE"]),
    C1_THE_CASE: Object.freeze(["Q1A_IDEALIZED", "Q1B_TAVERN_WALL"]),
    C2A_WHAT_WAS_ERASED: Object.freeze(["Q2A_TRUE_FACE", "Q2C_CHILD_ROOM"]),
    C2B_THE_WALL: Object.freeze(["Q2B_CAT"]),
    C3A_THE_SEAL_HE_DREW: Object.freeze(["Q3A_SEAL", "Q3B_TATTOO"]),
    C3B_THE_FLYER: Object.freeze(["Q3C_WAREHOUSE"]),
    C3C_THE_DOOR: Object.freeze([]),
    C4A_WET_LEDGER: Object.freeze(["Q4A_LEDGER", "Q4C_SQUARE_BET"]),
    C4B_TOO_NEW: Object.freeze([]),
    C4C_WHAT_THE_CAT_FOUND: Object.freeze(["Q4B_LOGBOOK"]),
    C5A_THE_BLACK_CARRIAGE: Object.freeze(["Q5A_DOCK"]),
    C5B_A_WEEK_BEFORE: Object.freeze(["Q5B_SIREN"]),
    C5C_THE_PAINTER: Object.freeze([]),
    C6_EVIDENCE_WALL: Object.freeze(["Q6_FINALE"]),
    C6B_THAT_NIGHT: Object.freeze([]),
    CE_ENDING: Object.freeze([]),
  });

  /**
   * 후일담 변주 조건. 엔딩 자체는 갈라지지 않는다(단일 엔딩).
   * 완료한 가지에 따라 CE_ENDING 4단계에 컷이 삽입될 뿐이다.
   */
  const EPILOGUE_CUTS = Object.freeze([
    Object.freeze({ requires: "Q2C_CHILD_ROOM", cut: "EPI_OPEN_DOOR" }),
    Object.freeze({ requires: "Q3B_TATTOO", cut: "EPI_TATTOO_CONFESSION" }),
    Object.freeze({ requires: "Q3C_WAREHOUSE", cut: "EPI_CAT_AT_WINDOW" }),
    Object.freeze({ requires: "Q4C_SQUARE_BET", cut: "EPI_RAM_COPIES" }),
    Object.freeze({ requires: "Q5B_SIREN", cut: "EPI_LAST_PAINTING" }),
  ]);

  const byId = new Map(NODES.map((node) => [node.id, node]));

  /** 부모 → 자식 색인. parents로부터 역산한다. */
  const childrenOf = new Map(NODES.map((node) => [node.id, []]));
  NODES.forEach((node) => {
    node.parents.forEach((parentId) => {
      const bucket = childrenOf.get(parentId);
      if (bucket) bucket.push(node.id);
    });
  });

  function get(id) {
    return byId.get(id) || null;
  }

  function children(id) {
    return (childrenOf.get(id) || []).slice();
  }

  function nodesInLayer(layer) {
    return NODES.filter((node) => node.layer === layer);
  }

  /** 본선 경로. 엔딩까지 이어지는 유일한 루트다. */
  function mainRoute() {
    return NODES.filter(
      (node) => node.route === "start" || node.route === "main" || node.route === "end"
    ).map((node) => node.id);
  }

  /**
   * 상태 산출. 진행 정보는 State 플래그에만 있고 이 모듈은 상태를 갖지 않는다.
   *   NODE_CLEARED_<id>  복원 통과
   *   CUTSCENE_SEEN_<id> 컷신 종료(해금의 실제 트리거)
   */
  function statusOf(id, state) {
    if (state.has("NODE_CLEARED_" + id)) return CLEARED;
    const node = get(id);
    if (!node) return LOCKED;
    if (node.parents.length === 0) {
      return state.has("CUTSCENE_SEEN_" + GATE_CUTSCENE) ? OPEN : LOCKED;
    }
    // 부모 중 하나라도 그 컷신을 끝까지 봤으면 열린다.
    const opened = node.parents.some((parentId) => {
      const parent = get(parentId);
      return parent && state.has("CUTSCENE_SEEN_" + parent.cutscene);
    });
    return opened ? OPEN : LOCKED;
  }

  /** 증거판에 그릴 간선. 양쪽이 CLEARED일 때만 실이 칠해진다. */
  function edges() {
    const list = [];
    NODES.forEach((node) => {
      node.parents.forEach((parentId) => {
        const parent = get(parentId);
        // 본선끼리 이어질 때만 붉은 실. 나머지는 흰 실.
        const mainish = (n) => n && n.route !== "branch";
        list.push({
          from: parentId,
          to: node.id,
          thread: mainish(parent) && mainish(node) ? "red" : "white",
        });
      });
    });
    return list;
  }

  /**
   * 재개 지점. 퀘스트는 통과했는데 그 컷신을 끝까지 못 본 노드가 있으면
   * 그 컷신부터 다시 재생한다. 컷신은 원자적이라 중간 종료 시 grants 가 반영되지
   * 않으므로, 이 함수가 없으면 진행이 영구히 막힌다.
   * 동시에 대기하는 컷신은 최대 하나다(클리어 즉시 재생되므로).
   */
  function pendingCutscene(state) {
    if (!state.has("CUTSCENE_SEEN_" + GATE_CUTSCENE)) {
      const seen = OPENING.filter((id) => state.has("CUTSCENE_SEEN_" + id));
      return OPENING[seen.length];
    }
    const stuck = NODES.find(
      (node) =>
        state.has("NODE_CLEARED_" + node.id) &&
        !state.has("CUTSCENE_SEEN_" + node.cutscene)
    );
    return stuck ? stuck.cutscene : null;
  }

  /** 엔딩 진입 전 확인창용. 아직 열려만 있고 안 한 원이 있는가. */
  function openUnplayed(state) {
    return NODES.filter(
      (node) => node.id !== "Q6_FINALE" && statusOf(node.id, state) === OPEN
    ).map((node) => node.id);
  }

  /** 부팅 시 1회. 그래프와 UNLOCKS 표가 어긋나면 알린다. */
  function validate() {
    const problems = [];

    Object.entries(UNLOCKS).forEach(([cutsceneId, unlocked]) => {
      unlocked.forEach((nodeId) => {
        if (!byId.has(nodeId)) {
          problems.push(cutsceneId + " → 없는 노드 " + nodeId);
        }
      });
    });

    NODES.forEach((node) => {
      if (node.parents.length === 0 && node.route !== "start") {
        problems.push(node.id + ": 부모가 없는데 시작 노드가 아니다");
      }
      node.parents.forEach((parentId) => {
        const parent = get(parentId);
        if (!parent) {
          problems.push(node.id + ": 없는 부모 " + parentId);
          return;
        }
        if (parent.layer !== node.layer - 1) {
          problems.push(node.id + ": 부모 " + parentId + " 의 레이어가 인접하지 않다");
        }
        const declared = UNLOCKS[parent.cutscene] || [];
        if (!declared.includes(node.id)) {
          problems.push(parent.cutscene + " 이 " + node.id + " 을 해금하지 않는다");
        }
      });
    });

    // 레이어마다 본선은 정확히 하나여야 한다(종점·시작 레이어 제외).
    for (let layer = 1; layer <= 5; layer += 1) {
      const mains = nodesInLayer(layer).filter((node) => node.route === "main");
      if (mains.length !== 1) {
        problems.push("레이어 " + layer + ": 본선 노드가 " + mains.length + "개");
      }
    }

    if (problems.length) {
      console.warn("[quest-graph] 정합성 문제\n" + problems.join("\n"));
    }
    return problems;
  }

  window.QuestGraph = Object.freeze({
    LOCKED,
    OPEN,
    CLEARED,
    NODES,
    OPENING,
    GATE_CUTSCENE,
    UNLOCKS,
    EPILOGUE_CUTS,
    get,
    children,
    nodesInLayer,
    mainRoute,
    statusOf,
    pendingCutscene,
    edges,
    openUnplayed,
    validate,
  });
})();
