/**
 * L2→L3 컷신 beat 데이터 — B_AFTER_Q2A, B_AFTER_Q2B, B_AFTER_Q2C.
 *
 * dev/cutscenes/cutscene-review-l2-l3.js 에서 그대로 옮긴 승인본이다.
 * 대사·순서·duration·textDelay·visualLock·effect 를 임의로 바꾸지 않는다.
 *
 * C2C_OPEN_DOOR_CLOSING 의 맺음은 Q2A 통과 여부에 따라 갈린다. 검토본은 URL
 * fixture 로 흉내 냈지만 제품은 when 조건과 실제 통과 기록으로 판정한다
 * (GAME_INTEGRATION_PLAN 9.2).
 */
(function (global) {
  "use strict";

  const SCENES = Object.freeze({
    C3A_CARVERS_CREST: Object.freeze({
      id: "C3A_CARVERS_CREST",
      renderer: "l2-l3",
      title: "카버가 그린 네 줄",
      beats: Object.freeze([
        { speaker: "리드", face: "reedTense", view: "policeWideCompare", text: "학교에서 홀트 선생을 모셔 왔고, 카버 씨도 경찰서로 불렀소.", duration: 4300, textDelay: 650, visualLock: 820, effect: "fadeIn" },
        { speaker: "리드", face: "reedTense", view: "policeWideCompare", text: "홀트 선생의 증언으로 복원한 얼굴을 카버 씨와 대조하겠소.", duration: 4200, textDelay: 220 },
        { speaker: "리드", face: "reedTense", view: "compare", text: "두 얼굴을 같은 크기로 놓고, 남은 차이를 확인하겠소.", duration: 3800, textDelay: 520, visualLock: 700 },
        { speaker: "리드", face: "reedTense", view: "compareJaw", text: "그림은 턱이 각지고, 카버 씨는 둥글군.", duration: 3400, textDelay: 250, effect: "markJaw" },
        { speaker: "리드", face: "reedTense", view: "compareBrow", text: "그림은 왼눈썹이 올라가 있소. 카버 씨 눈썹은 대칭이고.", duration: 3900, textDelay: 210, effect: "markBrow" },
        { speaker: "리드", face: "reedTense", view: "compareScar", text: "그림엔 관자놀이 흉터도 있소. 카버 씨에게는 없고.", duration: 3800, textDelay: 190, effect: "markScar" },
        { speaker: "카버", face: "carverTense", view: "policeCarver", text: "열두 해와 난파를 겪은 얼굴이 그대로일 리 없습니다.", duration: 3900, textDelay: 210 },
        { speaker: "리드", face: "reedTense", view: "julianEnter", text: "줄리언 아셔튼 씨요. 엘리너 부인의 조카이자 지난 열두 해 재산을 관리한 사람이오.", duration: 4500, textDelay: 430, visualLock: 680, effect: "door" },
        { speaker: "줄리언", face: "julianHigh", view: "policeJulian", text: "숙모님, 차이만으로도 충분합니다. 저자는 사기꾼이에요.", duration: 3900, textDelay: 190 },
        { speaker: "플레이어", face: "playerThinking", view: "policeJulian", text: "차이는 의심의 근거입니다. 신원을 끝낸 판결은 아닙니다.", duration: 3900, textDelay: 190 },
        { speaker: "카버", face: "carverHigh", view: "policeCarver", text: "그렇다면 제가 아는 가문의 표식을 그리겠습니다.", duration: 3700, textDelay: 180 },
        { speaker: "카버", face: "carverHigh", view: "chalkCrescent", text: "먼저 초승달입니다.", duration: 2700, textDelay: 520, visualLock: 660, chalkLines: 0 },
        { speaker: "카버", face: "carverHigh", view: "chalkFour", text: "초승달 아래 파도 네 줄. 어릴 때부터 봤습니다.", duration: 4400, textDelay: 480, visualLock: 2050, chalkLines: 4 },
        { speaker: "엘리너", face: "eleanorTense", view: "policeEleanor", text: "익숙한 문양이에요. 하지만 제 기억만으로는…….", duration: 3700, textDelay: 190 },
        { speaker: "플레이어", face: "playerThinking", view: "policeEleanor", text: "부인, 기억이 아니라 대조할 실물이 남아 있습니까.", duration: 3900, textDelay: 190 },
        { speaker: "엘리너", face: "eleanorCalm", view: "letter", text: "에드먼드의 아버지가 남긴 편지가 있어요. 제가 갈라진 봉인 밀랍과 함께 보관했습니다.", duration: 4800, textDelay: 650, visualLock: 760 },
        { speaker: "플레이어", face: "playerReady", view: "letter", text: "조각과 편지 눌림을 맞춰 원래 문양을 복원하고, 이 네 줄 그림과 대조하겠습니다.", duration: 4600, textDelay: 190 },
      ]),
    }),
    C3B_FRESH_ANCHOR: Object.freeze({
      id: "C3B_FRESH_ANCHOR",
      renderer: "l2-l3",
      title: "소매 아래의 닻",
      beats: Object.freeze([
        { speaker: "카버", face: "carverHigh", view: "anchorReveal", text: "열여덟 살 때 제가 새긴 닻입니다. 이것도 신원의 증거입니다.", duration: 4100, textDelay: 400, visualLock: 680, effect: "wristReveal" },
        { speaker: "플레이어", face: "playerThinking", view: "anchor", text: "닻 도안은 확인했습니다. 손목을 그대로 두십시오.", duration: 3500, textDelay: 620, visualLock: 760 },
        { speaker: "플레이어", face: "playerThinking", view: "anchorPulse", text: "잉크가 선명하고 바늘 주변 피부는 아직 붉군요.", duration: 3900, textDelay: 180, effect: "pulse" },
        { speaker: "리드", face: "reedTense", view: "anchorReed", text: "내일 소매를 감추면 우리에게 남는 게 없소. 지금 그려 주시오.", duration: 4300, textDelay: 190 },
        { speaker: "플레이어", face: "playerReady", view: "anchorSketch", text: "날짜는 단정하지 않겠습니다. 현재 모습부터 조서에 남기죠.", duration: 4100, textDelay: 190, effect: "sketch" },
      ]),
    }),
    C3C_FOLLOW_THE_FLYER: Object.freeze({
      id: "C3C_FOLLOW_THE_FLYER",
      renderer: "l2-l3",
      title: "전단이 찾은 창고",
      beats: Object.freeze([
        { speaker: "코라", face: "coraHigh", view: "flyerCora", text: "귀 하나와 붉은 리본까지 맞아요. 여기 붙이면 보이겠죠.", duration: 4100, textDelay: 620, visualLock: 760, effect: "flyer" },
        { speaker: "부두 인부", face: "dockworkerCalm", view: "workerEnter", text: "그 회색 고양이, 한쪽 귀만 하얗고 목에는 붉은 리본을 맸더군.", duration: 4500, textDelay: 420, visualLock: 580 },
        { speaker: "코라", face: "coraTense", view: "dockCora", text: "안개가 맞아요. 한쪽 흰 귀와 붉은 리본을 둘 다 보셨으니까.", duration: 4200, textDelay: 190 },
        { speaker: "플레이어", face: "playerThinking", view: "warehouse", text: "창고 밖에서는 안쪽이 거의 보이지 않는군요.", duration: 3400, textDelay: 520, visualLock: 680 },
        { speaker: "코라", face: "coraCalm", view: "warehouse", text: "창문이 하나도 없어요. 등불 하나로는 발밑만 보여요.", duration: 3900, textDelay: 180, effect: "lantern" },
        { speaker: "플레이어", face: "playerThinking", view: "warehousePlan", text: "비춘 구역, 상자 높이, 젖은 바닥 반사를 차례로 그리겠습니다.", duration: 4400, textDelay: 560, visualLock: 760, effect: "route" },
        { speaker: "플레이어", face: "playerReady", view: "warehousePlan", text: "그 동선을 이어 붙이면 고양이가 숨은 틈까지 찾을 수 있습니다.", duration: 4300, textDelay: 190, effect: "routeComplete" },
      ]),
    }),
    C2C_OPEN_DOOR_CLOSING: Object.freeze({
      id: "C2C_OPEN_DOOR_CLOSING",
      renderer: "l2-l3",
      title: "열린 문간",
      beats: Object.freeze([
        { speaker: "플레이어", face: "playerCalm", view: "childDoor", text: "문은 열린 채로 두겠습니다. 이제 방 안을 피하지 않아도 됩니다.", duration: 4100, textDelay: 620, visualLock: 760, effect: "fadeIn" },
        { speaker: "플레이어", face: "playerThinking", view: "childDrawing", text: "배 한 척, 사람 셋, 그리고 ‘우리’. 종이에 모두 옮겼습니다.", duration: 4200, textDelay: 650, visualLock: 780 },
        { speaker: "플레이어", face: "playerThinking", view: "childDrawing", text: "한 주만 늦었어도 이 흔적을 모두 잃었을 겁니다.", duration: 3500, textDelay: 180, effect: "drip" },
        { speaker: "엘리너", face: "eleanorTense", view: "childEleanor", text: "문을 열면 아이가 없다는 걸 확인하게 될까 봐 피했어요.", duration: 4300, textDelay: 200 },
        { speaker: "엘리너", face: "eleanorTense", view: "childEleanor", text: "열두 해 동안, 닫힌 문 뒤에는 아직 그 아이가 있다고 생각했죠.", duration: 4300, textDelay: 190 },
        { speaker: "플레이어", face: "playerCalm", view: "childPair", text: "방은 비어 있어도 아이가 남긴 관찰은 사라지지 않습니다.", duration: 3900, textDelay: 190 },
        // 형제 노드를 어떤 순서로 깼는지에 따라 맺음이 달라진다.
        // 검토본의 ?q2a=complete fixture 를 실제 통과 기록으로 바꿨다.
        { speaker: "플레이어", face: "playerThinking", view: "childDrawingHair", text: "아이의 머리를 아주 짙게 칠했군요. 이 관찰도 홀트의 증언에 보태겠습니다.", duration: 4500, textDelay: 530, visualLock: 720, effect: "hair", when: { notCleared: ["Q2A_TRUE_FACE"] } },
        { speaker: "플레이어", face: "playerReady", view: "childPair", text: "그 증언과 그림으로 미화되기 전 얼굴을 복원하겠습니다.", duration: 4000, textDelay: 180, when: { notCleared: ["Q2A_TRUE_FACE"] } },
        { speaker: "플레이어", face: "playerThinking", view: "childDrawingHair", text: "아주 짙은 머리색도 홀트의 증언과 일치합니다.", duration: 3800, textDelay: 530, visualLock: 720, effect: "hair", when: { cleared: ["Q2A_TRUE_FACE"] } },
        { speaker: "엘리너", face: "eleanorCalm", view: "childPair", text: "닫힌 문보다, 남아 있는 아이의 흔적을 보겠습니다.", duration: 3800, textDelay: 180, when: { cleared: ["Q2A_TRUE_FACE"] } },
      ]),
    }),
  });

  global.CutsceneBeatsL2L3 = SCENES;
  global.CutsceneRegistry?.registerBeatScenes(SCENES);
  if (typeof module !== "undefined" && module.exports) module.exports = SCENES;
})(typeof window !== "undefined" ? window : globalThis);
