/**
 * 엔딩 컷신 검토 하네스.
 *
 * 승인된 장면 데이터와 시각 코드는 더 이상 이 파일에 없다. 제품 모듈이 정본이다.
 *   데이터   src/cutscenes/data/beats-l6-ending.js
 *   렌더러   src/cutscenes/renderers/l6-ending.js
 *   재생기   src/cutscenes/cutscene-player.js
 *
 * ?fixture= 로 후일담 조합을 확인한다. 제품은 같은 조건을 실제 통과 기록으로 판정한다.
 */
(function (global) {
  "use strict";

  // 검토용 후일담 조합. 제품은 ProgressStore 의 통과 기록을 쓴다.
  const FIXTURES = Object.freeze({
    "main-only": Object.freeze([]),
    q3b: Object.freeze(["Q3B_TATTOO"]),
    "q2c-q3c-q4c": Object.freeze(["Q2C_CHILD_ROOM", "Q3C_WAREHOUSE", "Q4C_SQUARE_BET"]),
    "q5b-route": Object.freeze(["Q3C_WAREHOUSE", "Q5B_SIREN"]),
    all: Object.freeze([
      "Q2C_CHILD_ROOM", "Q3B_TATTOO", "Q3C_WAREHOUSE", "Q4C_SQUARE_BET", "Q5B_SIREN",
    ]),
  });

  const params = new URLSearchParams(global.location.search);
  const requested = params.get("fixture") || "main-only";
  const fixtureKey = Object.prototype.hasOwnProperty.call(FIXTURES, requested)
    ? requested : "main-only";
  const cleared = FIXTURES[fixtureKey];
  const status = document.querySelector('[data-role="review-status"]');

  const player = global.CutscenePlayer.create({
    artCanvas: document.querySelector('[data-role="art"]'),
    textCanvas: document.querySelector('[data-role="text"]'),
    live: document.querySelector('[data-role="cutscene-live"]'),
    isSceneSeen: () => true,
    isQuestCleared: (questId) => cleared.includes(questId),
    onBeat(scene, beat, index) {
      status.textContent =
        `${scene.title} · ${fixtureKey} · ${index + 1}/${scene.beats.length}`;
    },
    onBundleComplete() {
      status.textContent = `엔딩 검토 재생 완료 · ${fixtureKey} · R 로 다시 봅니다.`;
    },
    onError(error) {
      console.error(error);
      status.textContent = "컷신 자산을 불러오지 못했습니다: " + error.message;
    },
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === " ") {
      event.preventDefault();
      player.advance();
    }
    if (event.key === "Escape") player.skip();
    if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      player.restart();
    }
  });

  global.EndingCutsceneReview = Object.freeze({
    fixture: fixtureKey,
    cleared: cleared.slice(),
    scenes: global.CutsceneBeatsEnding,
  });

  player.playBundle("B_AFTER_Q6").catch((error) => console.error(error));
})(window);
