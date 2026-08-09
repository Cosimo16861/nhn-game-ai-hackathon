/**
 * AssetLoader — 이미지 preload 와 실패 보고.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 5.1, 12장
 *
 * 같은 경로를 두 번 불러오지 않는다. 실패는 삼키지 않고 어떤 경로가 죽었는지
 * 그대로 올려 보낸다 — 화면은 "자산 404 + quest/bundle ID + 재시도"를 보여야 한다.
 */
(function (global) {
  "use strict";

  const cache = new Map();

  function loadImage(source) {
    if (cache.has(source)) return cache.get(source);
    const promise = new Promise((resolve, reject) => {
      const image = new global.Image();
      image.decoding = "async";
      const fail = () => reject(new Error(`자산을 불러오지 못했습니다: ${source}`));
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", fail, { once: true });
      image.src = source;
    }).catch((error) => {
      // 실패한 경로는 캐시에 남기지 않는다. 재시도가 가능해야 한다.
      cache.delete(source);
      throw error;
    });
    cache.set(source, promise);
    return promise;
  }

  /** { key: path } 를 { key: HTMLImageElement } 로. 하나라도 실패하면 거부한다. */
  function loadImageMap(manifest) {
    const entries = Object.entries(manifest || {});
    return Promise.all(
      entries.map(([key, source]) => loadImage(source).then((image) => [key, image])),
    ).then((loaded) => Object.fromEntries(loaded));
  }

  function mark(name) {
    try {
      global.performance?.mark?.(name);
    } catch (error) {
      /* 계측 실패가 플레이를 막지 않는다. */
    }
  }

  global.AssetLoader = Object.freeze({
    loadImage,
    loadImageMap,
    mark,
    isCached: (source) => cache.has(source),
    forget: (source) => cache.delete(source),
    clear: () => cache.clear(),
  });
})(typeof window !== "undefined" ? window : globalThis);
