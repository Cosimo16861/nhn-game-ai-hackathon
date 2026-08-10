/**
 * L4→L5 컷신 beat 데이터 — B_AFTER_Q4A, B_AFTER_Q4B, B_AFTER_Q4C.
 *
 * dev/cutscenes/cutscene-review-l4-l5.js 에서 그대로 옮긴 승인본이다.
 * 대사·순서·duration·textDelay·visualLock·effect 를 임의로 바꾸지 않는다.
 *
 * C4C_PAINTER_CLOSING 의 맺음은 Q5A 통과 여부에 따라 갈린다. 검토본은 URL fixture 로 흉내 냈지만
 * 제품은 when 조건과 실제 통과 기록으로 판정한다 (GAME_INTEGRATION_PLAN 9.2).
 */
(function (global) {
  "use strict";

  const C5A_BEATS = Object.freeze([
    { speaker: "리드", face: "reedCalm", view: "ledgerManager", text: "복원한 장부요. 먼저 재산 관리 서명 열부터 확인합시다.", duration: 3500, textDelay: 650, visualLock: 760, effect: "ink" },
    { speaker: "플레이어", face: "playerThinking", view: "ledgerManager", text: "번진 획이 이어집니다. 관리 서명은 ‘줄리언 아셔튼’입니다.", duration: 3900, textDelay: 190, effect: "ink" },
    { speaker: "플레이어", face: "playerThinking", view: "ledgerYears", text: "같은 관리 서명 아래, 십이 년 동안 재산이 비정상 지출로 빠져나갔습니다.", duration: 4400, textDelay: 190, effect: "ink" },
    { speaker: "리드", face: "reedTense", view: "ledgerExpense", text: "그중 같은 금액이 통상 지출과 다른 열에서 반복됐소.", duration: 3700, textDelay: 180, effect: "ink" },
    { speaker: "플레이어", face: "playerThinking", view: "ledgerTC", text: "지급 대상은 ‘T.C.’. 끊기지 않고 넉 달 동안 이어졌습니다.", duration: 3900, textDelay: 190, effect: "ink" },
    { speaker: "리드", face: "reedHigh", view: "stationPair", text: "토마스 카버의 머리글자와 같군. 그에게 넉 달 돈을 댄 셈이오.", duration: 4000, textDelay: 180 },
    { speaker: "플레이어", face: "playerThinking", view: "stationPair", text: "추론은 됩니다. 하지만 관리인이 고용인에게 준 정상 지출이라 반박할 수 있습니다.", duration: 4500, textDelay: 190 },
    { speaker: "리드", face: "reedCalm", view: "stationPair", text: "두 사람이 직접 만났다는 별도 증거가 필요하겠소.", duration: 3400, textDelay: 170 },
    { speaker: "플레이어", face: "playerCalm", view: "dockArrival", text: "뱅크스 씨. 세이렌 호에서 살아남은 선원이라 들었습니다. 토마스 카버를 아십니까.", duration: 4700, textDelay: 760, visualLock: 900, effect: "fadeIn" },
    { speaker: "뱅크스", face: "banksCalm", view: "dockBanks", text: "카버? 선원은 무슨. 정육점에서 고기 손질하던 토마스였소.", duration: 4100, textDelay: 180, effect: "fog" },
    { speaker: "플레이어", face: "playerThinking", view: "dockBanks", text: "그가 시내로 올라가기 전, 누군가 찾아온 적은 없습니까.", duration: 3700, textDelay: 180, effect: "fog" },
    { speaker: "뱅크스", face: "banksTense", view: "dockBanks", text: "그 전 일주일, 밤마다 검은 마차가 저 가스등 밑에 왔소.", duration: 3900, textDelay: 190, effect: "fog" },
    { speaker: "뱅크스", face: "banksHigh", view: "carriageWitness", text: "마차가 서면 토마스가 타고, 얼마 뒤 혼자 돌아왔지.", duration: 3900, textDelay: 640, visualLock: 720, effect: "memory" },
    { speaker: "플레이어", face: "playerThinking", view: "carriageLayout", text: "가스등, 마차, 카버의 식별할 수 없는 실루엣, 정박한 배.", duration: 4700, textDelay: 180, visualLock: 3200, effect: "memory" },
    { speaker: "뱅크스", face: "banksTense", view: "carriageBlur", text: "문에 초승달과 물결 같은 표식이 있었소. 안개 탓에 수와 세부는 모르오.", duration: 4700, textDelay: 180, effect: "memory" },
    { speaker: "플레이어", face: "playerReady", view: "carriageComplete", text: "젖은 돌바닥의 반사까지 먼저 놓으면, 문짝의 위치를 좁힐 수 있습니다.", duration: 4500, textDelay: 180, visualLock: 1200, effect: "layout" },
    { speaker: "플레이어", face: "playerThinking", view: "carriageGate", text: "문짝을 확대해도 초승달 아래에는 안개에 끊긴 흔적만 남아 있습니다.", duration: 4300, textDelay: 720, visualLock: 850, effect: "gateFog" },
    { speaker: "뱅크스", face: "banksTense", view: "carriageGate", text: "나는 저 흐린 잔흔까지만 기억하오. 그 이상은 증언할 수 없소.", duration: 3900, textDelay: 180, effect: "gateFog" },
    { speaker: "플레이어", face: "playerReady", view: "carriageGate", text: "문짝의 끊긴 흔적은 작업대에서 이어 보겠습니다.", duration: 3900, textDelay: 180, effect: "gateFog" },
    { speaker: "리드", face: "reedCalm", view: "dockWide", text: "소유자는 단정하지 맙시다. 먼저 그 밤의 배치를 그림으로 남기시오.", duration: 4300, textDelay: 190, effect: "fog" },
  ]);

  const C5B_BEATS = Object.freeze([
    { speaker: "플레이어", face: "playerCalm", view: "dockArrival", text: "뱅크스 씨, 세이렌 호 생존 선원께서 맡긴 일지를 복원했습니다. 돌려드립니다.", duration: 4600, textDelay: 680, visualLock: 820, effect: "fadeIn" },
    { speaker: "뱅크스", face: "banksCalm", view: "journalReturn", text: "고맙소. 젖어 붙었던 줄은 선생이 먼저 읽어 주시오.", duration: 3600, textDelay: 180, effect: "journal" },
    { speaker: "플레이어", face: "playerThinking", view: "journalMidnight", text: "복원된 첫 기록입니다. ‘자정.’", duration: 2800, textDelay: 680, visualLock: 730, effect: "journal" },
    { speaker: "플레이어", face: "playerThinking", view: "journalCarriage", text: "다음 획은 ‘검은 마차.’", duration: 2700, textDelay: 150, effect: "journal" },
    { speaker: "플레이어", face: "playerThinking", view: "journalPost", text: "‘가스등 두 번째 기둥 옆.’ 장소도 남아 있습니다.", duration: 3500, textDelay: 160, effect: "journal" },
    { speaker: "플레이어", face: "playerThinking", view: "journalThomas", text: "‘토마스가 탔다.’ 인물의 행동까지 적혀 있습니다.", duration: 3500, textDelay: 160, effect: "journal" },
    { speaker: "플레이어", face: "playerReady", view: "journalThird", text: "마지막은 ‘사흘째 같은 자리.’ 반복 방문을 직접 기록했군요.", duration: 4100, textDelay: 160, effect: "journal" },
    { speaker: "뱅크스", face: "banksTense", view: "dockBanks", text: "마차 주인은 몰랐소. 안개 속 문짝만 봤으니 그 이상은 내 증언이 아니오.", duration: 4600, textDelay: 210, effect: "fog" },
    { speaker: "뱅크스", face: "banksCalm", view: "journalReturn", text: "일지를 돌려받았으니, 이번에는 내가 남겨야 할 밤이 있소.", duration: 4000, textDelay: 180, effect: "journal" },
    { speaker: "플레이어", face: "playerCalm", view: "dockBanks", text: "세이렌 호가 침몰한 밤을 말씀하시는군요.", duration: 3300, textDelay: 170, effect: "fog" },
    { speaker: "뱅크스", face: "banksHigh", view: "stormTilt", text: "폭풍이 선체를 크게 기울였소. 갑판은 걷는 바닥이 아니라 벽처럼 솟았지.", duration: 4500, textDelay: 730, visualLock: 800, effect: "storm" },
    { speaker: "플레이어", face: "playerThinking", view: "stormTilt", text: "선체 기울기와 폭풍의 방향부터 고정하겠습니다.", duration: 3500, textDelay: 180, effect: "storm" },
    { speaker: "뱅크스", face: "banksTense", view: "stormRail", text: "난간이 보였소. 에드먼드는 거기에 매달려 있었소.", duration: 3700, textDelay: 180, effect: "storm" },
    { speaker: "뱅크스", face: "banksTense", view: "stormHands", text: "두 손으로 난간을 붙들고, 미끄러지지 않으려 온몸으로 버텼소.", duration: 4400, textDelay: 180, visualLock: 1200, effect: "stormHands" },
    { speaker: "플레이어", face: "playerThinking", view: "stormHands", text: "두 손의 위치와 몸의 무게가 난간 아래로 쏠린 자세를 남기겠습니다.", duration: 4500, textDelay: 180, effect: "stormBothHands" },
    { speaker: "뱅크스", face: "banksHigh", view: "stormHands", text: "그 애는 어머니를 불렀소. 계속, 어머니를.", duration: 3900, textDelay: 180, effect: "stormMute" },
    { speaker: "뱅크스", face: "banksTense", view: "stormHands", text: "누굴 구하려고 영웅처럼 선 게 아니오. 두려워 매달린 열여덟 살이었소.", duration: 4800, textDelay: 180, effect: "stormMute" },
    { speaker: "플레이어", face: "playerReady", view: "stormWide", text: "기울어진 선체, 폭풍, 난간, 두 손 자세. 들은 그대로 그리겠습니다.", duration: 4600, textDelay: 180, effect: "storm" },
    { speaker: "뱅크스", face: "banksCalm", view: "dockBanks", text: "그래 주시오. 내가 보태지도, 덜어내지도 못하게.", duration: 3700, textDelay: 200, effect: "fog" },
  ]);

  const C4C_BEATS = Object.freeze([
      { speaker: "램", face: "ramHigh", view: "ramReveal", text: "덧칠 아래서 나온 젊은 얼굴, 내 자화상이오.", duration: 3900, textDelay: 700, visualLock: 760, effect: "paint" },
      { speaker: "플레이어", face: "playerThinking", view: "ramCompare", text: "굽은 코, 유독 두꺼운 오른눈썹, 네모난 턱. 지금 얼굴과 같은 붓질입니다.", duration: 4700, textDelay: 190, effect: "paint" },
      { speaker: "램", face: "ramTense", view: "squareRam", text: "젊을 적엔 저 얼굴이면 무엇이든 팔 수 있다고 믿었지.", duration: 4000, textDelay: 180 },
      { speaker: "램", face: "ramCalm", view: "ramPortrait", text: "하지만 사람들은 자기가 기억하고 싶은 얼굴만 산다.", duration: 4300, textDelay: 180, effect: "paint" },
      { speaker: "플레이어", face: "playerCalm", view: "squareRam", text: "그래도 덧칠 전 얼굴은 사라지지 않았습니다.", duration: 3500, textDelay: 170 },
      // 본선 Q5A 를 이미 통과했는지에 따라 맺음이 달라진다.
      // 검토본의 ?q5a=1 fixture 를 실제 통과 기록으로 바꿨다.
      { speaker: "램", face: "ramCalm", view: "squareWide", text: "증거판에 남은 일이 있다면 마지막 연결까지 마치시오.", duration: 4300, textDelay: 180, when: { cleared: ["Q5A_DOCK"] } },
      { speaker: "램", face: "ramCalm", view: "squareWide", text: "이제 사건으로 돌아가시오. 선생이 쫓던 사람을 놓치기 전에.", duration: 4300, textDelay: 180, when: { notCleared: ["Q5A_DOCK"] } },
    ]);

  const SCENES = Object.freeze({
    C5A_CARRIAGE_WITNESS: Object.freeze({
      id: "C5A_CARRIAGE_WITNESS",
      renderer: "l4-l5",
      title: "넉 달과 검은 마차",
      beats: C5A_BEATS,
    }),
    C5B_SIREN_WITNESS: Object.freeze({
      id: "C5B_SIREN_WITNESS",
      renderer: "l4-l5",
      title: "남겨야 할 그 밤",
      beats: C5B_BEATS,
    }),
    C4C_PAINTER_CLOSING: Object.freeze({
      id: "C4C_PAINTER_CLOSING",
      renderer: "l4-l5",
      title: "사가는 얼굴",
      beats: C4C_BEATS,
    }),
  });

  global.CutsceneBeatsL4L5 = SCENES;
  global.CutsceneRegistry?.registerBeatScenes(SCENES);
  if (typeof module !== "undefined" && module.exports) module.exports = SCENES;
})(typeof window !== "undefined" ? window : globalThis);
