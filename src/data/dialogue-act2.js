/** 2막 대사 데이터. 정본: docs/script/03_ACT2.md */
(function () {
  "use strict";

  window.DialogueAct2 = Object.freeze({
    mansionStart: "A2_ROOM_INTRO",
    mansionHub: "A2_ROOM_HUB_X",
    resultStart: "A2_REST2_RESULT",
    policeStart: "A2_KD2",
    nodes: Object.freeze({
      A2_ROOM_INTRO: {
        id: "A2_ROOM_INTRO",
        speaker: "나레이션",
        face: "평상",
        lines: [
          "유품 보관실. 먼지 위로 최근 누군가 다녀간 손자국이 있다.",
          "상자 하나만 뚜껑이 새로 열렸다.",
        ],
        onEnter: { set: ["A2_ROOM_SEEN"] },
        next: "A2_ROOM_HUB_X",
      },
      A2_ROOM_HUB_X: {
        id: "A2_ROOM_HUB_X",
        speaker: "나레이션",
        face: "평상",
        lines: ["유품 보관실에서 무엇을 살펴볼까?"],
        choices: [
          { text: "오래된 편지 봉인을 살펴본다.", next: "A2_SEAL_LOOK" },
          { text: "항해일지의 닻 그림을 살펴본다.", next: "A2_ANCHOR_LOOK" },
          { text: "가문 물품 반출 장부를 살펴본다.", next: "A2_LEDGER_LOOK" },
          { text: "상자와 방 안의 사람들을 더 살핀다.", next: "A2_ROOM_HUB_MORE_X" },
        ],
      },
      A2_ROOM_HUB_MORE_X: {
        id: "A2_ROOM_HUB_MORE_X",
        speaker: "나레이션",
        face: "평상",
        lines: ["최근 열린 상자와 문가의 애니, 카버가 눈에 들어온다."],
        choices: [
          { text: "최근 열린 유품 상자를 살펴본다.", next: "A2_BOX_LOOK" },
          { text: "하녀 애니에게 상자에 관해 묻는다.", next: "A2_ANNIE_01" },
          { text: "카버의 손목 문신을 확인한다.", next: "A2_TATTOO_CARVER" },
          { text: "이동하거나 조사를 정리한다.", next: "A2_ROOM_NAV_X" },
        ],
      },
      A2_ROOM_NAV_X: {
        id: "A2_ROOM_NAV_X",
        speaker: "나레이션",
        face: "평상",
        lines: ["더 살필 곳을 고르거나, 확보한 기록을 들고 보관실을 나갈 수 있다."],
        choices: [
          { text: "앞쪽 조사 대상으로 돌아간다.", next: "A2_ROOM_HUB_X" },
          { text: "조사를 마치고 나간다.", next: "A2_ROOM_EXIT_X" },
        ],
      },
      A2_ROOM_EXIT_X: {
        id: "A2_ROOM_EXIT_X",
        speaker: "나레이션",
        face: "평상",
        lines: ["확보한 단서와 기록을 챙겨 유품 보관실을 나선다."],
        next: null,
      },
      A2_SEAL_LOOK: {
        id: "A2_SEAL_LOOK",
        speaker: "편지 봉인",
        face: "평상",
        lines: [
          "초승달 아래 파도가 세 줄. 바깥 테두리는 닳아 흐릿하다.",
          "진품 인장의 자국이다.",
        ],
        onEnter: { set: ["CLUE_SEAL_WAVES"] },
        next: "A2_ROOM_HUB_X",
      },
      A2_ANCHOR_LOOK: {
        id: "A2_ANCHOR_LOOK",
        speaker: "항해일지의 닻 그림",
        face: "평상",
        lines: [
          "에드먼드가 새겼다는 닻 문신의 원본 도안.",
          "선이 부드럽고, 오래되어 잉크가 번졌다.",
        ],
        onEnter: { set: ["CLUE_ANCHOR_ORIG"] },
        next: "A2_ROOM_HUB_X",
      },
      A2_LEDGER_LOOK: {
        id: "A2_LEDGER_LOOK",
        speaker: "반출 장부",
        face: "평상",
        lines: [
          "가문 물품 반출 기록. 최근 몇 건에 같은 관리 서명이 반복된다.",
          "서명 아래 이니셜 하나가 눈에 걸린다. 'T.C.'",
        ],
        onEnter: { set: ["CLUE_LEDGER_SEEN"], clear: ["KD2_WAITING"] },
        next: "A2_ROOM_HUB_X",
      },
      A2_BOX_LOOK: {
        id: "A2_BOX_LOOK",
        speaker: "최근 열린 유품 상자",
        face: "평상",
        lines: [
          "인장이 놓였던 자국만 남아 있고, 상자 안은 비어 있다.",
          "누가 언제 꺼냈는지는 아직 알 수 없다.",
        ],
        onEnter: { set: ["CLUE_BOX_OPENED"] },
        next: "A2_ROOM_HUB_MORE_X",
      },
      A2_ANNIE_01: {
        id: "A2_ANNIE_01",
        speaker: "하녀 애니",
        face: "평상",
        lines: [
          "저 상자요? 얼마 전 줄리언 도련님이 혼자 들어가 계셨어요.",
          "……제가 이런 말 했다고 하진 말아 주세요.",
        ],
        onEnter: { set: ["CLUE_ANNIE_JULIAN"] },
        next: "A2_ROOM_HUB_MORE_X",
      },
      A2_TATTOO_CARVER: {
        id: "A2_TATTOO_CARVER",
        speaker: "카버",
        face: "평상",
        lines: [
          "보시겠습니까? 여기, 손목의 닻.",
          "난파 때 망가진 선을 돌아온 뒤 다시 손봤습니다.",
        ],
        onEnter: { set: ["CLUE_TATTOO_FRESH"] },
        next: "A2_CARVER_SEAL_TEST",
      },
      A2_CARVER_SEAL_TEST: {
        id: "A2_CARVER_SEAL_TEST",
        speaker: "플레이어",
        face: "평상",
        lines: ["기억하신다는 가문의 인장을, 이 종이에 직접 그려 주십시오."],
        variants: [
          {
            requires: ["CARVER_SEAL_HINT"],
            lines: ["앞서 말씀하신 가문의 인장을, 이 종이에 직접 그려 주십시오."],
          },
        ],
        next: "A2_CARVER_SEAL_DRAW",
      },
      A2_CARVER_SEAL_DRAW: {
        id: "A2_CARVER_SEAL_DRAW",
        speaker: "카버",
        face: "긴장",
        lines: [
          "초승달 아래 네 줄의 파도. 분명 이 모양이었습니다.",
          "어릴 때부터 보았으니 틀릴 리 없습니다.",
        ],
        onEnter: { set: ["CLUE_CARVER_SEAL_4"] },
        next: null,
      },
      A2_REST2_RESULT: {
        id: "A2_REST2_RESULT",
        speaker: "나레이션",
        face: "고조",
        lines: [
          "진품 인장엔 파도가 세 줄. 카버가 기억대로 그린 문양엔 네 줄이다.",
          "그는 진품이 아니라, 불완전하게 옮겨진 정보를 배운 것이다.",
        ],
        next: null,
      },
      A2_KD2: {
        id: "A2_KD2",
        speaker: "리드 경위",
        face: "평상",
        lines: [
          "네 번째 파도라. 누가 카버에게 가짜를 가르쳤다는 거군.",
          "……이걸 어떻게 쓸 텐가?",
        ],
        choices: [
          {
            text: "줄리언을 즉시 추궁하겠습니다.",
            checkpoint: "KD2",
            effects: {
              set: ["KD2_julian", "JULIAN_ALERTED"],
              assign: { KD2: "julian" },
            },
            once: true,
            next: "A2_KD2_julian",
          },
          {
            text: "엘리너에게 상자를 누가 열었는지 묻겠습니다.",
            checkpoint: "KD2",
            effects: {
              set: ["KD2_eleanor", "JULIAN_ALERTED"],
              assign: { KD2: "eleanor" },
            },
            once: true,
            next: "A2_KD2_eleanor",
          },
          {
            text: "리드, 인장 기록과 반출 장부를 비밀리에 대조해 주세요.",
            requires: ["CLUE_LEDGER_SEEN"],
            requiresHint: "먼저 반출 장부를 살펴봐야 한다",
            checkpoint: "KD2",
            effects: {
              set: ["KD2_ledger", "EV_LEDGER"],
              assign: { KD2: "ledger" },
            },
            once: true,
            next: "A2_KD2_ledger",
          },
          {
            text: "결정하기 전에 보관실을 더 조사하겠습니다.",
            hiddenWhen: { requires: ["CLUE_LEDGER_SEEN"] },
            next: "A2_KD2_WAIT",
          },
        ],
      },
      A2_KD2_WAIT: {
        id: "A2_KD2_WAIT",
        speaker: "리드 경위",
        face: "평상",
        lines: ["좋아. 누구를 움직이기 전에 기록부터 더 확인하게."],
        onEnter: { set: ["KD2_WAITING"] },
        next: null,
      },
      A2_KD2_ledger: {
        id: "A2_KD2_ledger",
        speaker: "리드 경위",
        face: "고조",
        lines: [
          "……찾았어. 줄리언의 관리 서명, 유품 반출 기록, 그리고",
          "'T.C.'에게 지급된 출처 불명의 돈. 이건 우연이 아니야.",
        ],
        next: "A2_ACT_END",
      },
      A2_KD2_julian: {
        id: "A2_KD2_julian",
        speaker: "줄리언",
        face: "긴장",
        lines: [
          "네 번째 파도? 그림쟁이의 눈속임이겠지.",
          "……실례하겠소. 처리할 서류가 있어서.",
        ],
        onEnter: { set: ["JULIAN_ALERTED"] },
        next: "A2_ACT_END",
      },
      A2_KD2_eleanor: {
        id: "A2_KD2_eleanor",
        speaker: "엘리너",
        face: "긴장",
        lines: [
          "상자를요? ……줄리언이 정리해 준다고 했어요. 착한 아이예요.",
          "왜 그런 걸 물으시죠?",
        ],
        onEnter: { set: ["JULIAN_ALERTED"] },
        next: "A2_ACT_END",
      },
      A2_ACT_END: {
        id: "A2_ACT_END",
        speaker: "리드 경위",
        face: "평상",
        lines: [
          "카버가 헤이번에 오기 전 어디 있었는지가 남았어.",
          "부두로 가 보게. 살아남은 선원, 뱅크스가 거기 있어.",
        ],
        onEnter: { assign: { STAGE: "act3" } },
        next: null,
      },
    }),
  });
})();
