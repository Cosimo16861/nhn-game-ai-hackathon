/**
 * 대사 노드: 1막 서브 퀘스트 '안개라는 고양이'
 * 정본: docs/script/02_ACT1.md (A1_CAT_*), docs/script/06_SIDE_NPCS.md
 *
 * 노드 스키마
 *   id       고유 ID (스크립트 문서의 노드 ID와 동일)
 *   speaker  화자 표시명
 *   face     표정 코드: 평상 | 긴장 | 고조
 *   lines    본문 (한 줄당 한글 24~28자, 최대 3줄)
 *   onEnter  진입효과: 플래그 조작 등
 *   next     다음 노드 ID
 *   choices  선택지 [{ text, requires, effects, next, once }]
 */
(function () {
  "use strict";

  window.DialogueCat = Object.freeze({
    start: "A1_CAT_01",

    nodes: Object.freeze({
      A1_CAT_01: {
        id: "A1_CAT_01",
        speaker: "코라",
        face: "평상",
        lines: [
          "우리 가게 고양이 '안개'가 사흘째 안 보여요.",
          "전단을 붙이고 싶은데, 그림을 못 그리겠지 뭐예요.",
        ],
        onEnter: { set: ["MET_CORA"] },
        next: "A1_CAT_ASK",
      },

      A1_CAT_ASK: {
        id: "A1_CAT_ASK",
        speaker: "코라",
        face: "평상",
        lines: ["어떤 아이인지 말씀드릴까요?"],
        choices: [
          {
            text: "털 색과 무늬는 어땠습니까?",
            effects: { set: ["CLUE_CAT_FUR"] },
            next: "A1_CAT_FUR",
          },
          {
            text: "귀나 얼굴에 특징이 있었나요?",
            effects: { set: ["CLUE_CAT_EAR"] },
            next: "A1_CAT_EAR",
          },
          {
            text: "목에 무언가 하고 있었습니까?",
            effects: { set: ["CLUE_CAT_RIBBON"] },
            next: "A1_CAT_RIBBON",
          },
          {
            // 증언을 덜 듣고 나가도 진행은 막히지 않는다.
            // 대신 해금되지 않은 특징은 복원 목표에서 빠진다(00_SYSTEM 4.1).
            text: "그리러 가 보겠습니다.",
            requiresAny: ["CLUE_CAT_FUR", "CLUE_CAT_EAR", "CLUE_CAT_RIBBON"],
            requiresHint: "최소한 하나는 물어봐야 그릴 수 있다",
            next: "A1_CAT_LEAVE",
          },
        ],
      },

      A1_CAT_FUR: {
        id: "A1_CAT_FUR",
        speaker: "코라",
        face: "평상",
        lines: [
          "온몸이 옅은 회색이에요. 안개랑 똑같은 색이라",
          "그래서 이름도 안개라고 붙였죠.",
        ],
        next: "A1_CAT_ASK",
      },

      A1_CAT_EAR: {
        id: "A1_CAT_EAR",
        speaker: "코라",
        face: "평상",
        lines: [
          "귀 한쪽만 하얘요. 오른쪽이었나…… 아무튼 한쪽만요.",
          "나머지는 몸이랑 같은 회색이고요.",
        ],
        next: "A1_CAT_ASK",
      },

      A1_CAT_RIBBON: {
        id: "A1_CAT_RIBBON",
        speaker: "코라",
        face: "평상",
        lines: [
          "붉은 리본을 목에 매 줬어요. 제가 직접 묶은 거예요.",
          "그게 있으면 우리 집 아이인 줄 알아보시겠죠.",
        ],
        next: "A1_CAT_ASK",
      },

      A1_CAT_LEAVE: {
        id: "A1_CAT_LEAVE",
        speaker: "코라",
        face: "평상",
        lines: ["부탁드려요. 전단만 있으면 다들 눈여겨봐 줄 텐데."],
        onEnter: { set: ["QUEST_CAT_ACTIVE"], unlock: "restoration" },
        next: null,
      },

      // 복원 통과 후 코라에게 돌아왔을 때
      A1_CAT_DONE: {
        id: "A1_CAT_DONE",
        speaker: "코라",
        face: "고조",
        lines: [
          "세상에, 딱 우리 안개예요! 이거면 금방 찾겠어요.",
          "사례예요. 그리고 막히면 언제든 들러요,",
          "힌트 하나쯤은 공짜로.",
        ],
        onEnter: { set: ["CAT_POSTER"], clear: ["QUEST_CAT_ACTIVE"] },
        next: null,
      },

      // 복원을 아직 통과하지 못한 채 말을 걸었을 때.
      // 일반 질문은 다시 선택할 수 있어야 하므로 질문 목록으로 되돌린다(00_SYSTEM 1.4).
      // 앞서 놓친 증언을 여기서 마저 들을 수 있다.
      A1_CAT_PENDING: {
        id: "A1_CAT_PENDING",
        speaker: "코라",
        face: "평상",
        lines: [
          "그림은 좀 어떠세요? 급한 건 아니지만…… 그래도요.",
          "더 물어보실 게 있으면 얼마든지요.",
        ],
        next: "A1_CAT_ASK",
      },

      // 전단 게시 후 스몰 토크 (06_SIDE_NPCS.md)
      SIDE_CORA_TALK: {
        id: "SIDE_CORA_TALK",
        speaker: "코라",
        face: "평상",
        lines: ["요즘 부둣가에 안개가 유독 짙어요. 사람들이 밤길을 무서워하죠."],
        next: null,
      },
    }),
  });
})();
