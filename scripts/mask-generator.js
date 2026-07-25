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

  function shuffledRegions(random, regionCount) {
    const regions = Array.from({ length: regionCount }, (_, index) => index);

    for (let index = regions.length - 1; index > 0; index--) {
      const target = Math.floor(random() * (index + 1));
      [regions[index], regions[target]] = [
        regions[target],
        regions[index],
      ];
    }

    return regions;
  }

  function getRegion(index, gridSize, regionsPerSide) {
    const regionSize = gridSize / regionsPerSide;
    const row = Math.floor(index / gridSize);
    const column = index % gridSize;
    const regionRow = Math.floor(row / regionSize);
    const regionColumn = Math.floor(column / regionSize);
    return regionRow * regionsPerSide + regionColumn;
  }

  function generateMask(pixels, options) {
    const expectedPixelCount = options.gridSize * options.gridSize;
    const regionCount = options.regionsPerSide * options.regionsPerSide;
    if (pixels.length !== expectedPixelCount) {
      throw new Error("픽셀 수와 격자 크기가 일치하지 않습니다.");
    }
    if (
      !Number.isInteger(options.regionsPerSide) ||
      options.regionsPerSide < 1 ||
      options.gridSize % options.regionsPerSide !== 0
    ) {
      throw new Error("격자 크기는 한 변의 구역 수로 나누어져야 합니다.");
    }
    if (
      options.hiddenRegionCount !== 3 ||
      options.hiddenRegionCount > regionCount
    ) {
      throw new Error("가릴 구역 개수는 3개여야 합니다.");
    }

    let hiddenRegions;
    if (options.hiddenRegions !== undefined) {
      hiddenRegions = Array.from(options.hiddenRegions);
      const hasValidRegions =
        hiddenRegions.length === options.hiddenRegionCount &&
        new Set(hiddenRegions).size === options.hiddenRegionCount &&
        hiddenRegions.every(
          (region) =>
            Number.isInteger(region) && region >= 0 && region < regionCount,
        );
      if (!hasValidRegions) {
        throw new Error("서로 다른 세 개의 유효한 가림 구역이 필요합니다.");
      }
    } else {
      const random = createSeededRandom(options.seed ?? hashPixels(pixels));
      hiddenRegions = shuffledRegions(random, regionCount).slice(
        0,
        options.hiddenRegionCount,
      );
    }
    const hiddenRegionsA = hiddenRegions.slice(0, 1);
    const hiddenRegionsB = hiddenRegions.slice(1, 2);
    const hiddenRegionsC = hiddenRegions.slice(2, 3);
    const hiddenMaskA = pixels.map(
      (_, index) =>
        hiddenRegionsA.includes(
          getRegion(index, options.gridSize, options.regionsPerSide),
        ),
    );
    const hiddenMaskB = pixels.map(
      (_, index) =>
        hiddenRegionsB.includes(
          getRegion(index, options.gridSize, options.regionsPerSide),
        ),
    );
    const hiddenMaskC = pixels.map(
      (_, index) =>
        hiddenRegionsC.includes(
          getRegion(index, options.gridSize, options.regionsPerSide),
        ),
    );
    const hiddenMask = pixels.map(
      (_, index) =>
        hiddenMaskA[index] || hiddenMaskB[index] || hiddenMaskC[index],
    );
    const playerPixels = pixels.map((color, index) =>
      hiddenMask[index] ? null : color,
    );
    const hiddenCountA = hiddenMaskA.filter(Boolean).length;
    const hiddenCountB = hiddenMaskB.filter(Boolean).length;
    const hiddenCountC = hiddenMaskC.filter(Boolean).length;

    return {
      hiddenMaskA,
      hiddenMaskB,
      hiddenMaskC,
      hiddenMask,
      playerPixels,
      hiddenRegions,
      hiddenRegionsA,
      hiddenRegionsB,
      hiddenRegionsC,
      hiddenCountA,
      hiddenCountB,
      hiddenCountC,
      hiddenCount: hiddenCountA + hiddenCountB + hiddenCountC,
      visibleCount:
        pixels.length - hiddenCountA - hiddenCountB - hiddenCountC,
    };
  }

  function generateDualResolutionMasks(
    analysisPixels,
    paintPixels,
    options,
  ) {
    const hasValidResolutionPair =
      Number.isInteger(options.analysisGridSize) &&
      Number.isInteger(options.paintGridSize) &&
      options.analysisGridSize > options.paintGridSize &&
      options.analysisGridSize % options.paintGridSize === 0;

    if (!hasValidResolutionPair) {
      throw new Error(
        "화면용 해상도는 색칠용 해상도의 정수 배수여야 합니다.",
      );
    }

    const commonOptions = {
      regionsPerSide: options.regionsPerSide,
      hiddenRegionCount: options.hiddenRegionCount,
      seed: options.seed,
      hiddenRegions: options.hiddenRegions,
    };
    const analysisMask = generateMask(analysisPixels, {
      ...commonOptions,
      gridSize: options.analysisGridSize,
    });
    const paintMask = generateMask(paintPixels, {
      ...commonOptions,
      gridSize: options.paintGridSize,
      hiddenRegions: analysisMask.hiddenRegions,
    });

    return Object.freeze({
      analysisMask,
      paintMask,
      hiddenRegions: Object.freeze(
        Array.from(analysisMask.hiddenRegions),
      ),
    });
  }

  window.MaskGenerator = Object.freeze({
    generateDualResolutionMasks,
    generateMask,
  });
})();
