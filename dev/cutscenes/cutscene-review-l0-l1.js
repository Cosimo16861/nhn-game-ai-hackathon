/**
 * L0 → L1 컷신 검토 하네스.
 *
 * 승인된 장면 데이터와 시각 코드는 더 이상 이 파일에 없다. 제품 모듈이 정본이다.
 *   데이터   src/cutscenes/data/beats-l0-l1.js
 *   렌더러   src/cutscenes/renderers/l0-l1.js
 *   재생기   src/cutscenes/cutscene-player.js
 *
 * 검토 페이지는 그 제품 모듈을 그대로 호출한다(GAME_INTEGRATION_PLAN 5.3).
 * 그래야 제품 통합 중 생기는 컷신 시각 회귀를 이 페이지에서 잡을 수 있다.
 * 검토는 진행 상태를 저장하지 않는다. ESC 스킵은 검토 편의를 위해 항상 허용한다.
 */
(function (global) {
  "use strict";

  const BUNDLE_ID = "B_AFTER_Q0";
  const status = document.querySelector('[data-role="review-status"]');
  const bundle = global.CompletionBundles.get(BUNDLE_ID);

  const player = global.CutscenePlayer.create({
    artCanvas: document.querySelector('[data-role="art"]'),
    textCanvas: document.querySelector('[data-role="text"]'),
    live: document.querySelector('[data-role="cutscene-live"]'),
    isSceneSeen: () => true,
    onBeat(scene) {
      const index = bundle.sceneIds.indexOf(scene.id) + 1;
      status.textContent =
        `${scene.title} 재생 중 · ${index}/${bundle.sceneIds.length}`;
    },
    onSceneComplete(sceneId, info) {
      const scene = global.CutsceneBeatsL0L1[sceneId];
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

  player.playBundle(BUNDLE_ID).catch((error) => console.error(error));
})(window);
