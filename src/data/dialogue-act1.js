/** 1막 대사 데이터. 정본: docs/script/02_ACT1.md */
(function () {
  "use strict";

  window.DialogueAct1 = Object.freeze({
    eleanorStart: "A1_ELEANOR_01",
    carverStart: "A1_CARVER_01",
    holtStart: "A1_HOLT_01",
    holtRecall: "A1_HOLT_RECALL_X",
    policeStart: "A1_REST1_CARVER",
    nodes: Object.freeze({
      A1_ELEANOR_01: {
        id: "A1_ELEANOR_01",
        speaker: "엘리너 아셔튼",
        face: "평상",
        lines: [
          "와 주셨군요. 저 아이가…… 내 에드먼드가 돌아왔어요.",
          "눈빛이 그대로예요. 열두 살 때 그 눈빛.",
        ],
        onEnter: { set: ["CLUE_ELEANOR_PORTRAIT", "MET_ELEANOR", "MET_CARVER"] },
        next: "A1_ELEANOR_02",
      },
      A1_ELEANOR_02: {
        id: "A1_ELEANOR_02",
        speaker: "엘리너",
        face: "평상",
        lines: [
          "이 초상을 보세요. 화가가 그린 우리 아이예요.",
          "이보다 더 잘생겼었지만…… 그래도 닮았죠?",
        ],
        next: "A1_PORTRAIT_LOOK",
      },
      A1_PORTRAIT_LOOK: {
        id: "A1_PORTRAIT_LOOK",
        speaker: "옛 초상",
        face: "평상",
        lines: [
          "붓질이 아이를 이상적으로 미화했다.",
          "실제 얼굴과의 차이는 알 수 없다. 다른 증언이 필요하다.",
        ],
        next: "A1_ELEANOR_ASK",
      },
      A1_ELEANOR_ASK: {
        id: "A1_ELEANOR_ASK",
        speaker: "엘리너",
        face: "평상",
        lines: ["무엇이든 물어보세요. 그 아이 일이라면."],
        choices: [
          { text: "아들이라 확신하신 순간이 언제였습니까?", next: "A1_ELEANOR_A" },
          { text: "카버 씨는 어린 시절을 얼마나 기억합니까?", next: "A1_ELEANOR_B" },
          {
            text: "부인의 기억이 틀렸을 가능성은 없습니까?",
            effects: { set: ["E_PRESSED"] },
            next: "A1_ELEANOR_C",
          },
          { text: "말씀 감사합니다. 이만 가 보겠습니다.", next: "A1_ELEANOR_END" },
        ],
      },
      A1_ELEANOR_A: {
        id: "A1_ELEANOR_A",
        speaker: "엘리너",
        face: "평상",
        lines: [
          "문을 열고 들어서는데, 긴장하면 왼손 소매를 만지더군요.",
          "그 아이 어릴 때 버릇 그대로였어요.",
        ],
        variants: [
          {
            requires: ["ATT_family"],
            lines: [
              "당신은 기억을 소중히 여기는 분이군요. 그럼 말할게요.",
              "문을 열고 들어서는데, 긴장하면 왼손 소매를 만지더군요.",
              "그 아이 어릴 때 버릇 그대로였어요.",
            ],
          },
        ],
        onEnter: { set: ["CLUE_ELEANOR_SLEEVE"] },
        next: "A1_ELEANOR_ASK",
      },
      A1_ELEANOR_B: {
        id: "A1_ELEANOR_B",
        speaker: "엘리너",
        face: "평상",
        lines: [
          "다 기억해요. 정원의 자두나무, 유모의 이름까지.",
          "……가끔 너무 정확해서 오히려 낯설 때가 있지만요.",
        ],
        onEnter: { set: ["CLUE_CARVER_TOO_PERFECT"] },
        next: "A1_ELEANOR_ASK",
      },
      A1_ELEANOR_C: {
        id: "A1_ELEANOR_C",
        speaker: "엘리너",
        face: "긴장",
        lines: [
          "……어머니가 제 아들을 못 알아본다는 건가요.",
          "오늘은 그만하죠. 나가 주세요.",
        ],
        onEnter: { set: ["E_PRESSED", "A1_ELEANOR_DONE"] },
        next: null,
      },
      A1_ELEANOR_END: {
        id: "A1_ELEANOR_END",
        speaker: "엘리너",
        face: "평상",
        lines: ["부디…… 그 아이가 맞다고 말해 주세요."],
        onEnter: { set: ["A1_ELEANOR_DONE"] },
        next: null,
      },
      A1_ELEANOR_RECONTACT_X: {
        id: "A1_ELEANOR_RECONTACT_X",
        speaker: "엘리너",
        face: "평상",
        lines: [
          "……홀트 선생에게도 이야기를 들으셨군요.",
          "아까는 제가 감정적이었어요. 필요한 것이 있다면 다시 말씀드릴게요.",
        ],
        onEnter: { set: ["A1_ELEANOR_RECONTACTED"] },
        next: null,
      },
      A1_CARVER_01: {
        id: "A1_CARVER_01",
        speaker: "토마스 카버",
        face: "평상",
        lines: [
          "오래 걸리셨겠어요, 이런 얼굴을 되살리는 일.",
          "……사고가 사람을 바꿉니다. 저도 예전 같진 않아요.",
        ],
        variants: [
          {
            requires: ["ATT_carver"],
            lines: [
              "제 주장을 먼저 검증하겠다고 하셨다죠. 고맙습니다.",
              "……사고가 사람을 바꿉니다. 저도 예전 같진 않아요.",
            ],
          },
        ],
        next: "A1_CARVER_ASK",
      },
      A1_CARVER_ASK: {
        id: "A1_CARVER_ASK",
        speaker: "카버",
        face: "평상",
        lines: ["무엇을 확인하고 싶으십니까?"],
        choices: [
          { text: "난파 그날 밤을 말해 줄 수 있습니까?", next: "A1_CARVER_A" },
          {
            text: "가문의 인장을 압니까?",
            effects: { set: ["CARVER_SEAL_HINT"] },
            next: "A1_CARVER_B",
          },
          { text: "그만하겠습니다.", next: "A1_CARVER_END_X" },
        ],
      },
      A1_CARVER_A: {
        id: "A1_CARVER_A",
        speaker: "카버",
        face: "긴장",
        lines: [
          "……물살이 검었고, 소리가 컸습니다. 그뿐이에요.",
          "기억하고 싶지 않은 밤도 있는 법이죠.",
        ],
        next: "A1_CARVER_ASK",
      },
      A1_CARVER_B: {
        id: "A1_CARVER_B",
        speaker: "카버",
        face: "평상",
        lines: [
          "초승달 아래 파도가 새겨진 봉인이죠. 손목엔 닻 문신도 있고요.",
          "증명이 필요하면 얼마든지.",
        ],
        onEnter: { set: ["CARVER_SEAL_HINT"] },
        next: "A1_CARVER_ASK",
      },
      A1_CARVER_END_X: {
        id: "A1_CARVER_END_X",
        speaker: "카버",
        face: "평상",
        lines: ["필요한 것이 생기면 다시 말씀하십시오."],
        onEnter: { set: ["A1_CARVER_TALKED"] },
        next: null,
      },
      A1_HOLT_01: {
        id: "A1_HOLT_01",
        speaker: "홀트",
        face: "평상",
        lines: [
          "에드먼드…… 그 아이 얼굴이라. 십수 년 전 일입니다.",
          "함부로 단정하고 싶지 않군요.",
        ],
        onEnter: { set: ["MET_HOLT"] },
        next: "A1_HOLT_02",
      },
      A1_HOLT_02: {
        id: "A1_HOLT_02",
        speaker: "홀트",
        face: "긴장",
        lines: ["무엇을 알고 싶으십니까. 제 기억이 도움이 될지 모르겠습니다."],
        choices: [
          {
            text: "눈, 코, 턱 모양을 하나씩 설명해 주세요.",
            checkpoint: "KD1",
            effects: { set: ["KD1_detail"], assign: { KD1: "detail" } },
            once: true,
            next: "A1_HOLT_KD_detail",
          },
          {
            text: "웃거나 긴장할 때만 드러나는 특징이 있었습니까?",
            checkpoint: "KD1",
            effects: { set: ["KD1_face", "EV_FACE"], assign: { KD1: "face" } },
            once: true,
            next: "A1_HOLT_KD_face",
          },
          {
            text: "엘리너 부인의 기억이 틀렸다 보십니까?",
            checkpoint: "KD1",
            effects: { set: ["KD1_doubt"], assign: { KD1: "doubt" } },
            once: true,
            next: "A1_HOLT_KD_doubt",
          },
        ],
      },
      A1_HOLT_KD_face: {
        id: "A1_HOLT_KD_face",
        speaker: "홀트",
        face: "고조",
        lines: [
          "아…… 하나 기억나는군요. 웃을 때 왼쪽 눈썹만 올라갔습니다.",
          "관자놀이에는 넘어져 생긴 작은 흉터가 있었고요.",
        ],
        next: "A1_HOLT_AFTER",
      },
      A1_HOLT_KD_detail: {
        id: "A1_HOLT_KD_detail",
        speaker: "홀트",
        face: "평상",
        lines: [
          "눈은 깊고, 코는 곧고, 턱은…… 평범했습니다.",
          "미안합니다. 이런 건 누구 얼굴에나 들어맞는 말이지요.",
        ],
        onEnter: { set: ["CLUE_FACE_OUTLINE"] },
        next: "A1_HOLT_AFTER",
      },
      A1_HOLT_KD_doubt: {
        id: "A1_HOLT_KD_doubt",
        speaker: "홀트",
        face: "긴장",
        lines: [
          "부인을 의심하라는 말씀입니까? 제가 단정할 일은 아닙니다.",
          "……다만, 어머니의 눈은 자식을 늘 더 곱게 봅니다.",
        ],
        onEnter: { set: ["CLUE_FACE_IDEALIZED"] },
        next: "A1_HOLT_AFTER",
      },
      A1_HOLT_AFTER: {
        id: "A1_HOLT_AFTER",
        speaker: "홀트",
        face: "평상",
        lines: ["그 아이 얼굴을 되살려 주신다면…… 저도 보고 싶군요."],
        next: null,
      },
      A1_HOLT_RECALL_X: {
        id: "A1_HOLT_RECALL_X",
        speaker: "홀트",
        face: "평상",
        lines: ["말씀드린 기억이 초상을 되살리는 데 도움이 되길 바랍니다."],
        next: null,
      },
      A1_REST1_RESULT_STRONG: {
        id: "A1_REST1_RESULT_STRONG",
        speaker: "나레이션",
        face: "고조",
        lines: [
          "복원한 얼굴 위로 카버의 얼굴이 겹쳐진다.",
          "인상은 비슷하다. 그러나 턱과 눈썹, 흉터가 어긋난다.",
        ],
        next: null,
      },
      A1_REST1_RESULT_WEAK: {
        id: "A1_REST1_RESULT_WEAK",
        speaker: "나레이션",
        face: "평상",
        lines: [
          "복원한 얼굴 위로 카버의 얼굴이 겹쳐진다.",
          "윤곽은 닮았지만 빈 부분이 많다. 이것만으로는 단정하기 어렵다.",
        ],
        next: null,
      },
      A1_REST1_CARVER: {
        id: "A1_REST1_CARVER",
        speaker: "카버",
        face: "긴장",
        lines: [
          "세월이 사람을 바꿉니다. 사고가 얼굴을 바꾸기도 하고요.",
          "그림 한 장으로 절 부정하실 겁니까?",
        ],
        next: "A1_REST1_REED",
      },
      A1_REST1_REED: {
        id: "A1_REST1_REED",
        speaker: "리드 경위",
        face: "평상",
        lines: [
          "인상만으로는 부족해. 저 자는 표식도 안다고 하더군.",
          "다음은 저택의 유품과 인장이야. 2막으로 넘어가지.",
        ],
        onEnter: { set: ["ACT1_COMPLETE"], assign: { STAGE: "act2" } },
        next: null,
      },
    }),
  });
})();
