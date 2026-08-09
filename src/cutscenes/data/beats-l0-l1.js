/**
 * L0→L1 컷신 beat 데이터 — B_AFTER_Q0.
 *
 * dev/cutscenes/cutscene-review-l0-l1.js 에서 그대로 옮긴 승인본이다.
 * 대사·순서·duration·textDelay·visualLock 을 임의로 바꾸지 않는다
 * (GAME_INTEGRATION_PLAN 14장 "바꾸면 안 되는 것").
 */
(function (global) {
  "use strict";

  const SCENES = Object.freeze({
    C1A_RETURNED_HEIR: Object.freeze({
      id: "C1A_RETURNED_HEIR",
      renderer: "l0-l1",
      title: "돌아온 상속자",
      quest: "Q1A_IDEALIZED · 미화된 초상",
      purpose: "아셔튼 사건을 소개하고, 훼손된 유일한 18세 초상을 왜 복원해야 하는지 설명합니다.",
      clues: Object.freeze([
        "출처: 리드 경위가 전달한 엘리너 아셔튼의 쪽지",
        "남은 유일한 열여덟 살 초상",
        "습기로 색이 거의 빠지고 검은 선만 남음",
        "짙은 머리·청록 코트·화면 왼쪽 창가 빛이 메모에 남음",
        "복원해야 카버와 비교할 얼굴이 생김",
      ]),
      beats: Object.freeze([
        { speaker: "리드 경위", face: "reedCalm", view: "poster", text: "사흘 걸렸소. 당신 그림 덕분이라고 서장이 말하더군.", duration: 3100, textDelay: 360, visualLock: 720 },
        { speaker: "플레이어", face: "playerCalm", view: "third", text: "마르타 씨 덕분입니다. 저는 손만 빌려드렸죠.", duration: 2800, textDelay: 160 },
        { speaker: "리드 경위", face: "reedTense", view: "third", text: "그 손을 좀 더 빌려야겠소. 이번 건은 훨씬 크오.", duration: 3000, textDelay: 180 },
        { speaker: "리드 경위", face: "reedCalm", view: "newspaper", text: "12년 전 세이렌 호가 침몰했소. 아셔튼 가 외아들 에드먼드가 그 배에 있었지.", duration: 4100, textDelay: 740, visualLock: 740 },
        { speaker: "리드 경위", face: "reedCalm", view: "newspaper", text: "시신은 없었고, 어머니 엘리너는 사망 신고를 끝내 거부했소.", duration: 3400, textDelay: 160 },
        { speaker: "리드 경위", face: "reedTense", view: "newspaper", text: "그런데 토마스 카버라는 사내가 나타나 자기가 에드먼드라고 하오.", duration: 3600, textDelay: 180 },
        { speaker: "플레이어", face: "playerThinking", view: "third", text: "열여덟 살 얼굴과 지금 얼굴을 비교할 기록은요.", duration: 2800, textDelay: 150 },
        { speaker: "리드 경위", face: "reedHigh", view: "portrait", text: "하나뿐이오. 엘리너 부인이 간직한 그 아이의 옛 초상.", duration: 3300, textDelay: 900, visualLock: 900 },
        { speaker: "리드 경위", face: "reedTense", view: "portrait", text: "습기를 먹어 색이 거의 빠졌소. 지금은 검은 선만 남았고.", duration: 3300, textDelay: 180 },
        { speaker: "리드 경위", face: "reedCalm", view: "portrait", text: "부인의 쪽지요. 짙은 머리, 청록 코트, 왼쪽 창가의 따뜻한 빛이었다는군.", duration: 4100, textDelay: 240 },
        { speaker: "플레이어", face: "playerThinking", view: "portrait", text: "그 흔적을 복원해야 카버와 비교할 열여덟 살 얼굴이 생기겠군요.", duration: 3900, textDelay: 180 },
        { speaker: "리드 경위", face: "reedCalm", view: "third", text: "그렇소. 저택 응접실에서 초상을 직접 보고 되살려 주시오.", duration: 3500, textDelay: 170 },
      ]),
    }),

    C1B_TWELVE_YEARS_UNDER: Object.freeze({
      id: "C1B_TWELVE_YEARS_UNDER",
      renderer: "l0-l1",
      title: "벽 아래의 열두 해",
      quest: "Q1B_TAVERN_WALL · 선술집 벽",
      purpose: "코라의 서면 진술을 통해 12년 전 벽 층을 복원해야 하는 이유와 조사 한계를 설명합니다.",
      clues: Object.freeze([
        "출처: 선술집 주인 코라의 서면 진술",
        "벽에는 20년 동안 얼굴 위에 얼굴이 덧그려짐",
        "약 12년 전 아래층에 사람 얼굴 하나가 남아 있음",
        "회벽·숯가루·후대 낙서가 겹쳐 현재는 식별 불가",
        "복원 결과가 카버라는 보장은 없으며, 대조를 위해 그려야 함",
      ]),
      beats: Object.freeze([
        { speaker: "리드 경위", face: "reedCalm", view: "third", text: "그리고 확인할 길이 하나 더 있소.", duration: 2300, textDelay: 260 },
        { speaker: "플레이어", face: "playerThinking", view: "third", text: "카버가 12년 전에도 이 도시에 있었는지요.", duration: 2800, textDelay: 160 },
        { speaker: "리드 경위", face: "reedCalm", view: "wall", text: "부둣가 선술집의 코라에게 순경을 보냈소. 이건 그 여자의 진술이오.", duration: 3900, textDelay: 860, visualLock: 860 },
        { speaker: "코라의 진술", face: null, view: "wall", text: "우리 벽은 스무 해 동안 손님들이 얼굴 위에 얼굴을 덧그렸어요.", duration: 3700, textDelay: 200 },
        { speaker: "코라의 진술", face: null, view: "wall", text: "겉의 낙서 말고, 12년 전쯤 아래층에 사람 얼굴 하나가 남아 있어요.", duration: 3900, textDelay: 200 },
        { speaker: "코라의 진술", face: null, view: "wall", text: "회벽과 숯가루가 겹쳐서 지금은 누구 얼굴인지 볼 수 없고요.", duration: 3700, textDelay: 180 },
        { speaker: "플레이어", face: "playerThinking", view: "wall", text: "그 층을 꺼내 복원하면, 카버가 그때 이 도시에 있었는지 대조할 수 있겠군요.", duration: 4400, textDelay: 220 },
        { speaker: "리드 경위", face: "reedTense", view: "third", text: "맞소. 다만 나온 얼굴이 카버라는 보장은 없소.", duration: 3000, textDelay: 170 },
        { speaker: "리드 경위", face: "reedTense", view: "third", text: "그래서 그리는 거요. 맞는지 틀린지, 기억만으로는 남길 수 없으니까.", duration: 3900, textDelay: 180 },
        { speaker: "리드 경위", face: "reedCalm", view: "third", text: "저택과 선술집, 두 곳 모두 열어 두겠소. 어디부터 볼지는 선생이 정하시오.", duration: 4100, textDelay: 180 },
      ]),
    }),
  });

  global.CutsceneBeatsL0L1 = SCENES;
  global.CutsceneRegistry?.registerBeatScenes(SCENES);
  if (typeof module !== "undefined" && module.exports) module.exports = SCENES;
})(typeof window !== "undefined" ? window : globalThis);
