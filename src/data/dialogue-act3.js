/** 3막 대사 데이터. 정본: docs/script/04_ACT3.md */
(function () {
  "use strict";

  window.DialogueAct3 = Object.freeze({
    banksStart: "A3_BANKS_01",
    banksRecall: "A3_BANKS_RECALL_X",
    logStart: "A3_LOG_INTRO",
    catReturn: "A3_CAT_RETURN",
    nodes: Object.freeze({
      A3_BANKS_01: {
        id: "A3_BANKS_01",
        speaker: "뱅크스",
        face: "평상",
        lines: [
          "세이렌 호? ……그 배 얘긴 안 하고 싶은데.",
          "나만 살아 나왔거든. 그게 무슨 자랑도 아니고.",
        ],
        onEnter: { set: ["MET_BANKS"] },
        next: "A3_BANKS_02",
      },
      A3_BANKS_02: {
        id: "A3_BANKS_02",
        speaker: "뱅크스",
        face: "긴장",
        lines: [
          "카버라는 자? 일주일쯤 여기 묵었소. 밤이면 누군가를 만나러 나갔지.",
          "얼굴도 낯이 익고. 뭘 먼저 묻겠소, 탐정 양반.",
        ],
        choices: [
          {
            text: "세이렌 호가 가라앉던 밤의 날씨부터 말해 주십시오.",
            checkpoint: "KD3",
            effects: {
              set: ["KD3_weather", "CLUE_DOCK_WEATHER"],
              assign: { KD3: "weather" },
            },
            once: true,
            next: "A3_BANKS_weather",
          },
          {
            text: "카버가 정말 선원처럼 행동했습니까?",
            checkpoint: "KD3",
            effects: {
              set: ["KD3_sailor", "CLUE_BANKS_BUTCHER"],
              assign: { KD3: "sailor" },
            },
            once: true,
            next: "A3_BANKS_sailor",
          },
          {
            text: "헤이번에 온 뒤 카버의 행적을 시간순으로 말해 주십시오.",
            checkpoint: "KD3",
            effects: {
              set: ["KD3_carriage", "EV_CARRIAGE"],
              assign: { KD3: "carriage" },
            },
            once: true,
            next: "A3_BANKS_carriage",
          },
        ],
      },
      A3_BANKS_carriage: {
        id: "A3_BANKS_carriage",
        speaker: "뱅크스",
        face: "고조",
        lines: [
          "아, 그 마차! 밤마다 왔었지. 새까만 마차.",
          "문짝에 초승달하고 파도가 새겨져 있었소. 아셔튼가 마차 아니오, 그거?",
        ],
        next: "A3_BANKS_AFTER",
      },
      A3_BANKS_weather: {
        id: "A3_BANKS_weather",
        speaker: "뱅크스",
        face: "평상",
        lines: [
          "그날 밤? 물안개가 짙었고, 가스등이 젖어 번졌지.",
          "배는 부두 끝에 비스듬히 대어 있었고.",
        ],
        next: "A3_BANKS_AFTER",
      },
      A3_BANKS_sailor: {
        id: "A3_BANKS_sailor",
        speaker: "뱅크스",
        face: "긴장",
        lines: [
          "선원? 웃기지 마쇼. 밧줄 하나 제대로 못 묶던데.",
          "그자는 예전에 부둣가 정육점에서 일하던 토마스요.",
        ],
        next: "A3_BANKS_AFTER",
      },
      A3_BANKS_AFTER: {
        id: "A3_BANKS_AFTER",
        speaker: "뱅크스",
        face: "평상",
        lines: [
          "세이렌 호에서 건진 반쪽짜리 항해일지를 아직 수첩으로 쓰고 있소.",
          "며칠 전 창고에서 잃었지. 최근 밤일도 거기 적어 뒀소.",
        ],
        onEnter: { set: ["A3_BANKS_DONE", "LOGBOOK_AVAILABLE"] },
        next: null,
      },
      A3_BANKS_RECALL_X: {
        id: "A3_BANKS_RECALL_X",
        speaker: "뱅크스",
        face: "평상",
        lines: ["말해 준 건 그게 전부요. 잃어버린 항해일지는 창고 어딘가에 있을 거요."],
        next: null,
      },
      A3_LOG_INTRO: {
        id: "A3_LOG_INTRO",
        speaker: "나레이션",
        face: "평상",
        lines: ["창고 안은 짠내와 곰팡이 냄새. 상자 사이로 무언가 흰 것이 스친다."],
        variants: [{ requires: ["CAT_POSTER"], next: "A3_LOG_CAT" }],
        next: "A3_LOG_SEARCH",
      },
      A3_LOG_CAT: {
        id: "A3_LOG_CAT",
        speaker: "나레이션",
        face: "평상",
        lines: [
          "회색 고양이 '안개'가 상자 틈으로 쏙 들어간다.",
          "그 뒤를 따르자, 젖은 종이 뭉치가 바닥에 떨어져 있다.",
        ],
        onEnter: { set: ["CAT_FOUND"] },
        next: "A3_LOG_FOUND",
      },
      A3_LOG_SEARCH: {
        id: "A3_LOG_SEARCH",
        speaker: "나레이션",
        face: "평상",
        lines: [
          "상자를 하나씩 밀어 본다. 세 번째 더미 아래,",
          "물에 불은 종이 조각이 끼여 있다.",
        ],
        next: "A3_LOG_FOUND",
      },
      A3_LOG_FOUND: {
        id: "A3_LOG_FOUND",
        speaker: "항해일지 조각",
        face: "고조",
        lines: [
          "자정 무렵, 카버가 초승달·파도 문양의 마차에 올랐다.",
          "마부가 말했다. \"'아셔튼 씨'께 모시겠습니다.\"",
        ],
        onEnter: { set: ["SUB_LOGBOOK", "CLUE_LOGBOOK"] },
        variants: [{ requires: ["CAT_FOUND"], next: "A3_CAT_PICKUP" }],
        next: null,
      },
      A3_CAT_PICKUP: {
        id: "A3_CAT_PICKUP",
        speaker: "나레이션",
        face: "평상",
        lines: [
          "안개가 젖은 수염을 떨며 품으로 파고든다.",
          "코라가 기다리고 있을 것이다. 선술집에 데려다주자.",
        ],
        next: null,
      },
      A3_CAT_RETURN: {
        id: "A3_CAT_RETURN",
        speaker: "코라",
        face: "고조",
        lines: [
          "안개야! 어디까지 돌아다닌 거니…… 정말 고마워요.",
          "이번엔 제가 도와드릴 차례네요. 부두에서 들은 얘기를 알려 드릴게요.",
        ],
        onEnter: { set: ["SUB_CAT"], clear: ["CAT_FOUND"] },
        next: null,
      },
      A3_REST3_RESULT_MARK: {
        id: "A3_REST3_RESULT_MARK",
        speaker: "나레이션",
        face: "고조",
        lines: [
          "화면이 마차 문으로 확대된다.",
          "안개 속, 초승달 아래 세 줄기 파도가 젖은 채 빛난다.",
        ],
        onEnter: { assign: { STAGE: "finale" } },
        next: null,
      },
      A3_REST3_RESULT_BLURRED: {
        id: "A3_REST3_RESULT_BLURRED",
        speaker: "나레이션",
        face: "평상",
        lines: [
          "검은 마차와 카버의 위치는 이어지지만, 문짝은 안개에 잠겨 있다.",
          "긁힌 자국만 남은 문양으로는 주인을 특정할 수 없다.",
        ],
        onEnter: { assign: { STAGE: "finale" } },
        next: null,
      },
    }),
  });
})();
