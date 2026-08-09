(function (global) {
  "use strict";

  const DEFAULT_CONFIG = Object.freeze({
    passingScore: 80,
    minimumRegionScore: 65,
    minimumRegionCoverage: 0.8,
    scoreWeights: Object.freeze({
      color: 0.5,
      edge: 0.3,
      structure: 0.15,
      palette: 0.05,
    }),
  });

  function round(value) {
    return Math.round(value * 10) / 10;
  }

  function validateWeightTotal(values, message) {
    const total = values.reduce((sum, value) => sum + Number(value), 0);
    if (!Number.isFinite(total) || Math.abs(total - 1) > 0.000001) {
      throw new Error(message);
    }
  }

  function evaluate(options) {
    const targetPixels = options.targetPixels;
    const playerPixels = options.playerPixels;
    const regionMasks = options.regionMasks;
    const regionDefinitions = options.regionDefinitions;
    const gridSize = Number(options.gridSize);
    const config = Object.assign({}, DEFAULT_CONFIG, options.config || {});
    const scoring = options.scoring || global.PixelScoring;

    if (!scoring?.calculateRestorationScores) {
      throw new Error("픽셀 유사도 계산 엔진이 준비되지 않았습니다.");
    }
    const expectedLength = gridSize * gridSize;
    if (
      !Number.isInteger(gridSize) ||
      gridSize <= 0 ||
      targetPixels?.length !== expectedLength ||
      playerPixels?.length !== expectedLength
    ) {
      throw new Error("몽타주 채점 격자와 픽셀 배열이 일치하지 않습니다.");
    }
    if (!Array.isArray(regionDefinitions) || regionDefinitions.length === 0) {
      throw new Error("채점할 부위 정의가 필요합니다.");
    }
    validateWeightTotal(
      regionDefinitions.map((region) => region.weight),
      "부위별 채점 비중의 합은 1이어야 합니다.",
    );

    let totalFilled = 0;
    let totalPixels = 0;
    const regions = regionDefinitions.map((region) => {
      const mask = regionMasks?.[region.id];
      if (!mask || mask.length !== expectedLength) {
        throw new Error(`${region.label} 부위 마스크가 올바르지 않습니다.`);
      }
      const scores = scoring.calculateRestorationScores(
        targetPixels,
        playerPixels,
        mask,
        gridSize,
        config.scoreWeights,
      );
      const pixelCount = scores.color.hiddenCount;
      const filledCount = scores.color.filledCount;
      const coverage = pixelCount === 0 ? 1 : filledCount / pixelCount;
      const passed =
        scores.finalScore >= config.minimumRegionScore &&
        coverage >= config.minimumRegionCoverage;
      totalFilled += filledCount;
      totalPixels += pixelCount;
      return Object.freeze({
        id: region.id,
        label: region.label,
        weight: region.weight,
        pixelCount,
        filledCount,
        coverage,
        score: scores.finalScore,
        passed,
        color: scores.color.score,
        edge: scores.edge.score,
        structure: scores.structure.score,
        palette: scores.palette.score,
      });
    });

    const finalScore = round(
      regions.reduce(
        (total, region) => total + region.score * region.weight,
        0,
      ),
    );
    const coverage = totalPixels === 0 ? 1 : totalFilled / totalPixels;
    const passed =
      finalScore >= config.passingScore &&
      regions.every((region) => region.passed);
    const weakestRegion = regions
      .slice()
      .sort((first, second) => {
        const firstGate = Math.min(
          first.score / config.minimumRegionScore,
          first.coverage / config.minimumRegionCoverage,
        );
        const secondGate = Math.min(
          second.score / config.minimumRegionScore,
          second.coverage / config.minimumRegionCoverage,
        );
        return firstGate - secondGate;
      })[0];

    return Object.freeze({
      finalScore,
      passingScore: config.passingScore,
      minimumRegionScore: config.minimumRegionScore,
      minimumRegionCoverage: config.minimumRegionCoverage,
      coverage,
      totalFilled,
      totalPixels,
      passed,
      weakestRegion,
      regions: Object.freeze(regions),
    });
  }

  const api = Object.freeze({ DEFAULT_CONFIG, evaluate });
  global.MontageScoring = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
