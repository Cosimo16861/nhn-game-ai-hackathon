(function () {
  "use strict";

  function getGrade(score) {
    if (score >= 90) return "S";
    if (score >= 80) return "A";
    if (score >= 65) return "B";
    if (score >= 50) return "C";
    return "D";
  }

  function getMessage(colorResult, finalScore) {
    const blankCount =
      colorResult.hiddenCount - colorResult.filledCount;
    if (blankCount > 0) {
      return (
        `${blankCount.toLocaleString("ko-KR")}칸이 비어 있어 ` +
        "0점으로 반영되었습니다. 계속 수정하면 점수를 높일 수 있습니다."
      );
    }
    if (finalScore >= 90) {
      return "색상, 윤곽선과 지역 구조를 거의 완벽하게 복원했습니다.";
    }
    if (finalScore >= 65) {
      return "주요 특징은 잘 복원했지만 일부 색상이나 형태가 다릅니다.";
    }
    return "원본과 다른 부분이 많습니다. 항목별 점수를 확인하고 다시 도전해 보세요.";
  }

  function combineWithClip(
    visualScore,
    clipAggregate,
    weights = { visual: 0.8, clip: 0.2 },
  ) {
    const configuredVisualWeight = Number(weights.visual);
    const configuredClipWeight = Number(weights.clip);
    const hasValidWeights =
      Number.isFinite(configuredVisualWeight) &&
      Number.isFinite(configuredClipWeight) &&
      configuredVisualWeight >= 0 &&
      configuredClipWeight >= 0 &&
      Math.abs(
        configuredVisualWeight + configuredClipWeight - 1,
      ) < 0.0000001;
    if (
      !Number.isFinite(visualScore) ||
      visualScore < 0 ||
      visualScore > 100 ||
      !hasValidWeights
    ) {
      throw new Error("종합 점수 결합 설정이 올바르지 않습니다.");
    }

    if (
      !clipAggregate ||
      clipAggregate.score === null ||
      clipAggregate.score === undefined
    ) {
      return Object.freeze({
        available: false,
        finalScore: null,
        visualScore,
        clipScore: null,
        reason: "신뢰할 수 있는 CLIP 구역 점수가 없습니다.",
      });
    }

    const clipScore = Number(clipAggregate.score);
    const coverage = Number(clipAggregate.coverage);
    if (
      !Number.isFinite(clipScore) ||
      clipScore < 0 ||
      clipScore > 100 ||
      !Number.isFinite(coverage) ||
      coverage <= 0 ||
      coverage > 100
    ) {
      throw new Error("CLIP 종합 점수 형식이 올바르지 않습니다.");
    }

    const coverageRatio = coverage / 100;
    const effectiveClipWeight =
      configuredClipWeight * coverageRatio;
    const effectiveVisualWeight = 1 - effectiveClipWeight;
    const finalScore =
      visualScore * effectiveVisualWeight +
      clipScore * effectiveClipWeight;

    return Object.freeze({
      available: true,
      finalScore: Math.round(finalScore * 10) / 10,
      visualScore: Math.round(visualScore * 10) / 10,
      clipScore: Math.round(clipScore * 10) / 10,
      coverage: Math.round(coverage * 10) / 10,
      configuredVisualWeight,
      configuredClipWeight,
      effectiveVisualWeight:
        Math.round(effectiveVisualWeight * 1000) / 1000,
      effectiveClipWeight:
        Math.round(effectiveClipWeight * 1000) / 1000,
    });
  }

  function applyHintPenalty(score, hintsUsed, pointsPerHint = 2) {
    const baseScore = Number(score);
    const hintCount = Number(hintsUsed);
    const penaltyUnit = Number(pointsPerHint);
    if (
      !Number.isFinite(baseScore) ||
      baseScore < 0 ||
      baseScore > 100 ||
      !Number.isInteger(hintCount) ||
      hintCount < 0 ||
      !Number.isFinite(penaltyUnit) ||
      penaltyUnit < 0
    ) {
      throw new Error("힌트 감점 설정이 올바르지 않습니다.");
    }
    const hintPenalty = Math.round(hintCount * penaltyUnit * 10) / 10;
    return Object.freeze({
      baseScore: Math.round(baseScore * 10) / 10,
      hintsUsed: hintCount,
      hintPenalty,
      finalScore:
        Math.round(Math.max(0, baseScore - hintPenalty) * 10) / 10,
    });
  }

  function getResultDisclosure(finalScore, passingScore) {
    const score = Number(finalScore);
    const threshold = Number(passingScore);
    if (
      !Number.isFinite(score) ||
      score < 0 ||
      score > 100 ||
      !Number.isFinite(threshold) ||
      threshold < 0 ||
      threshold > 100
    ) {
      throw new Error("결과 공개 기준이 올바르지 않습니다.");
    }
    const cleared = score >= threshold;
    return Object.freeze({
      cleared,
      revealOriginal: cleared,
    });
  }

  function createFailureFeedback(result) {
    const disclosure = getResultDisclosure(
      result.finalScore,
      result.passingScore,
    );
    if (disclosure.cleared) return Object.freeze([]);

    const feedback = [];
    const blankCount =
      Number(result.logical?.hiddenCount || 0) -
      Number(result.logical?.filledCount || 0);
    if (blankCount > 0) {
      feedback.push(
        `아직 색칠하지 않은 칸이 ${Math.max(0, blankCount).toLocaleString("ko-KR")}개 있습니다.`,
      );
    }

    const metrics = [
      {
        score: Number(result.color?.score),
        message: "목격담에 나온 주요 색상을 다시 확인하세요.",
      },
      {
        score: Number(result.edge?.score),
        message: "물체의 바깥 윤곽과 꺾이는 지점을 다시 확인하세요.",
      },
      {
        score: Number(result.structure?.score),
        message: "주변 물체와의 위치·크기 관계를 다시 확인하세요.",
      },
      {
        score: Number(result.palette?.score),
        message: "화면에 제공된 색상 팔레트를 중심으로 사용하세요.",
      },
    ]
      .filter((metric) => Number.isFinite(metric.score))
      .sort((first, second) => first.score - second.score);

    for (const metric of metrics.slice(0, blankCount > 0 ? 1 : 2)) {
      feedback.push(metric.message);
    }

    const reliableRegions = Array.from(result.clip?.regions || [])
      .map((region, clueIndex) => ({
        clueIndex,
        score: Number(region?.normalizedScore),
        reliable: Boolean(region?.reliable),
      }))
      .filter(
        (region) =>
          region.reliable && Number.isFinite(region.score),
      )
      .sort((first, second) => first.score - second.score);
    if (reliableRegions.length > 0) {
      const clueLabel = String.fromCharCode(
        65 + reliableRegions[0].clueIndex,
      );
      feedback.push(
        `목격담 ${clueLabel}와 같은 글자가 표시된 복원 구역을 다시 살펴보세요.`,
      );
    } else {
      feedback.push(
        "목격담 A·B·C와 같은 글자가 표시된 복원 구역을 다시 살펴보세요.",
      );
    }

    return Object.freeze(feedback.slice(0, 3));
  }

  function evaluate(puzzleSource, playerPixels, expandedPixels, config) {
    const logical = window.PixelScoring.calculateColorScore(
      puzzleSource.pixels,
      playerPixels,
      puzzleSource.hiddenMask,
    );
    const analysis =
      window.PixelScoring.calculateRestorationScores(
        puzzleSource.analysisPixels,
        expandedPixels,
        puzzleSource.analysisHiddenMask,
        config.analysisGridSize,
        config.scoreWeights,
      );

    const result = Object.freeze({
      logical,
      color: analysis.color,
      edge: analysis.edge,
      structure: analysis.structure,
      palette: analysis.palette,
      finalScore: analysis.finalScore,
    });

    puzzleSource.logicalColorScore = result.logical;
    puzzleSource.colorScore = result.color;
    puzzleSource.edgeScore = result.edge;
    puzzleSource.structureScore = result.structure;
    puzzleSource.paletteScore = result.palette;
    puzzleSource.finalScore = result.finalScore;
    return result;
  }

  function render(result, elements, elapsedSeconds) {
    const visualWeight = result.combined.effectiveVisualWeight;
    const clipWeight = result.combined.effectiveClipWeight;
    const cleared = result.finalScore >= result.passingScore;
    const formatWeight = (weight) =>
      `${Math.round(weight * 1000) / 10}%`;

    elements.finalScore.textContent = result.finalScore.toFixed(1);
    const stageStars = Number(result.stageStars || 0);
    elements.stars.textContent =
      "★".repeat(stageStars) + "☆".repeat(3 - stageStars);
    elements.stars.setAttribute(
      "aria-label",
      `별점 3개 중 ${stageStars}개`,
    );
    elements.outcome.textContent = cleared
      ? `수사 성공 · 통과 ${result.passingScore}점`
      : `재수사 필요 · 통과 ${result.passingScore}점`;
    elements.outcome.className =
      `case-outcome ${cleared ? "is-cleared" : "is-failed"}`;
    elements.grade.textContent = getGrade(result.finalScore);
    elements.visual.textContent =
      `${result.visualFinalScore.toFixed(1)}점`;
    elements.clip.textContent =
      `${result.clip.score.toFixed(1)}점`;
    elements.clipCoverage.textContent =
      `${result.clip.reliableRegionCount} / ` +
      `${result.clip.totalRegionCount}`;
    elements.color.textContent = `${result.color.score.toFixed(1)}점`;
    elements.edge.textContent = `${result.edge.score.toFixed(1)}점`;
    elements.structure.textContent =
      `${result.structure.score.toFixed(1)}점`;
    elements.palette.textContent =
      `${result.palette.score.toFixed(1)}점`;
    elements.hintsUsed.textContent = `${result.hintsUsed || 0}회`;
    elements.hintPenalty.textContent =
      result.hintPenalty > 0
        ? `-${result.hintPenalty.toFixed(1)}점`
        : "0점";
    elements.time.textContent =
      window.EditorManager.formatTime(elapsedSeconds);
    elements.filled.textContent =
      `${result.logical.filledCount.toLocaleString("ko-KR")} / ` +
      result.logical.hiddenCount.toLocaleString("ko-KR");
    elements.exact.textContent =
      `${result.logical.exactMatchCount.toLocaleString("ko-KR")}칸`;
    elements.delta.textContent =
      result.color.averageDeltaE === null
        ? "-"
        : `ΔE ${result.color.averageDeltaE.toFixed(1)}`;
    elements.visualWeight.textContent = formatWeight(visualWeight);
    elements.clipWeight.textContent = formatWeight(clipWeight);
    elements.colorWeight.textContent = formatWeight(
      visualWeight * result.scoreWeights.color,
    );
    elements.edgeWeight.textContent = formatWeight(
      visualWeight * result.scoreWeights.edge,
    );
    elements.structureWeight.textContent = formatWeight(
      visualWeight * result.scoreWeights.structure,
    );
    elements.paletteWeight.textContent = formatWeight(
      visualWeight * result.scoreWeights.palette,
    );
    elements.message.textContent =
      getMessage(result.logical, result.finalScore) +
      (result.stageClearMessage
        ? ` ${result.stageClearMessage}`
        : "");
  }

  window.ScoreManager = Object.freeze({
    applyHintPenalty,
    combineWithClip,
    createFailureFeedback,
    evaluate,
    getGrade,
    getMessage,
    getResultDisclosure,
    render,
  });
})();
