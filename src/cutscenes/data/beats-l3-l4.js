/**
 * L3→L4 컷신 beat 데이터 — B_AFTER_Q3A, B_AFTER_Q3B, B_AFTER_Q3C.
 *
 * dev/cutscenes/cutscene-review-l3-l4.js 에서 그대로 옮긴 승인본이다.
 * 대사·순서·duration·textDelay·visualLock·effect 를 임의로 바꾸지 않는다.
 *
 * C3B_TOO_NEW_CLOSING 의 맺음은 Q3A 통과 여부에 따라 갈린다. 검토본은 URL fixture 로 흉내 냈지만
 * 제품은 when 조건과 실제 통과 기록으로 판정한다 (GAME_INTEGRATION_PLAN 9.2).
 */
(function (global) {
  "use strict";

  const SCENES = Object.freeze({
    C4A_LEDGER_TRAIL: Object.freeze({
      id: "C4A_LEDGER_TRAIL",
      renderer: "l3-l4",
      title: "세 줄이 남긴 장부",
      quest: "Q4A_LEDGER",
      beats: Object.freeze([
        { speaker: "플레이어", face: "playerThinking", view: "sealCompare", text: "밀랍 조각과 편지 눌림이 같은 모양을 만들었습니다. 파도는 세 줄입니다.", duration: 4600, textDelay: 720, visualLock: 800, effect: "sealThree" },
        { speaker: "홀트", face: "holtCalm", view: "sealHolt", text: "맞습니다. 제가 매주 서신에서 보던 진품도 초승달 아래 세 줄이었습니다.", duration: 4300, textDelay: 180, effect: "sealThree" },
        { speaker: "리드", face: "reedTense", view: "sealReed", text: "칠판에는 네 줄이오. 지어낸 게 아니라 다른 것을 보고 배운 거라면?", duration: 4300, textDelay: 170, effect: "sealFour" },
        { speaker: "플레이어", face: "playerThinking", view: "policeReed", text: "한동안 누군가를 먹이고 재웠다면 비용이 들었을 겁니다.", duration: 3500, textDelay: 160, effect: "lamp" },
        { speaker: "플레이어", face: "playerReady", view: "policeReed", text: "사람은 숨겨도 계속된 지출은 숨기기 어렵습니다.", duration: 3300, textDelay: 150, effect: "lamp" },
        { speaker: "리드", face: "reedHigh", view: "ledger", text: "아셔튼 가의 열두 해 재산 관리 장부요. 보관 창고가 침수돼 장마다 붙었소.", duration: 4500, textDelay: 700, visualLock: 760, effect: "water" },
        { speaker: "리드", face: "reedTense", view: "ledger", text: "관리 서명과 지급행까지 번져서 남은 획만 간신히 보이는군.", duration: 3900, textDelay: 180, effect: "water" },
        { speaker: "플레이어", face: "playerThinking", view: "ledgerColumns", text: "서명 열과 지출 열, 반복된 지급행의 남은 획을 이어 보겠습니다.", duration: 4400, textDelay: 180, effect: "ledgerColumns" },
      ]),
    }),

    C4C_SQUARE_CHALLENGE: Object.freeze({
      id: "C4C_SQUARE_CHALLENGE",
      renderer: "l3-l4",
      title: "광장의 덧칠",
      quest: "Q4C_SQUARE_BET",
      beats: Object.freeze([
        { speaker: "램", face: "ramTense", view: "squareArrival", text: "거기, 사건 그림쟁이! 경찰서에만 숨어 있지 말고 광장으로 나오시지!", duration: 4300, textDelay: 820, visualLock: 880, effect: "fadeIn" },
        { speaker: "램", face: "ramTense", view: "squareRam", text: "이것도 못 맞추면 오늘로 간판을 내리시오. 사람들 앞에서 말이야.", duration: 4100, textDelay: 170, effect: "crowd" },
        { speaker: "플레이어", face: "playerThinking", view: "overpaint", text: "두꺼운 덧칠 아래에 오래된 젊은 남자의 얼굴 윤곽이 남아 있습니다.", duration: 4400, textDelay: 690, visualLock: 760, effect: "paint" },
        { speaker: "램", face: "ramTense", view: "squareRam", text: "누구인지는 묻지 마시오. 맞히는 게 선생 일 아닌가.", duration: 3300, textDelay: 160, effect: "crowd" },
        { speaker: "플레이어", face: "playerThinking", view: "featureNose", text: "덧칠이 비껴 간 곳에 굽은 코의 긴 붓질이 보입니다.", duration: 3600, textDelay: 420, visualLock: 520, effect: "feature" },
        { speaker: "플레이어", face: "playerThinking", view: "featureBrow", text: "오른눈썹에는 유독 두꺼운 짧은 획이 남았고요.", duration: 3400, textDelay: 160, effect: "feature" },
        { speaker: "플레이어", face: "playerReady", view: "featureJaw", text: "네모난 턱을 닫는 두 선도 찾았습니다. 이 세 붓질을 따라 덧칠 전 얼굴을 복원하죠.", duration: 4700, textDelay: 180, effect: "feature" },
      ]),
    }),

    C3B_TOO_NEW_CLOSING: Object.freeze({
      id: "C3B_TOO_NEW_CLOSING",
      renderer: "l3-l4",
      title: "아물지 않은 것",
      quest: null,
      beats: Object.freeze([
        { speaker: "플레이어", face: "playerThinking", view: "tattoo", text: "조서에 옮긴 닻 도안입니다. 먹색은 선명하고 바늘 주변 피부는 아직 붉습니다.", duration: 4700, textDelay: 700, visualLock: 780, effect: "pulseRed" },
        { speaker: "플레이어", face: "playerThinking", view: "tattoo", text: "오래된 문신의 바랜 먹과 아문 피부에는 맞지 않습니다.", duration: 3700, textDelay: 170, effect: "pulseRed" },
        { speaker: "리드", face: "reedTense", view: "policeReed", text: "최근에 새겼다는 강한 심증은 나도 인정하오.", duration: 3200, textDelay: 150, effect: "lamp" },
        { speaker: "리드", face: "reedCalm", view: "policeReed", text: "하지만 그림만으로 정확한 날짜를 법정에서 확정할 수는 없소.", duration: 3900, textDelay: 160, effect: "lamp" },
        { speaker: "플레이어", face: "playerCalm", view: "tattooFiled", text: "관찰한 모습 그대로 조서에 붙이겠습니다. 넘겨짚은 날짜는 적지 않겠습니다.", duration: 4200, textDelay: 190, effect: "file" },
        // 본선 Q3A 를 이미 통과했는지에 따라 맺음이 달라진다.
        // 검토본의 ?main=q3a-complete fixture 를 실제 통과 기록으로 바꿨다.
        { speaker: "리드", face: "reedCalm", view: "policeReed", text: "이제 엘리너 부인이 보관한 편지와 밀랍 봉인 실물을 확인합시다.", duration: 4100, textDelay: 170, effect: "lamp", when: { notCleared: ["Q3A_SEAL"] } },
        { speaker: "리드", face: "reedCalm", view: "policeReed", text: "이 기록은 조서에 붙이고, 증거판에 남은 일로 돌아갑시다.", duration: 3800, textDelay: 170, effect: "lamp", when: { cleared: ["Q3A_SEAL"] } },
      ]),
    }),

    C4B_CAT_FOUND_PAPERS: Object.freeze({
      id: "C4B_CAT_FOUND_PAPERS",
      renderer: "l3-l4",
      title: "상자 틈의 종이",
      quest: "Q4B_LOGBOOK",
      beats: Object.freeze([
        { speaker: "플레이어", face: "playerThinking", view: "warehouseArrival", text: "등불이 비춘 구역과 젖은 바닥 반사를 이으면 저 상자 틈으로 이어집니다.", duration: 4600, textDelay: 820, visualLock: 900, effect: "fadeIn" },
        { speaker: "코라", face: "coraTense", view: "warehouseCora", text: "안개야! 옅은 회색 몸, 흰 귀 하나, 붉은 리본까지 맞아요.", duration: 4100, textDelay: 180, effect: "lantern" },
        { speaker: "코라", face: "coraCalm", view: "catFound", text: "겁먹긴 했어도 다친 데는 없네요. 어디에 몸을 숨겼던 거니?", duration: 3900, textDelay: 650, visualLock: 720, effect: "catEyes" },
        { speaker: "플레이어", face: "playerThinking", view: "warehouseGap", text: "고양이가 나온 틈에 젖고 찢어진 종이 뭉치가 있습니다.", duration: 3900, textDelay: 240, effect: "lantern" },
        { speaker: "코라", face: "coraTense", view: "logbook", text: "기름 먹인 표지예요. 뱅크스 영감이 늘 들고 다니던 작은 일지예요.", duration: 4500, textDelay: 700, visualLock: 780, effect: "drip" },
        { speaker: "코라", face: "coraCalm", view: "logbook", text: "매일 빠짐없이 적는 버릇이 있었으니 제가 알아봐요.", duration: 3500, textDelay: 160, effect: "drip" },
        { speaker: "플레이어", face: "playerThinking", view: "logbookEdges", text: "글을 추측하지 않겠습니다. 결·모서리·남은 획이 이어지는 조각부터 맞추죠.", duration: 4700, textDelay: 180, effect: "paperEdges" },
        { speaker: "코라", face: "coraTense", view: "warehouseCora", text: "세이렌 호에서 건져 온 물건이라 했어요. 돌려줘야 해요.", duration: 3900, textDelay: 170, effect: "lantern" },
      ]),
    }),
  });

  global.CutsceneBeatsL3L4 = SCENES;
  global.CutsceneRegistry?.registerBeatScenes(SCENES);
  if (typeof module !== "undefined" && module.exports) module.exports = SCENES;
})(typeof window !== "undefined" ? window : globalThis);
