/**
 * L1→L2 컷신 beat 데이터 — B_AFTER_Q1A, B_AFTER_Q1B.
 *
 * dev/cutscenes/cutscene-review-l1-l2.js 에서 그대로 옮긴 승인본이다.
 * 대사·순서·duration·textDelay·visualLock·effect 를 임의로 바꾸지 않는다
 * (GAME_INTEGRATION_PLAN 14장 "바꾸면 안 되는 것").
 */
(function (global) {
  "use strict";

  const SCENES = Object.freeze({
    C2C_RAIN_BEHIND_THE_DOOR: Object.freeze({
      id: "C2C_RAIN_BEHIND_THE_DOOR",
      renderer: "l1-l2",
      title: "문 뒤의 빗물",
      quest: "Q2C_CHILD_ROOM",
      beats: Object.freeze([
        { speaker: "엘리너", face: "eleanorHigh", view: "parlorPortrait", text: "이 눈이…… 그래요. 열여덟 살 때의 그 아이예요.", duration: 3300, textDelay: 560, visualLock: 760 },
        { speaker: "플레이어", face: "playerThinking", view: "parlorEleanor", text: "복원은 끝났습니다. 가까이서 보시면 남아 있던 빛도 확인하실 수 있습니다.", duration: 3700, textDelay: 170 },
        { speaker: "베스", face: "bethTense", view: "parlorBethEnter", text: "부인! 서쪽 복도에 또 물이 들어옵니다. 이번에는 벽 안쪽까지요.", duration: 3900, textDelay: 420, visualLock: 620, effect: "door" },
        { speaker: "엘리너", face: "eleanorTense", view: "parlorBeth", text: "그 방은 열지 말라고 했을 텐데.", duration: 2800, textDelay: 160 },
        { speaker: "베스", face: "bethTense", view: "parlorBeth", text: "열지는 않았어요. 문틈 옆 벽지가 부풀어서 안의 색이 비쳐요.", duration: 3700, textDelay: 170 },
        { speaker: "엘리너", face: "eleanorTense", view: "hallDoor", text: "열쇠를 가져왔어요. 십이 년 만에 이 문을 여는군요.", duration: 3600, textDelay: 740, visualLock: 740, effect: "lightning" },
        { speaker: "플레이어", face: "playerReady", view: "hallDoor", text: "제가 열겠습니다. 기억은 기다려도 비는 기다리지 않습니다.", duration: 3900, textDelay: 210, effect: "doorOpen", doorOpen: true },
        { speaker: "베스", face: "bethTense", view: "wetWall", text: "저기요. 배 한 척이 보여요. 사람은…… 크기가 다른 셋이고요.", duration: 4100, textDelay: 700, visualLock: 760, effect: "drips", doorOpen: true },
        { speaker: "플레이어", face: "playerThinking", view: "wetWall", text: "푸른 물 번짐이 배와 사람들을 한 장면 안에 둘러싸고 있습니다.", duration: 3900, textDelay: 820, visualLock: 820, effect: "drips", doorOpen: true },
        { speaker: "엘리너", face: "eleanorTense", view: "hallEleanor", text: "에드먼드는 가족을 그릴 때 늘 자신을 가장 작게 그렸어요.", duration: 3900, textDelay: 210, effect: "lightningSoft", doorOpen: true },
        { speaker: "플레이어", face: "playerReady", view: "wetWall", text: "배 하나와 키가 다른 사람 셋. 푸른 번짐까지 지금 종이에 옮겨 복원해야 합니다.", duration: 4500, textDelay: 190, effect: "drips", doorOpen: true },
      ]),
    }),

    C2A_HOLTS_MEMORY: Object.freeze({
      id: "C2A_HOLTS_MEMORY",
      renderer: "l1-l2",
      title: "홀트가 기억한 얼굴",
      quest: "Q2A_TRUE_FACE",
      beats: Object.freeze([
        { speaker: "플레이어", face: "playerCalm", view: "parlorEleanor", text: "베스가 벽에 방수천을 대고 옮길 종이를 준비 중입니다. 그동안 초상을 다시 보죠.", duration: 4500, textDelay: 720, visualLock: 760, effect: "fadeIn" },
        { speaker: "플레이어", face: "playerThinking", view: "parlorPortrait", text: "부인. 이 초상은 턱도 눈썹도 지나치게 반듯합니다. 실제 얼굴보다 주문한 인상에 가깝습니다.", duration: 4600, textDelay: 680, visualLock: 760 },
        { speaker: "엘리너", face: "eleanorTense", view: "firstEleanor", text: "그 아이가 거칠고 불안해 보이는 걸 견딜 수가 없었어요.", duration: 3600, textDelay: 220 },
        { speaker: "엘리너", face: "eleanorTense", view: "firstEleanor", text: "화가에게 부탁했죠. 턱은 부드럽게, 표정은 차분하게 그려 달라고.", duration: 4100, textDelay: 170 },
        { speaker: "플레이어", face: "playerThinking", view: "parlorEleanor", text: "그렇다면 이 초상만으로는 카버 씨와 비교할 수 없습니다.", duration: 3500, textDelay: 170 },
        { speaker: "플레이어", face: "playerCalm", view: "parlorEleanor", text: "미화되기 전 얼굴을 매일 본 사람이 있습니까.", duration: 3200, textDelay: 150 },
        { speaker: "엘리너", face: "eleanorCalm", view: "parlorEleanor", text: "옛 가정교사 홀트 선생뿐이에요. 아직 학교에 계십니다.", duration: 3600, textDelay: 160 },
        { speaker: "홀트", face: "holtTense", view: "schoolArrival", text: "십이 년 전 얼굴을 말로 다시 세우라니…… 자신은 없습니다만.", duration: 3900, textDelay: 850, visualLock: 900, effect: "fadeIn" },
        { speaker: "홀트", face: "holtCalm", view: "schoolHolt", text: "턱은 어머님을 닮아 각졌습니다. 저 초상처럼 부드럽지 않았지요.", duration: 4200, textDelay: 190 },
        { speaker: "홀트", face: "holtHigh", view: "memoryJaw", text: "웃을 때면 왼쪽 눈썹만 유독 위로 올라갔습니다.", duration: 3800, textDelay: 520, visualLock: 620, effect: "memory" },
        { speaker: "홀트", face: "holtTense", view: "memoryBrow", text: "그리고 관자놀이에 작은 흉터가 있었어요. 나무에서 떨어져서요.", duration: 4100, textDelay: 180, effect: "memory" },
        { speaker: "플레이어", face: "playerThinking", view: "schoolHolt", text: "각진 턱, 웃을 때 올라가는 왼쪽 눈썹, 관자놀이의 작은 흉터.", duration: 4100, textDelay: 180 },
        { speaker: "홀트", face: "holtCalm", view: "schoolHolt", text: "머리도 아주 짙었습니다. 그 네 가지라면 제가 기억하는 에드먼드예요.", duration: 3900, textDelay: 170 },
        { speaker: "플레이어", face: "playerReady", view: "schoolWide", text: "그 증언으로 미화되지 않은 얼굴을 복원하겠습니다. 그래야 카버와 대조할 수 있습니다.", duration: 4600, textDelay: 190, effect: "dust" },
      ]),
    }),

    C2B_MIST_IS_MISSING: Object.freeze({
      id: "C2B_MIST_IS_MISSING",
      renderer: "l1-l2",
      title: "안개를 찾습니다",
      quest: "Q2B_CAT",
      beats: Object.freeze([
        { speaker: "코라", face: "coraHigh", view: "ferryWall", text: "세상에, 정말 얼굴이 나왔네! 그런데…… 이 사람은 카버가 아니에요.", duration: 4200, textDelay: 720, visualLock: 820, effect: "fire" },
        { speaker: "플레이어", face: "playerThinking", view: "tavernCora", text: "아는 얼굴입니까.", duration: 2400, textDelay: 140, effect: "fire" },
        { speaker: "코라", face: "coraCalm", view: "tavernCora", text: "늙은 페리요. 이십 년 전에 바다에서 죽은 선원이에요.", duration: 3500, textDelay: 170, effect: "fire" },
        { speaker: "코라", face: "coraTense", view: "tavernCora", text: "괜히 헛수고를 시켰네요. 미안해서 어쩌지.", duration: 2900, textDelay: 160, effect: "fire" },
        { speaker: "플레이어", face: "playerCalm", view: "ferryWall", text: "아닙니다. 카버가 이 층에는 없었다는 것도 결과입니다.", duration: 3500, textDelay: 170, effect: "fire" },
        { speaker: "코라", face: "coraTense", view: "firstCora", text: "결과라…… 그럼 하나만 더 그려 줄 수 있어요? 우리 안개가 사흘째 안 보여요.", duration: 4300, textDelay: 220, effect: "fire" },
        { speaker: "플레이어", face: "playerThinking", view: "tavernCora", text: "고양이의 생김새를 정확히 말씀해 주세요.", duration: 3000, textDelay: 150, effect: "fire" },
        { speaker: "코라", face: "coraCalm", view: "catMemory", text: "몸은 옅은 회색이고, 귀는 한쪽만 하얘요.", duration: 3500, textDelay: 700, visualLock: 760, effect: "memoryWarm" },
        { speaker: "코라", face: "coraHigh", view: "catMemory", text: "목에는 붉은 리본을 매 줬어요. 다른 회색 고양이와 헷갈리면 안 돼요.", duration: 4000, textDelay: 180, effect: "ribbon" },
        { speaker: "플레이어", face: "playerReady", view: "tavernCora", text: "흰 귀 하나와 붉은 리본이 보이도록 전단을 그리죠. 글만으로는 찾기 어렵습니다.", duration: 4400, textDelay: 180, effect: "fire" },
        { speaker: "코라", face: "coraCalm", view: "tavernWide", text: "고마워요. 안개가 돌아오면 선생 자리는 평생 비워 둘게요.", duration: 3700, textDelay: 170, effect: "fire" },
      ]),
    }),
  });

  global.CutsceneBeatsL1L2 = SCENES;
  global.CutsceneRegistry?.registerBeatScenes(SCENES);
  if (typeof module !== "undefined" && module.exports) module.exports = SCENES;
})(typeof window !== "undefined" ? window : globalThis);
