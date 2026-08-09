/**
 * 증거판 화면 어댑터.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 8장
 *
 * BranchMap 의 시각 디자인은 그대로 쓴다. 개발 진행 bar 는 여기에 없다
 * (dev/workbench/progress-test.html 전용).
 *
 * dispose 에서 1초 interval 과 store 구독을 반드시 해제한다.
 */
(function (global) {
  "use strict";

  function mount(container, options) {
    const stage = container.querySelector('[data-role="board-stage"]');
    const progressStore = options.progressStore;
    const artworkStore = options.artworkStore;
    const startedAt = Date.now();

    let timer = 0;
    let unsubscribe = null;
    let disposed = false;
    const thumbnailUrls = [];

    function clock() {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const pad = (value) => String(value).padStart(2, "0");
      return `${pad(Math.floor(elapsed / 3600))}:` +
        `${pad(Math.floor(elapsed / 60) % 60)}:${pad(elapsed % 60)}`;
    }

    function draw() {
      if (disposed) return;
      global.BranchMap.render(progressStore, { clock: clock() });
    }

    global.BranchMap.mount(stage, {
      reserveHeight: options.reserveHeight ?? 0,
      onSelect(nodeId) {
        if (disposed) return;
        options.onSelect?.(nodeId);
      },
    });

    unsubscribe = progressStore.subscribe(draw);
    draw();
    timer = global.setInterval(draw, 1000);

    /**
     * 완료 카드의 썸네일은 플레이어가 실제로 칠한 그림이다.
     * 결과가 없는 구 세이브는 BranchMap 의 기본 표현을 그대로 둔다.
     */
    async function refreshThumbnails() {
      if (!artworkStore) return;
      for (const questId of progressStore.getSnapshot().clearedQuestIds) {
        try {
          const record = await artworkStore.loadThumbnail(questId);
          if (disposed || !record?.blob) continue;
          const bitmap = await createThumbnailImage(record.blob);
          if (disposed || !bitmap) continue;
          global.BranchMap.setThumbnail(questId, bitmap);
        } catch (error) {
          console.warn("[board-screen] 썸네일을 불러오지 못했습니다.", questId, error);
        }
      }
    }

    function createThumbnailImage(blob) {
      if (typeof global.createImageBitmap === "function" && blob instanceof global.Blob) {
        return global.createImageBitmap(blob);
      }
      if (!(blob instanceof global.Blob)) return Promise.resolve(null);
      return new Promise((resolve) => {
        const url = global.URL.createObjectURL(blob);
        thumbnailUrls.push(url);
        const image = new global.Image();
        image.addEventListener("load", () => resolve(image), { once: true });
        image.addEventListener("error", () => resolve(null), { once: true });
        image.src = url;
      });
    }

    refreshThumbnails();

    return Object.freeze({
      refresh: draw,
      refreshThumbnails,
      dispose() {
        disposed = true;
        if (timer) global.clearInterval(timer);
        timer = 0;
        unsubscribe?.();
        unsubscribe = null;
        thumbnailUrls.forEach((url) => global.URL.revokeObjectURL(url));
        thumbnailUrls.length = 0;
        // BranchMap 이 붙인 resize 리스너까지 함께 해제한다.
        global.BranchMap.unmount();
        stage.replaceChildren();
      },
    });
  }

  global.BoardScreen = Object.freeze({ mount });
})(typeof window !== "undefined" ? window : globalThis);
