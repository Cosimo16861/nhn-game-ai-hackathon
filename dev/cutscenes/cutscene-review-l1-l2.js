/**
 * L1 → L2 컷신 검토 하네스.
 *
 * 승인된 장면 데이터와 시각 코드는 더 이상 이 파일에 없다. 제품 모듈이 정본이다.
 *   데이터   src/cutscenes/data/beats-l1-l2.js
 *   렌더러   src/cutscenes/renderers/l1-l2.js
 *   재생기   src/cutscenes/cutscene-player.js
 *
 * ?bundle=q1b 로 B_AFTER_Q1B 를 따로 볼 수 있다. 검토는 진행 상태를 저장하지 않는다.
 */
(function (global) {
  "use strict";

  const params = new URLSearchParams(global.location.search);
  const bundleId = params.get("bundle") === "q1b" ? "B_AFTER_Q1B" : "B_AFTER_Q1A";
  const bundle = global.CompletionBundles.get(bundleId);
  const status = document.querySelector('[data-role="review-status"]');

  const player = global.CutscenePlayer.create({
    artCanvas: document.querySelector('[data-role="art"]'),
    textCanvas: document.querySelector('[data-role="text"]'),
    live: document.querySelector('[data-role="cutscene-live"]'),
    isSceneSeen: () => true,
    onBeat(scene) {
      const index = bundle.sceneIds.indexOf(scene.id) + 1;
      status.textContent = `${scene.title} 재생 중 · ${index}/${bundle.sceneIds.length}`;
    },
    onSceneComplete(sceneId, info) {
      const scene = global.CutsceneBeatsL1L2[sceneId];
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

  global.L1L2CutsceneReview = Object.freeze({
    bundleId,
    sceneIds: bundle.sceneIds.slice(),
    scenes: global.CutsceneBeatsL1L2,
  });

  player.playBundle(bundleId).catch((error) => console.error(error));
})(window);
