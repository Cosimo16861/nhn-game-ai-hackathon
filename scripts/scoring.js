(function () {
  "use strict";

  function hexToRgb(hex) {
    const normalized = hex.replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(normalized)) {
      throw new Error(`올바르지 않은 색상 값입니다: ${hex}`);
    }

    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
    };
  }

  function toLinearRgb(value) {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  }

  function rgbToLab(rgb) {
    const red = toLinearRgb(rgb.r);
    const green = toLinearRgb(rgb.g);
    const blue = toLinearRgb(rgb.b);

    const x = (red * 0.4124 + green * 0.3576 + blue * 0.1805) / 0.95047;
    const y = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    const z = (red * 0.0193 + green * 0.1192 + blue * 0.9505) / 1.08883;

    function transform(value) {
      return value > 0.008856
        ? Math.cbrt(value)
        : 7.787 * value + 16 / 116;
    }

    const transformedX = transform(x);
    const transformedY = transform(y);
    const transformedZ = transform(z);

    return {
      l: 116 * transformedY - 16,
      a: 500 * (transformedX - transformedY),
      b: 200 * (transformedY - transformedZ),
    };
  }

  function deltaE76(first, second) {
    return Math.sqrt(
      (first.l - second.l) ** 2 +
        (first.a - second.a) ** 2 +
        (first.b - second.b) ** 2,
    );
  }

  function colorSimilarity(targetColor, playerColor) {
    const targetLab = rgbToLab(hexToRgb(targetColor));
    const playerLab = rgbToLab(hexToRgb(playerColor));
    const delta = deltaE76(targetLab, playerLab);

    return {
      delta,
      similarity: Math.exp(-((delta / 20) ** 2)),
    };
  }

  function calculateColorScore(targetPixels, playerPixels, hiddenMask) {
    if (
      targetPixels.length !== playerPixels.length ||
      targetPixels.length !== hiddenMask.length
    ) {
      throw new Error("채점 배열의 길이가 일치하지 않습니다.");
    }

    let totalSimilarity = 0;
    let hiddenCount = 0;
    let filledCount = 0;
    let exactMatchCount = 0;
    let totalFilledDelta = 0;

    targetPixels.forEach((targetColor, index) => {
      if (!hiddenMask[index]) return;
      hiddenCount++;

      const playerColor = playerPixels[index];
      if (!playerColor) return;

      filledCount++;
      if (targetColor.toLowerCase() === playerColor.toLowerCase()) {
        exactMatchCount++;
      }

      const comparison = colorSimilarity(targetColor, playerColor);
      totalSimilarity += comparison.similarity;
      totalFilledDelta += comparison.delta;
    });

    const score =
      hiddenCount === 0 ? 100 : (totalSimilarity / hiddenCount) * 100;

    return {
      score: Math.round(score * 10) / 10,
      hiddenCount,
      filledCount,
      exactMatchCount,
      averageDeltaE:
        filledCount === 0 ? null : totalFilledDelta / filledCount,
    };
  }

  function createEdgeMap(pixels, gridSize, evaluationMask) {
    return pixels.map((color, index) => {
      if (!evaluationMask[index] || !color) return false;

      const row = Math.floor(index / gridSize);
      const column = index % gridSize;
      const neighbors = [];
      if (row > 0) neighbors.push(index - gridSize);
      if (row < gridSize - 1) neighbors.push(index + gridSize);
      if (column > 0) neighbors.push(index - 1);
      if (column < gridSize - 1) neighbors.push(index + 1);

      return neighbors.some(
        (neighborIndex) =>
          pixels[neighborIndex] &&
          pixels[neighborIndex].toLowerCase() !== color.toLowerCase(),
      );
    });
  }

  function hasNearbyEdge(edgeMap, index, gridSize, radius) {
    const row = Math.floor(index / gridSize);
    const column = index % gridSize;

    for (let rowOffset = -radius; rowOffset <= radius; rowOffset++) {
      for (
        let columnOffset = -radius;
        columnOffset <= radius;
        columnOffset++
      ) {
        const targetRow = row + rowOffset;
        const targetColumn = column + columnOffset;
        if (
          targetRow < 0 ||
          targetRow >= gridSize ||
          targetColumn < 0 ||
          targetColumn >= gridSize
        ) {
          continue;
        }
        if (edgeMap[targetRow * gridSize + targetColumn]) return true;
      }
    }

    return false;
  }

  function calculateEdgeScore(
    targetPixels,
    playerPixels,
    hiddenMask,
    gridSize,
  ) {
    const expectedPixelCount = gridSize * gridSize;
    if (
      targetPixels.length !== expectedPixelCount ||
      playerPixels.length !== expectedPixelCount ||
      hiddenMask.length !== expectedPixelCount
    ) {
      throw new Error("윤곽선 채점 배열과 격자 크기가 일치하지 않습니다.");
    }

    const targetEdges = createEdgeMap(targetPixels, gridSize, hiddenMask);
    const playerEdges = createEdgeMap(playerPixels, gridSize, hiddenMask);
    const targetEdgeIndices = [];
    const playerEdgeIndices = [];
    let hiddenCount = 0;
    let filledCount = 0;

    hiddenMask.forEach((hidden, index) => {
      if (!hidden) return;
      hiddenCount++;
      if (playerPixels[index]) filledCount++;
      if (targetEdges[index]) targetEdgeIndices.push(index);
      if (playerEdges[index]) playerEdgeIndices.push(index);
    });

    const matchedTargetEdges = targetEdgeIndices.filter((index) =>
      hasNearbyEdge(playerEdges, index, gridSize, 1),
    ).length;
    const matchedPlayerEdges = playerEdgeIndices.filter((index) =>
      hasNearbyEdge(targetEdges, index, gridSize, 1),
    ).length;
    const recall =
      targetEdgeIndices.length === 0
        ? playerEdgeIndices.length === 0
          ? 1
          : 0
        : matchedTargetEdges / targetEdgeIndices.length;
    const precision =
      playerEdgeIndices.length === 0
        ? targetEdgeIndices.length === 0
          ? 1
          : 0
        : matchedPlayerEdges / playerEdgeIndices.length;
    const f1 =
      precision + recall === 0
        ? 0
        : (2 * precision * recall) / (precision + recall);
    const coverage = hiddenCount === 0 ? 1 : filledCount / hiddenCount;
    const score = f1 * coverage * 100;

    return {
      score: Math.round(score * 10) / 10,
      precision,
      recall,
      coverage,
      targetEdgeCount: targetEdgeIndices.length,
      playerEdgeCount: playerEdgeIndices.length,
      matchedTargetEdgeCount: matchedTargetEdges,
    };
  }

  function calculateStructureScore(
    targetPixels,
    playerPixels,
    hiddenMask,
    gridSize,
  ) {
    const expectedPixelCount = gridSize * gridSize;
    if (
      targetPixels.length !== expectedPixelCount ||
      playerPixels.length !== expectedPixelCount ||
      hiddenMask.length !== expectedPixelCount
    ) {
      throw new Error("구조 채점 배열과 격자 크기가 일치하지 않습니다.");
    }

    const targetLightness = targetPixels.map(
      (color) => rgbToLab(hexToRgb(color)).l,
    );
    const playerLightness = playerPixels.map((color) =>
      color ? rgbToLab(hexToRgb(color)).l : null,
    );
    let hiddenCount = 0;
    let filledCount = 0;
    let totalSimilarity = 0;

    hiddenMask.forEach((hidden, index) => {
      if (!hidden) return;
      hiddenCount++;
      if (playerLightness[index] === null) return;
      filledCount++;

      const row = Math.floor(index / gridSize);
      const column = index % gridSize;
      let neighborCount = 0;
      let localSimilarity = 0;

      for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
          if (rowOffset === 0 && columnOffset === 0) continue;

          const neighborRow = row + rowOffset;
          const neighborColumn = column + columnOffset;
          if (
            neighborRow < 0 ||
            neighborRow >= gridSize ||
            neighborColumn < 0 ||
            neighborColumn >= gridSize
          ) {
            continue;
          }

          neighborCount++;
          const neighborIndex = neighborRow * gridSize + neighborColumn;
          if (playerLightness[neighborIndex] === null) continue;

          const targetDifference =
            targetLightness[neighborIndex] - targetLightness[index];
          const playerDifference =
            playerLightness[neighborIndex] - playerLightness[index];
          const differenceError = Math.abs(
            targetDifference - playerDifference,
          );
          localSimilarity += Math.exp(-((differenceError / 18) ** 2));
        }
      }

      totalSimilarity +=
        neighborCount === 0 ? 1 : localSimilarity / neighborCount;
    });

    const score =
      hiddenCount === 0 ? 100 : (totalSimilarity / hiddenCount) * 100;

    return {
      score: Math.round(score * 10) / 10,
      hiddenCount,
      filledCount,
      coverage: hiddenCount === 0 ? 1 : filledCount / hiddenCount,
    };
  }

  window.PixelScoring = Object.freeze({
    calculateColorScore,
    calculateEdgeScore,
    calculateStructureScore,
  });
})();
