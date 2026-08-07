/** 프롤로그 대사 데이터. 정본: docs/script/01_PROLOGUE.md */
(function () {
  "use strict";

  window.DialoguePrologue = Object.freeze({
    officeStart: "PRO_OFFICE_01",
    policeStart: "PRO_REED_01",
    nodes: Object.freeze({
      PRO_OFFICE_01: {
        id: "PRO_OFFICE_01",
        speaker: "나레이션",
        face: "평상",
        lines: [
          "헤이번의 아침은 늘 안개로 시작된다.",
          "창밖 항구가 젖은 회색으로 번져 있다.",
        ],
        onEnter: { assign: { STAGE: "prologue" } },
        next: "PRO_OFFICE_02",
      },
      PRO_OFFICE_02: {
        id: "PRO_OFFICE_02",
        speaker: "책상 위 쪽지",
        face: "평상",
        lines: [
          "리드 경위의 필적이다.",
          '"부탁할 일이 생겼네. 경찰서로 와 주게. — 리드"',
        ],
        onEnter: { set: ["PRO_OFFICE_DONE"] },
        next: null,
      },
      PRO_REED_01: {
        id: "PRO_REED_01",
        speaker: "리드 경위",
        face: "평상",
        lines: [
          "와 줘서 고맙네. 자네 눈이 필요한 사건이야.",
          "죽은 줄 알았던 아셔튼가의 아들이 돌아왔다는군.",
        ],
        next: "PRO_REED_02",
      },
      PRO_REED_02: {
        id: "PRO_REED_02",
        speaker: "리드 경위",
        face: "평상",
        lines: [
          "12년 전 세이렌 호와 함께 가라앉은 에드먼드 아셔튼.",
          "시신은 없었지. 그런데 한 남자가 자기가 그라고 주장해.",
        ],
        next: "PRO_REED_03",
      },
      PRO_REED_03: {
        id: "PRO_REED_03",
        speaker: "줄리언 아셔튼",
        face: "긴장",
        lines: [
          "사기꾼입니다, 경위님. 저 자는 숙모의 슬픔을 노린 도둑이오.",
          "……실례. 가문의 일이라 감정이 앞섰군요.",
        ],
        onEnter: { set: ["MET_JULIAN"] },
        next: "PRO_REED_04",
      },
      PRO_REED_04: {
        id: "PRO_REED_04",
        speaker: "리드 경위",
        face: "평상",
        lines: [
          "사진이 흔한 시대가 아니야. 얼굴을 대조할 방법이 없어.",
          "그래서 자네를 불렀네. 증언을 그림으로 되살리는 사람.",
        ],
        next: "PRO_REED_05",
      },
      PRO_REED_05: {
        id: "PRO_REED_05",
        speaker: "리드 경위",
        face: "평상",
        lines: ["시작하기 전에 묻겠네. 자넨 이 사건을 어떻게 보고 들어가려나?"],
        choices: [
          {
            text: "그 남자의 주장부터 검증하겠습니다.",
            effects: { set: ["ATT_carver"], assign: { ATT: "carver" } },
            once: true,
            next: "PRO_ATT_carver",
          },
          {
            text: "가족들의 기억부터 확인하겠습니다.",
            effects: { set: ["ATT_family"], assign: { ATT: "family" } },
            once: true,
            next: "PRO_ATT_family",
          },
          {
            text: "증거가 생길 때까지 어느 쪽도 믿지 않겠습니다.",
            effects: { set: ["ATT_neutral"], assign: { ATT: "neutral" } },
            once: true,
            next: "PRO_ATT_neutral",
          },
        ],
      },
      PRO_ATT_carver: {
        id: "PRO_ATT_carver",
        speaker: "줄리언",
        face: "긴장",
        lines: ["저 자의 말부터 듣겠다고? ……속아 넘어가지나 마시오."],
        next: "PRO_REED_06",
      },
      PRO_ATT_family: {
        id: "PRO_ATT_family",
        speaker: "리드 경위",
        face: "평상",
        lines: ["현명하군. 기억은 흔들려도, 여럿을 겹쳐 보면 윤곽이 잡히지."],
        next: "PRO_REED_06",
      },
      PRO_ATT_neutral: {
        id: "PRO_ATT_neutral",
        speaker: "리드 경위",
        face: "평상",
        lines: ["마음에 드는군. 나도 심증만으로는 사람을 세우지 않아."],
        next: "PRO_REED_06",
      },
      PRO_REED_06: {
        id: "PRO_REED_06",
        speaker: "리드 경위",
        face: "평상",
        lines: ["확인할 건 세 가지야. 이걸 그림으로 증명해 주게."],
        next: "PRO_REED_07",
      },
      PRO_REED_07: {
        id: "PRO_REED_07",
        speaker: "리드 경위",
        face: "평상",
        lines: [
          "먼저 아셔튼 저택으로 가 보게. 어머니 엘리너 부인이 자네를 기다려.",
          "그 집엔 아들의 옛 초상이 걸려 있다더군.",
        ],
        onEnter: {
          set: ["PROLOGUE_DONE"],
          assign: { STAGE: "act1" },
        },
        next: null,
      },
    }),
  });
})();
