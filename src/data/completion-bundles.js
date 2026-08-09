/**
 * 완료 컷신 번들 정본 — docs/GAME_INTEGRATION_PLAN.md 4장.
 *
 * quest-graph.js 의 `node.cutscene` 은 완료 컷신을 ID 하나로만 표현하지만, 제작본은
 * 한 퀘스트를 통과한 뒤 장면 둘을 연속 재생하기도 한다. 제품 진행은 이 파일의
 * bundle 을 사용하고, `node.cutscene` 은 구 저장 마이그레이션 alias 로만 남긴다.
 *
 * 계약
 *   - bundle 은 원자적이다. sceneIds 를 전부 본 시점에 unlocks 와 grants 가 적용된다.
 *   - 퀘스트 통과(cleared)와 bundle 종료(completed)는 서로 다른 사건이다.
 *   - unlocks 는 QuestGraph.UNLOCKS(legacy alias 기준)와 반드시 일치해야 한다.
 *     어긋나면 tests/completion-bundles.test.cjs 가 실패한다.
 */
(function (global) {
  "use strict";

  /**
   * 오프닝. 완료 퀘스트가 없으므로 sourceQuestId 는 null 이고, 종료 시 Q0 를 연다.
   * 재생 위치는 GAME_INTEGRATION_PLAN 0장의 title → C0 → C0B → Q0 흐름을 따른다.
   */
  const OPENING_BUNDLE_ID = "B_OPENING";

  // grants(증거 플래그)는 아직 어느 정본 문서에도 번들 단위로 명시돼 있지 않다.
  // 임의로 만들지 않고 빈 배열로 두며, 대본에서 확정되면 이 표에만 추가한다.
  const RAW = [
    {
      id: OPENING_BUNDLE_ID,
      sourceQuestId: null,
      layer: "opening",
      sceneIds: ["C0_INTRO", "C0B_THE_JOB"],
      grants: [],
      unlocks: ["Q0_MONTAGE"],
      legacyCutsceneId: "C0B_THE_JOB",
    },
    {
      id: "B_AFTER_Q0",
      sourceQuestId: "Q0_MONTAGE",
      layer: "l0-l1",
      sceneIds: ["C1A_RETURNED_HEIR", "C1B_TWELVE_YEARS_UNDER"],
      grants: [],
      unlocks: ["Q1A_IDEALIZED", "Q1B_TAVERN_WALL"],
      legacyCutsceneId: "C1_THE_CASE",
    },
    {
      id: "B_AFTER_Q1A",
      sourceQuestId: "Q1A_IDEALIZED",
      layer: "l1-l2",
      sceneIds: ["C2C_RAIN_BEHIND_THE_DOOR", "C2A_HOLTS_MEMORY"],
      grants: [],
      unlocks: ["Q2C_CHILD_ROOM", "Q2A_TRUE_FACE"],
      legacyCutsceneId: "C2A_WHAT_WAS_ERASED",
    },
    {
      id: "B_AFTER_Q1B",
      sourceQuestId: "Q1B_TAVERN_WALL",
      layer: "l1-l2",
      sceneIds: ["C2B_MIST_IS_MISSING"],
      grants: [],
      unlocks: ["Q2B_CAT"],
      legacyCutsceneId: "C2B_THE_WALL",
    },
    {
      id: "B_AFTER_Q2A",
      sourceQuestId: "Q2A_TRUE_FACE",
      layer: "l2-l3",
      sceneIds: ["C3A_CARVERS_CREST", "C3B_FRESH_ANCHOR"],
      grants: [],
      unlocks: ["Q3A_SEAL", "Q3B_TATTOO"],
      legacyCutsceneId: "C3A_THE_SEAL_HE_DREW",
    },
    {
      id: "B_AFTER_Q2B",
      sourceQuestId: "Q2B_CAT",
      layer: "l2-l3",
      sceneIds: ["C3C_FOLLOW_THE_FLYER"],
      grants: [],
      unlocks: ["Q3C_WAREHOUSE"],
      legacyCutsceneId: "C3B_THE_FLYER",
    },
    {
      id: "B_AFTER_Q2C",
      sourceQuestId: "Q2C_CHILD_ROOM",
      layer: "l2-l3",
      sceneIds: ["C2C_OPEN_DOOR_CLOSING"],
      grants: [],
      unlocks: [],
      legacyCutsceneId: "C3C_THE_DOOR",
    },
    {
      id: "B_AFTER_Q3A",
      sourceQuestId: "Q3A_SEAL",
      layer: "l3-l4",
      sceneIds: ["C4A_LEDGER_TRAIL", "C4C_SQUARE_CHALLENGE"],
      grants: [],
      unlocks: ["Q4A_LEDGER", "Q4C_SQUARE_BET"],
      legacyCutsceneId: "C4A_WET_LEDGER",
    },
    {
      id: "B_AFTER_Q3B",
      sourceQuestId: "Q3B_TATTOO",
      layer: "l3-l4",
      sceneIds: ["C3B_TOO_NEW_CLOSING"],
      grants: [],
      unlocks: [],
      legacyCutsceneId: "C4B_TOO_NEW",
    },
    {
      id: "B_AFTER_Q3C",
      sourceQuestId: "Q3C_WAREHOUSE",
      layer: "l3-l4",
      sceneIds: ["C4B_CAT_FOUND_PAPERS"],
      grants: [],
      unlocks: ["Q4B_LOGBOOK"],
      legacyCutsceneId: "C4C_WHAT_THE_CAT_FOUND",
    },
    {
      id: "B_AFTER_Q4A",
      sourceQuestId: "Q4A_LEDGER",
      layer: "l4-l5",
      sceneIds: ["C5A_CARRIAGE_WITNESS"],
      grants: [],
      unlocks: ["Q5A_DOCK"],
      legacyCutsceneId: "C5A_THE_BLACK_CARRIAGE",
    },
    {
      id: "B_AFTER_Q4B",
      sourceQuestId: "Q4B_LOGBOOK",
      layer: "l4-l5",
      sceneIds: ["C5B_SIREN_WITNESS"],
      grants: [],
      unlocks: ["Q5B_SIREN"],
      legacyCutsceneId: "C5B_A_WEEK_BEFORE",
    },
    {
      id: "B_AFTER_Q4C",
      sourceQuestId: "Q4C_SQUARE_BET",
      layer: "l4-l5",
      sceneIds: ["C4C_PAINTER_CLOSING"],
      grants: [],
      unlocks: [],
      legacyCutsceneId: "C5C_THE_PAINTER",
    },
    {
      id: "B_AFTER_Q5A",
      sourceQuestId: "Q5A_DOCK",
      layer: "l5-l6",
      sceneIds: ["C6_EVIDENCE_WALL"],
      grants: [],
      unlocks: ["Q6_FINALE"],
      legacyCutsceneId: "C6_EVIDENCE_WALL",
    },
    {
      id: "B_AFTER_Q5B",
      sourceQuestId: "Q5B_SIREN",
      layer: "l5-l6",
      sceneIds: ["C5B_THAT_NIGHT_CLOSING"],
      grants: [],
      unlocks: [],
      legacyCutsceneId: "C6B_THAT_NIGHT",
    },
    {
      id: "B_AFTER_Q6",
      sourceQuestId: "Q6_FINALE",
      layer: "l6-ending",
      sceneIds: ["CE_ENDING"],
      grants: [],
      unlocks: [],
      legacyCutsceneId: "CE_ENDING",
    },
  ];

  const BUNDLES = Object.freeze(RAW.map((entry) => Object.freeze({
    id: entry.id,
    sourceQuestId: entry.sourceQuestId,
    layer: entry.layer,
    sceneIds: Object.freeze(entry.sceneIds.slice()),
    grants: Object.freeze(entry.grants.slice()),
    unlocks: Object.freeze(entry.unlocks.slice()),
    legacyCutsceneId: entry.legacyCutsceneId,
    replayable: true,
  })));

  const byId = new Map(BUNDLES.map((bundle) => [bundle.id, bundle]));
  const byQuestId = new Map(
    BUNDLES.filter((bundle) => bundle.sourceQuestId)
      .map((bundle) => [bundle.sourceQuestId, bundle]),
  );
  const bySceneId = new Map();
  BUNDLES.forEach((bundle) => {
    bundle.sceneIds.forEach((sceneId) => bySceneId.set(sceneId, bundle));
  });

  const api = Object.freeze({
    OPENING_BUNDLE_ID,
    list: () => BUNDLES,
    get: (bundleId) => byId.get(bundleId) || null,
    forQuest: (questId) => byQuestId.get(questId) || null,
    forScene: (sceneId) => bySceneId.get(sceneId) || null,
    opening: () => byId.get(OPENING_BUNDLE_ID),
    /** 완료 퀘스트가 있는 번들만. 오프닝은 제외한다. */
    completionBundles: () => BUNDLES.filter((bundle) => bundle.sourceQuestId),
  });

  global.CompletionBundles = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
