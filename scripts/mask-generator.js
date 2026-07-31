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

  function createIrregularRegionTester(
    gridSize,
    regionsPerSide,
    regionIndex,
    seed,
    insetBase,
    insetVariation,
  ) {
    const regionSize = gridSize / regionsPerSide;
    const regionRow = Math.floor(regionIndex / regionsPerSide);
    const regionColumn = regionIndex % regionsPerSide;
    const random = createSeededRandom(
      (seed ^ Math.imul(regionIndex + 1, 0x9e3779b1)) >>> 0,
    );
    const leftPhase = random() * Math.PI * 2;
    const rightPhase = random() * Math.PI * 2;
    const topPhase = random() * Math.PI * 2;
    const bottomPhase = random() * Math.PI * 2;
    const leftFrequency = 1.4 + random() * 1.2;
    const rightFrequency = 1.4 + random() * 1.2;
    const topFrequency = 1.4 + random() * 1.2;
    const bottomFrequency = 1.4 + random() * 1.2;

    function edgeInset(position, phase, frequency) {
      const wave =
        0.5 + 0.5 * Math.sin(position * Math.PI * 2 * frequency + phase);
      return Math.round(
        regionSize * (insetBase + wave * insetVariation),
      );
    }

    return function isHidden(index) {
      if (getRegion(index, gridSize, regionsPerSide) !== regionIndex) {
        return false;
      }

      const row = Math.floor(index / gridSize);
      const column = index % gridSize;
      const localRow = row - regionRow * regionSize;
      const localColumn = column - regionColumn * regionSize;
      const rowPosition = (localRow + 0.5) / regionSize;
      const columnPosition = (localColumn + 0.5) / regionSize;
      const left = edgeInset(
        rowPosition,
        leftPhase,
        leftFrequency,
      );
      const right = edgeInset(
        rowPosition,
        rightPhase,
        rightFrequency,
      );
      const top = edgeInset(
        columnPosition,
        topPhase,
        topFrequency,
      );
      const bottom = edgeInset(
        columnPosition,
        bottomPhase,
        bottomFrequency,
      );

      return (
        localColumn >= left &&
        localColumn < regionSize - right &&
        localRow >= top &&
        localRow < regionSize - bottom
      );
    };
  }

  function createMaskResult(
    pixels,
    hiddenRegions,
    hiddenMaskA,
    hiddenMaskB,
    hiddenMaskC,
    maskStyle,
  ) {
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
      hiddenRegionsA: hiddenRegions.slice(0, 1),
      hiddenRegionsB: hiddenRegions.slice(1, 2),
      hiddenRegionsC: hiddenRegions.slice(2, 3),
      hiddenCountA,
      hiddenCountB,
      hiddenCountC,
      hiddenCount: hiddenCountA + hiddenCountB + hiddenCountC,
      visibleCount:
        pixels.length - hiddenCountA - hiddenCountB - hiddenCountC,
      maskStyle,
    };
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

    const maskStyle = options.maskStyle || "irregular";
    if (!["block", "irregular"].includes(maskStyle)) {
      throw new Error("가림 형태는 block 또는 irregular이어야 합니다.");
    }
    const maskInsetBase = Number(options.maskInsetBase ?? 0.06);
    const maskInsetVariation = Number(
      options.maskInsetVariation ?? 0.1,
    );
    if (
      !Number.isFinite(maskInsetBase) ||
      !Number.isFinite(maskInsetVariation) ||
      maskInsetBase < 0 ||
      maskInsetVariation < 0 ||
      maskInsetBase + maskInsetVariation >= 0.45
    ) {
      throw new Error("불규칙 가림의 가장자리 설정이 올바르지 않습니다.");
    }

    const maskSeed = options.seed ?? hashPixels(pixels);
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
      const random = createSeededRandom(maskSeed);
      hiddenRegions = shuffledRegions(random, regionCount).slice(
        0,
        options.hiddenRegionCount,
      );
    }
    const regionTesters = hiddenRegions.map((regionIndex) =>
      maskStyle === "irregular"
        ? createIrregularRegionTester(
            options.gridSize,
            options.regionsPerSide,
            regionIndex,
            maskSeed,
            maskInsetBase,
            maskInsetVariation,
          )
        : (index) =>
            getRegion(
              index,
              options.gridSize,
              options.regionsPerSide,
            ) === regionIndex,
    );
    const hiddenMasks = regionTesters.map((tester) =>
      pixels.map((_, index) => tester(index)),
    );

    return createMaskResult(
      pixels,
      hiddenRegions,
      hiddenMasks[0],
      hiddenMasks[1],
      hiddenMasks[2],
      maskStyle,
    );
  }

  function upscaleMask(mask, sourceSize, targetSize) {
    const scale = targetSize / sourceSize;
    return Array.from(
      { length: targetSize * targetSize },
      (_, index) => {
        const targetRow = Math.floor(index / targetSize);
        const targetColumn = index % targetSize;
        const sourceRow = Math.floor(targetRow / scale);
        const sourceColumn = Math.floor(targetColumn / scale);
        return mask[sourceRow * sourceSize + sourceColumn];
      },
    );
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
      seed: options.seed ?? hashPixels(paintPixels),
      hiddenRegions: options.hiddenRegions,
      maskStyle: options.maskStyle || "irregular",
      maskInsetBase: options.maskInsetBase,
      maskInsetVariation: options.maskInsetVariation,
    };
    const paintMask = generateMask(paintPixels, {
      ...commonOptions,
      gridSize: options.paintGridSize,
    });
    const scale =
      options.analysisGridSize / options.paintGridSize;
    const analysisHiddenMaskA = upscaleMask(
      paintMask.hiddenMaskA,
      options.paintGridSize,
      options.analysisGridSize,
    );
    const analysisHiddenMaskB = upscaleMask(
      paintMask.hiddenMaskB,
      options.paintGridSize,
      options.analysisGridSize,
    );
    const analysisHiddenMaskC = upscaleMask(
      paintMask.hiddenMaskC,
      options.paintGridSize,
      options.analysisGridSize,
    );
    const analysisMask = createMaskResult(
      analysisPixels,
      Array.from(paintMask.hiddenRegions),
      analysisHiddenMaskA,
      analysisHiddenMaskB,
      analysisHiddenMaskC,
      commonOptions.maskStyle,
    );

    return Object.freeze({
      analysisMask,
      paintMask,
      scale,
      hiddenRegions: Object.freeze(
        Array.from(paintMask.hiddenRegions),
      ),
    });
  }

  window.MaskGenerator = Object.freeze({
    generateDualResolutionMasks,
    generateMask,
  });
})();
