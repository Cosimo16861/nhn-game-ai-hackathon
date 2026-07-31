(function () {
  "use strict";

  const DEFAULT_MINIMUM_REFERENCE_MARGIN = 0.05;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function roundScore(value) {
    return Math.round(value * 10) / 10;
  }

  function getPromptEvidence(rankings, prompt) {
    if (!Array.isArray(rankings) || rankings.length < 2) {
      throw new Error("CLIP 문장별 결과가 두 개 이상 필요합니다.");
    }

    const normalizedPrompt = String(prompt || "").trim();
    const scores = rankings.map((result) => ({
      label: String(result?.label || "").trim(),
      score: Number(result?.score),
    }));
    if (
      !normalizedPrompt ||
      scores.some(
        (result) =>
          !result.label ||
          !Number.isFinite(result.score) ||
          result.score < 0 ||
          result.score > 1,
      )
    ) {
      throw new Error("CLIP 문장별 결과 형식이 올바르지 않습니다.");
    }

    const positive = scores.find(
      (result) => result.label === normalizedPrompt,
    );
    if (!positive) {
      throw new Error("CLIP 결과에서 정답 문장을 찾을 수 없습니다.");
    }

    const strongestDistractor = Math.max(
      ...scores
        .filter((result) => result.label !== normalizedPrompt)
        .map((result) => result.score),
    );

    return Object.freeze({
      prompt: normalizedPrompt,
      promptScore: positive.score,
      strongestDistractor,
      margin: positive.score - strongestDistractor,
    });
  }

  function normalizeRegionScore(options) {
    const {
      regionIndex,
      prompt,
      referenceRankings,
      restoredRankings,
      minimumReferenceMargin =
        DEFAULT_MINIMUM_REFERENCE_MARGIN,
    } = options;
    if (
      !Number.isFinite(minimumReferenceMargin) ||
      minimumReferenceMargin < 0 ||
      minimumReferenceMargin >= 1
    ) {
      throw new Error("CLIP 신뢰도 기준이 올바르지 않습니다.");
    }

    const reference = getPromptEvidence(referenceRankings, prompt);
    const restored = getPromptEvidence(restoredRankings, prompt);
    const reliable =
      reference.margin >= minimumReferenceMargin;
    const normalizedScore = reliable
      ? roundScore(
          clamp(restored.margin / reference.margin, 0, 1) * 100,
        )
      : null;

    return Object.freeze({
      regionIndex,
      prompt: reference.prompt,
      reliable,
      normalizedScore,
      referenceScore: roundScore(reference.promptScore * 100),
      restoredScore: roundScore(restored.promptScore * 100),
      referenceMargin: roundScore(reference.margin * 100),
      restoredMargin: roundScore(restored.margin * 100),
    });
  }

  function aggregateRegionScores(regionScores) {
    if (!Array.isArray(regionScores) || regionScores.length === 0) {
      throw new Error("집계할 CLIP 구역 점수가 필요합니다.");
    }

    const reliableScores = regionScores.filter(
      (region) =>
        region?.reliable &&
        Number.isFinite(region.normalizedScore),
    );
    const score =
      reliableScores.length === 0
        ? null
        : roundScore(
            reliableScores.reduce(
              (sum, region) => sum + region.normalizedScore,
              0,
            ) / reliableScores.length,
          );

    return Object.freeze({
      score,
      reliableRegionCount: reliableScores.length,
      totalRegionCount: regionScores.length,
      coverage: roundScore(
        (reliableScores.length / regionScores.length) * 100,
      ),
      regions: Object.freeze(Array.from(regionScores)),
    });
  }

  window.CLIPScoreNormalizer = Object.freeze({
    DEFAULT_MINIMUM_REFERENCE_MARGIN,
    aggregateRegionScores,
    getPromptEvidence,
    normalizeRegionScore,
  });
})();
