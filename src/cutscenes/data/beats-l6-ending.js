/**
 * 엔딩 컷신 beat 데이터 — B_AFTER_Q6 (CE_ENDING).
 *
 * dev/cutscenes/cutscene-review-l6-ending.js 에서 그대로 옮긴 승인본이다.
 *
 * 후일담은 URL fixture 가 아니라 실제로 완료한 가지로 갈린다
 * (GAME_INTEGRATION_PLAN 9.2, QuestGraph.EPILOGUE_CUTS).
 *   Q2C → EPI_OPEN_DOOR / Q3B → EPI_TATTOO_CONFESSION
 *   Q3C → EPI_CAT_AT_WINDOW / Q4C → EPI_RAM_COPIES / Q5B → EPI_LAST_PAINTING
 * 본선만 밟아도 엔딩은 끝까지 재생된다. 가지는 결말을 바꾸지 않는다.
 */
(function (global) {
  "use strict";

  function beat(speaker, face, view, text, options) {
    return Object.freeze(Object.assign({
      speaker: speaker,
      face: face,
      view: view,
      text: text,
      duration: 3450,
      textDelay: 150,
    }, options || {}));
  }

  const BEATS = Object.freeze([
    // ── 본선 도입 ──────────────────────────────────────────────────
    beat("플레이어", "playerThinking", "officeBoard", "마지막 실을 이었습니다. 봉인의 세 줄은 마차의 네 줄에 닿았습니다.", { duration: 4100, textDelay: 700, visualLock: 760, effect: "threads" }),
    beat("리드", "reedTense", "registryClosed", "그래도 소유자 이름은 그림으로 단정할 수 없소. 등록부를 펼치시오.", { duration: 3900, textDelay: 680, visualLock: 720, effect: "fadeIn" }),
    beat("리드", "reedHigh", "registryReveal", "해당 마차의 등록 소유자는 줄리언 아셔튼. 그는 십이 년째 같은 문짝 문양을 유지했소.", { duration: 4700, textDelay: 900, visualLock: 1000, effect: "registry" }),
    beat("플레이어", "playerReady", "registryReveal", "이제 등록 소유자 줄리언 아셔튼과 마차의 네 줄이 처음으로 한 행에 놓였습니다.", { duration: 4300, effect: "registry" }),
    beat("줄리언", "julianHigh", "confrontJulian", "그림은 화가의 주관일 뿐이오. 선 몇 개로 사람을 범인으로 만드는군.", { duration: 4000, textDelay: 500, visualLock: 600 }),
    beat("리드", "reedTense", "compareSeal", "진품 봉인은 에드먼드의 아버지가 남기고 엘리너가 보관한 편지와 밀랍 조각에서 복원한 세 줄이오.", { duration: 5100, textDelay: 650, visualLock: 760, effect: "evidence" }),
    beat("리드", "reedHigh", "compareCarriage", "네 줄은 뱅크스의 기억에서 복원한 마차 문이오. 등록부는 그 마차의 소유자를 확인했지.", { duration: 4500, effect: "evidence" }),
    beat("리드", "reedHigh", "compareChalk", "그리고 카버가 모든 사람 앞에서 직접 그린 네 줄. 출처 세 개가 독립적이오.", { duration: 4300, effect: "evidence" }),
    beat("카버", "carverTense", "confessCarver", "줄리언이 종이에 그려 줬습니다. 백 번은 그리게 했습니다.", { duration: 3900, textDelay: 450, visualLock: 550 }),
    beat("카버", "carverHigh", "confessCarver", "저는 에드먼드가 아닙니다. 정육점에서 일하던 토마스 카버입니다.", { duration: 3800 }),
    beat("리드", "reedTense", "ledger", "카버의 백 번 연습 자백과 장부의 T.C. 넉 달 지급은 같은 준비 기간을 가리키오.", { duration: 4500, textDelay: 700, visualLock: 760, effect: "ledger" }),
    // EPI_TATTOO_CONFESSION — Q3B_TATTOO 를 완료했을 때만
    beat("카버", "carverTense", "tattoo", "문신도 넉 달 전에 줄리언이 시켰습니다.", { duration: 3400, textDelay: 620, visualLock: 700, effect: "evidence" , when: { cleared: ["Q3B_TATTOO"] } }),
    // ── 대질과 저택 ────────────────────────────────────────────────
    beat("리드", "reedHigh", "confrontJulian", "처음부터 카버를 가장 크게 비난했지. 가장 먼저 알고 있었던 사람처럼.", { duration: 4100 }),
    beat("리드", "reedTense", "ledger", "같은 관리 서명 아래 십이 년 동안 비정상 재산 유출이 이어졌소. 장부 감사가 시작되면 숨길 수 없었겠지.", { duration: 4700, textDelay: 640, visualLock: 720, effect: "ledger" }),
    beat("플레이어", "playerThinking", "confrontJulian", "확보한 장부와 카버의 사칭 자백, 등록부를 함께 보면 계획은 하나입니다.", { duration: 3800, textDelay: 620, visualLock: 700 }),
    beat("플레이어", "playerReady", "confrontJulian", "가짜 상속인에게 장부 승인과 재산 처분을 맡겨, 상속 절차 뒤로 횡령을 덮으려 한 겁니다.", { duration: 4500, textDelay: 640, visualLock: 720 }),
    beat("줄리언", "julianTense", "confrontJulian", "…….", { duration: 2300, textDelay: 300 }),
    beat("리드", "reedHigh", "confrontJulian", "경관, 카버는 사칭·공모 혐의로, 줄리언은 공모·횡령 혐의로 구금하시오.", { duration: 4300, textDelay: 620, visualLock: 700 }),
    beat("플레이어", "playerCalm", "parlorArrival", "카버는 에드먼드가 아니었습니다. 이제 의심이 아닌 증거로 말씀드립니다.", { duration: 4700, textDelay: 1700, visualLock: 1650, effect: "fadeIn", transition: Object.freeze({ time: "그날 새벽", place: "아셔튼 저택" }) }),
    beat("플레이어", "playerReady", "trueFace", "대신 열여덟 살 에드먼드의 얼굴을 가져왔습니다.", { duration: 3600, textDelay: 720, visualLock: 820, effect: "evidence" }),
    beat("엘리너", "eleanorTense", "trueFaceEleanor", "각진 턱, 웃을 때 올라가던 왼눈썹, 관자놀이의 작은 흉터…… 맞아요.", { duration: 4300, effect: "evidence" }),
    beat("엘리너", "eleanorHigh", "parlorEleanor", "내가 보고 싶었던 얼굴이 아니라, 그 아이의 얼굴을 돌려주셨군요.", { duration: 4400 }),
    // ── 후일담 ─────────────────────────────────────────────────────
    // EPI_OPEN_DOOR — Q2C_CHILD_ROOM 를 완료했을 때만 (GAME_INTEGRATION_PLAN 9.2)
    beat("엘리너", "eleanorCalm", "childRoom", "서쪽 복도 문을 열었어요. 이제 빈 방도 그 아이가 살았던 자리예요.", { duration: 4500, textDelay: 1700, visualLock: 1650, effect: "child", transition: Object.freeze({ time: "그날 아침", place: "아셔튼 저택 · 서쪽 복도" }) , when: { cleared: ["Q2C_CHILD_ROOM"] } }),
    beat("플레이어", "playerCalm", "childRoom", "크레용 그림 옆에 진짜 초상이 걸렸습니다. 둘 다 그 애의 기억입니다.", { duration: 4100, effect: "child" , when: { cleared: ["Q2C_CHILD_ROOM"] } }),
    // EPI_CAT_AT_WINDOW — Q3C_WAREHOUSE 를 완료했을 때만 (GAME_INTEGRATION_PLAN 9.2)
    beat("코라", "coraHigh", "tavernCat", "안개야, 거기서 졸면 또 창에 자국이 남아. 그래도 오늘은 꼼짝을 않네.", { duration: 4700, textDelay: 1700, visualLock: 1650, effect: "wipe", transition: Object.freeze({ time: "며칠 뒤", place: "부두 선술집" }) , when: { cleared: ["Q3C_WAREHOUSE"] } }),
    beat("플레이어", "playerCalm", "tavernCat", "안개가 걷힌 창에서 안개가 잠듭니다. 코라는 오늘도 창을 닦습니다.", { duration: 4000, effect: "wipe" , when: { cleared: ["Q3C_WAREHOUSE"] } }),
    // EPI_RAM_COPIES — Q4C_SQUARE_BET 를 완료했을 때만 (GAME_INTEGRATION_PLAN 9.2)
    beat("램", "ramHigh", "squareRam", "복원 초상 한 장! 범인이 아닌 진짜 사람의 얼굴이오! 오늘만 특별가.", { duration: 4500, textDelay: 1700, visualLock: 1650, effect: "crowd", transition: Object.freeze({ time: "며칠 뒤", place: "시장 광장" }) , when: { cleared: ["Q4C_SQUARE_BET"] } }),
    beat("리드", "reedHigh", "squareReed", "남의 그림을 베껴 팔 시간이 있으면 당장 거기 서시오, 램!", { duration: 3800, effect: "chase" , when: { cleared: ["Q4C_SQUARE_BET"] } }),
    // EPI_LAST_PAINTING — Q5B_SIREN 를 완료했을 때만 (GAME_INTEGRATION_PLAN 9.2)
    beat("플레이어", "playerThinking", "siren", "뱅크스의 증언으로 복원한 세이렌 호의 마지막 밤입니다.", { duration: 4400, textDelay: 1700, visualLock: 1650, effect: "storm", transition: Object.freeze({ time: "며칠 뒤 저녁", place: "아셔튼 저택" }) , when: { cleared: ["Q5B_SIREN"] } }),
    beat("플레이어", "playerCalm", "siren", "에드먼드는 두 손으로 난간을 잡고 어머니를 불렀습니다. 두려운 열여덟 살이었습니다.", { duration: 4700, effect: "storm" , when: { cleared: ["Q5B_SIREN"] } }),
    beat("엘리너", "eleanorTense", "sirenEleanor", "영웅이어서 돌아오지 못한 게 아니었군요. 그 아이는 나를 찾고 있었어요.", { duration: 4400, effect: "storm" , when: { cleared: ["Q5B_SIREN"] } }),
    beat("엘리너", "eleanorCalm", "deathCertificate", "십이 년을 미뤄 둔 사망 신고서에 오늘 서명하겠어요. 에드먼드 아셔튼.", { duration: 4500, textDelay: 650, visualLock: 760, effect: "signature" , when: { cleared: ["Q5B_SIREN"] } }),
    // ── 맺음 ───────────────────────────────────────────────────────
    beat("플레이어", "playerThinking", "officeReveal", "기억은 원하는 얼굴을 남긴다. 그래서 남은 획을 하나씩 그렸다.", { duration: 4900, textDelay: 1700, visualLock: 1650, effect: "reveal", transition: Object.freeze({ time: "다음 날 새벽", place: "플레이어의 사무소" }) }),
    beat("플레이어", "playerReady", "officeReveal", "진실은 한 장의 그림이 아니라, 서로 다른 사람이 남긴 선 사이에 있었다.", { duration: 4800, effect: "reveal" }),
    beat("플레이어", "playerCalm", "officeDawn", "안개가 걷힌다. 그림은 남고, 사람은 다음 기억으로 걸어간다.", { duration: 4300, effect: "dawn" }),
    beat("플레이어", "playerCalm", "title", "마지막 초상을 완성했다.", { duration: 5200, textDelay: 900, visualLock: 1000, effect: "title" }),
  ]);

  const SCENES = Object.freeze({
    CE_ENDING: Object.freeze({
      id: "CE_ENDING",
      renderer: "l6-ending",
      title: "마지막 초상",
      beats: BEATS,
    }),
  });

  global.CutsceneBeatsEnding = SCENES;
  global.CutsceneRegistry?.registerBeatScenes(SCENES);
  if (typeof module !== "undefined" && module.exports) module.exports = SCENES;
})(typeof window !== "undefined" ? window : globalThis);
