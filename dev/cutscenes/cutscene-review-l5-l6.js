/**
 * L5-L6 컷신 검토 하네스.
 *
 * 승인된 장면 데이터와 시각 코드는 더 이상 이 파일에 없다. 제품 모듈이 정본이다.
 *   데이터   src/cutscenes/data/beats-l5-l6.js
 *   렌더러   src/cutscenes/renderers/l5-l6.js
 *   재생기   src/cutscenes/cutscene-player.js
 *
 * ?bundle= 로 묶음을 고르고, ?q5a=complete 로 조건부 맺음을 확인한다.
 * 제품에서는 같은 조건을 실제 통과 기록이 판정한다. 검토는 진행 상태를 저장하지 않는다.
 */
(function (global) {
  "use strict";

  const BUNDLE_BY_KEY = Object.freeze({
    "q5b": "B_AFTER_Q5B",
  });

  const params = new URLSearchParams(global.location.search);
  const bundleId = BUNDLE_BY_KEY[params.get("bundle")] || "B_AFTER_Q5A";
  const bundle = global.CompletionBundles.get(bundleId);
  const status = document.querySelector('[data-role="review-status"]');

  // 검토용 조건부 beat fixture. 제품은 ProgressStore 의 통과 기록을 쓴다.
  const clearedForReview = params.get("q5a") === "complete" ? ["Q5A_DOCK"] : [];

  const player = global.CutscenePlayer.create({
    artCanvas: document.querySelector('[data-role="art"]'),
    textCanvas: document.querySelector('[data-role="text"]'),
    live: document.querySelector('[data-role="cutscene-live"]'),
    isSceneSeen: () => true,
    isQuestCleared: (questId) => clearedForReview.includes(questId),
    onBeat(scene) {
      const index = bundle.sceneIds.indexOf(scene.id) + 1;
      status.textContent = `${scene.title} 재생 중 · ${index}/${bundle.sceneIds.length}`;
    },
    onSceneComplete(sceneId, info) {
      const scene = global.CutsceneBeatsL5L6[sceneId];
      status.textContent = (scene ? scene.title : sceneId) +
        (info.skipped ? " · 스킵됨" : " · 검토 재생 완료");
    },
    onBundleComplete() {
      status.textContent = "묶음 검토 재생 완료 · R 로 다시 봅니다.";
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

  player.playBundle(bundleId).catch((error) => console.error(error));
})(window);
