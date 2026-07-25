(function () {
  "use strict";

  function hashPixels(pixels) {
    let hash = 2166136261;

    pixels.forEach((color) => {
      for (let index = 0; index < color.length; index++) {
        hash ^= color.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
    });

    return hash >>> 0;
  }

  function createSeededRandom(seed) {
    let state = seed >>> 0;

    return function random() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffledQuadrants(random) {
    const quadrants = [0, 1, 2, 3];

    for (let index = quadrants.length - 1; index > 0; index--) {
      const target = Math.floor(random() * (index + 1));
      [quadrants[index], quadrants[target]] = [
        quadrants[target],
        quadrants[index],
      ];
    }

    return quadrants;
  }

  function getQuadrant(index, gridSize) {
    const half = gridSize / 2;
    const row = Math.floor(index / gridSize);
    const column = index % gridSize;
    const bottom = row >= half ? 2 : 0;
    const right = column >= half ? 1 : 0;
    return bottom + right;
  }

  function generateMask(pixels, options) {
    const expectedPixelCount = options.gridSize * options.gridSize;
    if (pixels.length !== expectedPixelCount) {
      throw new Error("픽셀 수와 격자 크기가 일치하지 않습니다.");
    }
    if (options.gridSize % 2 !== 0) {
      throw new Error("사분면 분할에는 짝수 격자 크기가 필요합니다.");
    }
    if (options.hiddenQuadrantCount !== 2) {
      throw new Error("가릴 사분면 개수는 2개여야 합니다.");
    }

    const random = createSeededRandom(options.seed ?? hashPixels(pixels));
    const hiddenQuadrants = shuffledQuadrants(random).slice(
      0,
      options.hiddenQuadrantCount,
    );
    const hiddenMaskA = pixels.map(
      (_, index) => getQuadrant(index, options.gridSize) === hiddenQuadrants[0],
    );
    const hiddenMaskB = pixels.map(
      (_, index) => getQuadrant(index, options.gridSize) === hiddenQuadrants[1],
    );
    const hiddenMask = pixels.map(
      (_, index) => hiddenMaskA[index] || hiddenMaskB[index],
    );
    const playerPixels = pixels.map((color, index) =>
      hiddenMask[index] ? null : color,
    );
    const hiddenCountA = hiddenMaskA.filter(Boolean).length;
    const hiddenCountB = hiddenMaskB.filter(Boolean).length;

    return {
      hiddenMaskA,
      hiddenMaskB,
      hiddenMask,
      playerPixels,
      hiddenQuadrants,
      hiddenCountA,
      hiddenCountB,
      hiddenCount: hiddenCountA + hiddenCountB,
      visibleCount: pixels.length - hiddenCountA - hiddenCountB,
    };
  }

  window.MaskGenerator = Object.freeze({
    generateMask,
  });
})();
