/**
 * 부팅 — 저장소를 만들고 Director 에 넘긴다.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 6장
 *
 * 여기서만 전역 조립을 한다. 화면 코드는 서로를 직접 참조하지 않는다.
 */
(function (global) {
  "use strict";

  function boot() {
    const progressStore = global.ProgressStoreFactory.create();
    global.ProgressMigration.migrateIfNeeded(progressStore);

    const shell = global.GameShell.create(global.document.body);

    const artworkStore = global.ArtworkStoreFactory.create({
      onDegraded: (reason) => {
        console.warn("[bootstrap] 그림 저장이 강등되었습니다:", reason);
        shell.setLoading(false);
      },
    });

    const director = global.GameDirector.create({ shell, progressStore, artworkStore });

    // 디버그 API 는 제품 UI 에 노출하지 않는다. 콘솔·E2E 에서만 쓴다.
    global.HavenGame = Object.freeze({
      director,
      progressStore,
      artworkStore,
      shell,
      bundles: global.CompletionBundles,
      graph: global.QuestGraph,
    });

    director.boot();
    return global.HavenGame;
  }

  if (global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})(typeof window !== "undefined" ? window : globalThis);
