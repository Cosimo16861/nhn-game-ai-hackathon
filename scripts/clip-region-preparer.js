(function () {
  "use strict";

  const DEFAULT_OUTPUT_SIZE = 224;
  const DEFAULT_CONTEXT_RATIO = 0.25;

  function getRegionCropBounds(
    regionIndex,
    sourceSize,
    regionsPerSide = 4,
    contextRatio = DEFAULT_CONTEXT_RATIO,
  ) {
    const regionCount = regionsPerSide * regionsPerSide;
    const hasValidOptions =
      Number.isInteger(regionIndex) &&
      regionIndex >= 0 &&
      regionIndex < regionCount &&
      Number.isFinite(sourceSize) &&
      sourceSize > 0 &&
      Number.isInteger(regionsPerSide) &&
      regionsPerSide > 0 &&
      Number.isFinite(contextRatio) &&
      contextRatio >= 0;

    if (!hasValidOptions) {
      throw new Error("CLIP 구역 좌표 설정이 올바르지 않습니다.");
    }

    const regionSize = sourceSize / regionsPerSide;
    const cropSize = Math.min(
      sourceSize,
      regionSize * (1 + contextRatio * 2),
    );
    const regionRow = Math.floor(regionIndex / regionsPerSide);
    const regionColumn = regionIndex % regionsPerSide;
    const centerX = (regionColumn + 0.5) * regionSize;
    const centerY = (regionRow + 0.5) * regionSize;
    const maximumStart = sourceSize - cropSize;

    return Object.freeze({
      x: Math.max(0, Math.min(maximumStart, centerX - cropSize / 2)),
      y: Math.max(0, Math.min(maximumStart, centerY - cropSize / 2)),
      size: cropSize,
      regionSize,
    });
  }

  function createCropCanvas(
    sourceCanvas,
    bounds,
    outputSize,
    createCanvas,
  ) {
    const canvas = createCanvas();
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("CLIP 구역 이미지를 만들 수 없습니다.");
    }

    context.clearRect(0, 0, outputSize, outputSize);
    context.imageSmoothingEnabled = false;
    context.drawImage(
      sourceCanvas,
      bounds.x,
      bounds.y,
      bounds.size,
      bounds.size,
      0,
      0,
      outputSize,
      outputSize,
    );
    return canvas;
  }

  function prepareRegionPairs(options) {
    const {
      referenceCanvas,
      restoredCanvas,
      hiddenRegions,
      clipPrompts,
      regionsPerSide = 4,
      outputSize = DEFAULT_OUTPUT_SIZE,
      contextRatio = DEFAULT_CONTEXT_RATIO,
      createCanvas = () => document.createElement("canvas"),
    } = options;

    const hasValidCanvases =
      referenceCanvas &&
      restoredCanvas &&
      referenceCanvas.width > 0 &&
      referenceCanvas.width === referenceCanvas.height &&
      restoredCanvas.width === referenceCanvas.width &&
      restoredCanvas.height === referenceCanvas.height;
    if (!hasValidCanvases) {
      throw new Error(
        "CLIP 원본·복원 이미지는 크기가 같은 정사각형이어야 합니다.",
      );
    }
    if (
      !Array.isArray(hiddenRegions) ||
      !Array.isArray(clipPrompts) ||
      hiddenRegions.length !== clipPrompts.length ||
      hiddenRegions.length === 0
    ) {
      throw new Error(
        "CLIP 가림 구역과 분석 문장이 같은 개수로 필요합니다.",
      );
    }
    if (!Number.isInteger(outputSize) || outputSize < 1) {
      throw new Error("CLIP 출력 이미지 크기가 올바르지 않습니다.");
    }

    return Object.freeze(
      hiddenRegions.map((regionIndex, index) => {
        const bounds = getRegionCropBounds(
          regionIndex,
          referenceCanvas.width,
          regionsPerSide,
          contextRatio,
        );

        return Object.freeze({
          regionIndex,
          prompt: clipPrompts[index],
          bounds,
          referenceCanvas: createCropCanvas(
            referenceCanvas,
            bounds,
            outputSize,
            createCanvas,
          ),
          restoredCanvas: createCropCanvas(
            restoredCanvas,
            bounds,
            outputSize,
            createCanvas,
          ),
        });
      }),
    );
  }

  window.CLIPRegionPreparer = Object.freeze({
    DEFAULT_CONTEXT_RATIO,
    DEFAULT_OUTPUT_SIZE,
    getRegionCropBounds,
    prepareRegionPairs,
  });
})();
