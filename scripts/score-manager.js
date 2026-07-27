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
    elements.finalScore.textContent = result.finalScore.toFixed(1);
    elements.grade.textContent = getGrade(result.finalScore);
    elements.color.textContent = `${result.color.score.toFixed(1)}점`;
    elements.edge.textContent = `${result.edge.score.toFixed(1)}점`;
    elements.structure.textContent =
      `${result.structure.score.toFixed(1)}점`;
    elements.palette.textContent =
      `${result.palette.score.toFixed(1)}점`;
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
    elements.message.textContent =
      getMessage(result.logical, result.finalScore);
  }

  window.ScoreManager = Object.freeze({
    evaluate,
    getGrade,
    getMessage,
    render,
  });
})();
