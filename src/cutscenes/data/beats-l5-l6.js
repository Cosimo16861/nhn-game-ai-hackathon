/**
 * L5→L6 컷신 beat 데이터 — B_AFTER_Q5A, B_AFTER_Q5B.
 *
 * dev/cutscenes/cutscene-review-l5-l6.js 에서 그대로 옮긴 승인본이다.
 * 대사·순서·duration·textDelay·visualLock·effect 를 임의로 바꾸지 않는다.
 *
 * C5B_THAT_NIGHT_CLOSING 의 맺음은 Q5A 통과 여부에 따라 갈린다. 검토본은 URL fixture 로 흉내 냈지만
 * 제품은 when 조건과 실제 통과 기록으로 판정한다 (GAME_INTEGRATION_PLAN 9.2).
 */
(function (global) {
  "use strict";

  const SCENES = Object.freeze({
    C6_EVIDENCE_WALL: Object.freeze({
      id: "C6_EVIDENCE_WALL",
      renderer: "l5-l6",
      title: "세 줄과 네 줄",
      quest: "Q6_EVIDENCE_ROOM",
      beats: Object.freeze([
        { speaker: "플레이어", face: "playerThinking", view: "carriageFour", text: "Q5A에서 복원한 마차 문입니다. 초승달 아래 파도는 하나, 둘, 셋, 넷.", duration: 4900, textDelay: 740, visualLock: 1750, effect: "traceFour" },
        { speaker: "리드", face: "reedHigh", view: "compare", text: "마차에는 네 줄, 진품 봉인에는 세 줄이오.", duration: 3500, textDelay: 620, visualLock: 700, effect: "compare" },
        { speaker: "홀트", face: "holtCalm", view: "compareHolt", text: "편지 눌림과 밀랍 조각이 만든 진품도 세 줄이었소. 내가 매주 보던 것과 같소.", duration: 4700, textDelay: 180, effect: "compare" },
        { speaker: "플레이어", face: "playerThinking", view: "threeSources", text: "Q5A의 마차 문은 네 줄, Q3A의 진품은 세 줄입니다. 두 결과를 같은 배율로 놓아 보죠.", duration: 4700, textDelay: 230, visualLock: 620, effect: "chalk" },
        { speaker: "리드", face: "reedTense", view: "threeSources", text: "진품만 세 줄이고, 카버가 외운 네 줄은 마차 문과 같군.", duration: 4000, textDelay: 180, effect: "chalk" },
        { speaker: "플레이어", face: "playerReady", view: "linkCarver", text: "카버가 외운 것은 진품이 아니라 이 마차 문이었습니다.", duration: 4200, textDelay: 180, visualLock: 640, effect: "link" },
        { speaker: "리드", face: "reedCalm", view: "compareReed", text: "소유자는 등록부로 확인하겠소. 아직 이름을 단정하지 맙시다.", duration: 4200, textDelay: 180, effect: "compare" },
        { speaker: "리드", face: "reedHigh", view: "officeArrival", text: "그 전에 우리 손에 든 그림부터 한 벽에 모읍시다.", duration: 3700, textDelay: 760, visualLock: 820, effect: "fadeIn" },
        { speaker: "리드", face: "reedTense", view: "evidenceWall", text: "사건을 입증하는 여섯 장을 빠짐없이 벽에 거시오. 그래야 우연이라는 틈을 막을 수 있소.", duration: 4900, textDelay: 650, visualLock: 720, effect: "cards" },
        { speaker: "홀트", face: "holtHigh", view: "evidenceWallHolt", text: "서로 다른 때, 서로 다른 사람이 남긴 그림들이 한곳을 가리키는지 보아야겠군요.", duration: 4600, textDelay: 180, effect: "cards" },
        { speaker: "플레이어", face: "playerThinking", view: "openThread", text: "이번 일은 사라진 선을 복원하는 것이 아니라, 남은 증거의 관계를 증명하는 일입니다.", duration: 5000, textDelay: 200, visualLock: 620, effect: "thread" },
        { speaker: "플레이어", face: "playerReady", view: "openThread", text: "마지막 실은 제가 잇겠습니다.", duration: 3300, textDelay: 170, effect: "threadPulse" },
      ]),
    }),

    C5B_THAT_NIGHT_CLOSING: Object.freeze({
      id: "C5B_THAT_NIGHT_CLOSING",
      renderer: "l5-l6",
      title: "그 밤",
      quest: null,
      beats: Object.freeze([
        { speaker: "플레이어", face: "playerThinking", view: "sirenHold", text: "그림은 끝났습니다. 기울어진 선체, 드러난 난간, 두 손으로 매달린 열여덟 살의 모습입니다.", duration: 5300, textDelay: 900, visualLock: 1150, effect: "stormStop" },
        { speaker: "뱅크스", face: "banksTense", view: "sirenBanks", text: "그 각도요. 자세도 맞소. 그 아이는 두 손을 놓지 않으려 몸을 낮추고 있었소.", duration: 5000, textDelay: 200, effect: "memoryWarm" },
        { speaker: "뱅크스", face: "banksTense", view: "sirenClose", text: "영웅이 아니었소. 그저 두려움에 떨던 열여덟 살이었지.", duration: 4200, textDelay: 210, visualLock: 650, effect: "still" },
        { speaker: "뱅크스", face: "banksHigh", view: "sirenClose", text: "파도 소리 사이로 어머니를 불렀소. 끝까지, 몇 번이고.", duration: 4200, textDelay: 180, effect: "still" },
        { speaker: "플레이어", face: "playerCalm", view: "sirenPair", text: "없었던 용기를 덧칠하지 않겠습니다. 당신이 본 두려움 그대로 남기죠.", duration: 4500, textDelay: 190, effect: "memoryWarm" },
        { speaker: "뱅크스", face: "banksTense", view: "banksFirst", text: "엘리너 부인에게는 말하지 못했소. 그분이 듣고 싶은 이야기가 아니었으니까.", duration: 4800, textDelay: 260, visualLock: 680, effect: "warmFade" },
        { speaker: "플레이어", face: "playerThinking", view: "sirenPair", text: "듣고 싶은 이야기와 실제로 남겨야 할 기억은 다를 수 있습니다.", duration: 4300, textDelay: 180, effect: "memoryWarm" },
        // 본선 Q5A 를 이미 통과했는지에 따라 맺음이 달라진다.
        // 검토본의 ?q5a=complete fixture 를 실제 통과 기록으로 바꿨다.
        { speaker: "뱅크스", face: "banksCalm", view: "sirenBanks", text: "증거판에 남은 일이 있다면 마지막 연결까지 끝내시오.", duration: 4100, textDelay: 200, effect: "memoryWarm", when: { cleared: ["Q5A_DOCK"] } },
        { speaker: "뱅크스", face: "banksCalm", view: "sirenBanks", text: "이제 선생이 쫓던 사람 일로 돌아가시오.", duration: 4100, textDelay: 200, effect: "memoryWarm", when: { notCleared: ["Q5A_DOCK"] } },
      ]),
    }),
  });

  global.CutsceneBeatsL5L6 = SCENES;
  global.CutsceneRegistry?.registerBeatScenes(SCENES);
  if (typeof module !== "undefined" && module.exports) module.exports = SCENES;
})(typeof window !== "undefined" ? window : globalThis);
