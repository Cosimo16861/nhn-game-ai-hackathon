(function (global) {
  "use strict";

  const DEFAULTS = Object.freeze({
    passingScore: 60,
    sampleStride: 3,
    lineLuminanceThreshold: 205,
    blankDistanceThreshold: 24,
    colorTolerance: 44,
    weights: Object.freeze({ color: 0.70, coverage: 0.15, clip: 0.15 }),
    fallbackWeights: Object.freeze({ color: 0.82, coverage: 0.18 }),
  });

  function clamp(value, minimum = 0, maximum = 100) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function round(value) {
    return Math.round(value * 10) / 10;
  }

  function luminance(red, green, blue) {
    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
  }

  function weightedRgbDistance(first, second) {
    const redMean = (first[0] + second[0]) / 2;
    const red = first[0] - second[0];
    const green = first[1] - second[1];
    const blue = first[2] - second[2];
    return Math.sqrt(
      (2 + redMean / 256) * red * red +
      4 * green * green +
      (2 + (255 - redMean) / 256) * blue * blue,
    );
  }

  function colorSimilarity(first, second, tolerance = DEFAULTS.colorTolerance) {
    const distance = weightedRgbDistance(first, second);
    const normalized = distance / Math.max(1, tolerance * 2.5);
    return Math.exp(-(normalized * normalized));
  }

  function validateImageData(imageData, label) {
    if (!imageData || !imageData.data || !imageData.width || !imageData.height) {
      throw new Error(`${label} 이미지 데이터가 필요합니다.`);
    }
    if (imageData.data.length !== imageData.width * imageData.height * 4) {
      throw new Error(`${label} 이미지 데이터 크기가 올바르지 않습니다.`);
    }
  }

  function createEvaluationMask(outlineImageData, threshold = DEFAULTS.lineLuminanceThreshold) {
    validateImageData(outlineImageData, "윤곽선");
    const count = outlineImageData.width * outlineImageData.height;
    const mask = new Uint8Array(count);
    const data = outlineImageData.data;
    for (let index = 0; index < count; index += 1) {
      const offset = index * 4;
      const alpha = data[offset + 3];
      const light = luminance(data[offset], data[offset + 1], data[offset + 2]);
      mask[index] = alpha < 16 || light > threshold ? 1 : 0;
    }
    return mask;
  }

  function calculateVisualScores(options) {
    const {
      targetImageData,
      restoredImageData,
      evaluationMask,
      sampleStride = DEFAULTS.sampleStride,
      blankColor = [255, 255, 255],
      blankDistanceThreshold = DEFAULTS.blankDistanceThreshold,
      colorTolerance = DEFAULTS.colorTolerance,
    } = options;
    validateImageData(targetImageData, "완성본");
    validateImageData(restoredImageData, "복원본");
    if (
      targetImageData.width !== restoredImageData.width ||
      targetImageData.height !== restoredImageData.height
    ) {
      throw new Error("완성본과 복원본 해상도가 일치해야 합니다.");
    }

    const count = targetImageData.width * targetImageData.height;
    if (!evaluationMask || evaluationMask.length !== count) {
      throw new Error("채점 마스크 크기가 이미지와 일치해야 합니다.");
    }
    if (!Number.isInteger(sampleStride) || sampleStride < 1) {
      throw new Error("채점 샘플 간격은 1 이상의 정수여야 합니다.");
    }

    const target = targetImageData.data;
    const restored = restoredImageData.data;
    let sampled = 0;
    let filled = 0;
    let similarityTotal = 0;

    for (let y = 0; y < targetImageData.height; y += sampleStride) {
      for (let x = 0; x < targetImageData.width; x += sampleStride) {
        const index = y * targetImageData.width + x;
        if (!evaluationMask[index]) continue;
        const offset = index * 4;
        const targetRgb = [target[offset], target[offset + 1], target[offset + 2]];
        const restoredRgb = [restored[offset], restored[offset + 1], restored[offset + 2]];
        const targetIsPaper = weightedRgbDistance(targetRgb, blankColor) < blankDistanceThreshold;
        const restoredIsPaper = weightedRgbDistance(restoredRgb, blankColor) < blankDistanceThreshold;
        sampled += 1;
        if (targetIsPaper) {
          similarityTotal += colorSimilarity(targetRgb, restoredRgb, colorTolerance);
          filled += 1;
        } else if (!restoredIsPaper) {
          similarityTotal += colorSimilarity(targetRgb, restoredRgb, colorTolerance);
          filled += 1;
        }
      }
    }

    const colorScore = sampled === 0 ? 0 : (similarityTotal / sampled) * 100;
    const coverageScore = sampled === 0 ? 0 : (filled / sampled) * 100;
    return Object.freeze({
      colorScore: round(colorScore),
      coverageScore: round(coverageScore),
      sampledPixels: sampled,
      filledSamples: filled,
    });
  }

  function combineScores(options) {
    const colorScore = clamp(Number(options.colorScore));
    const coverageScore = clamp(Number(options.coverageScore));
    const clipScore = Number(options.clipScore);
    const hasClip = options.clipScore !== null &&
      options.clipScore !== undefined &&
      Number.isFinite(clipScore);
    const weights = options.weights || DEFAULTS.weights;
    const fallbackWeights = options.fallbackWeights || DEFAULTS.fallbackWeights;
    let finalScore;

    if (hasClip) {
      finalScore =
        colorScore * Number(weights.color) +
        coverageScore * Number(weights.coverage) +
        clamp(clipScore) * Number(weights.clip);
    } else {
      finalScore =
        colorScore * Number(fallbackWeights.color) +
        coverageScore * Number(fallbackWeights.coverage);
    }

    return Object.freeze({
      finalScore: round(clamp(finalScore)),
      colorScore: round(colorScore),
      coverageScore: round(coverageScore),
      clipScore: hasClip ? round(clamp(clipScore)) : null,
      clipAvailable: hasClip,
    });
  }

  function classify(score, passingScore = DEFAULTS.passingScore) {
    const value = Number(score);
    if (value >= passingScore) return "pass";
    if (value >= passingScore - 8) return "near";
    if (value >= passingScore - 22) return "partial";
    return "far";
  }

  function evaluate(options) {
    const visual = calculateVisualScores(options);
    const combined = combineScores({
      ...visual,
      clipScore: options.clipScore,
      weights: options.weights,
      fallbackWeights: options.fallbackWeights,
    });
    const passingScore = Number(options.passingScore ?? DEFAULTS.passingScore);
    const tier = classify(combined.finalScore, passingScore);
    return Object.freeze({
      ...visual,
      ...combined,
      passingScore,
      tier,
      cleared: tier === "pass",
    });
  }

  const api = Object.freeze({
    DEFAULTS,
    calculateVisualScores,
    classify,
    colorSimilarity,
    combineScores,
    createEvaluationMask,
    evaluate,
    weightedRgbDistance,
  });

  global.HighResRestorationScoring = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
