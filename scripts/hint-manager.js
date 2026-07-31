(function () {
  "use strict";

  function countHidden(mask) {
    return mask.reduce(
      (count, hidden) => count + (hidden ? 1 : 0),
      0,
    );
  }

  function findLargestMaskIndex(masks) {
    return masks.reduce(
      (largestIndex, mask, index) =>
        countHidden(mask) > countHidden(masks[largestIndex])
          ? index
          : largestIndex,
      0,
    );
  }

  function findDominantColor(pixels, mask) {
    const counts = new Map();
    pixels.forEach((color, index) => {
      if (!mask[index] || !color) return;
      counts.set(color, (counts.get(color) || 0) + 1);
    });
    let dominantColor = null;
    let dominantCount = -1;
    counts.forEach((count, color) => {
      if (count > dominantCount) {
        dominantColor = color;
        dominantCount = count;
      }
    });
    return dominantColor;
  }

  function buildHints(puzzleSource) {
    const caseInfo = puzzleSource?.caseInfo;
    const maximumHints =
      puzzleSource?.difficultyRules?.maxHints ?? 1;
    if (
      !caseInfo ||
      !Array.isArray(puzzleSource.pixels) ||
      !Array.isArray(puzzleSource.hiddenMaskA) ||
      !Array.isArray(puzzleSource.hiddenMaskB) ||
      !Array.isArray(puzzleSource.hiddenMaskC)
    ) {
      throw new Error("힌트를 만들 퍼즐 정보가 올바르지 않습니다.");
    }

    const masks = [
      puzzleSource.hiddenMaskA,
      puzzleSource.hiddenMaskB,
      puzzleSource.hiddenMaskC,
    ];
    const largestIndex = findLargestMaskIndex(masks);
    const groupName = String.fromCharCode(65 + largestIndex);
    const regionNumber =
      Number(caseInfo.hiddenRegions?.[largestIndex]) + 1;
    const dominantColor = findDominantColor(
      puzzleSource.pixels,
      masks[largestIndex],
    );
    const curatedHint =
      caseInfo.hints?.[0] ||
      "목격담에서 반복해서 언급된 색과 큰 형태부터 찾아보세요.";
    const candidates = [
      {
        level: 1,
        title: "수사 방향",
        message: curatedHint,
      },
      {
        level: 2,
        title: "우선 조사 영역",
        message:
          `단서 ${groupName}와 연결된 손상 구역 ${regionNumber}이 ` +
          "가장 넓습니다. 이 영역의 바깥 형태부터 이어 보세요.",
      },
      {
        level: 3,
        title: "주요 색상",
        message: dominantColor
          ? `단서 ${groupName} 영역에서 가장 많이 쓰이는 색은 ${dominantColor.toUpperCase()}입니다.`
          : `단서 ${groupName} 영역의 주변 색을 먼저 비교해 보세요.`,
        color: dominantColor,
      },
    ];

    return Object.freeze(
      candidates.slice(0, maximumHints).map((hint) =>
        Object.freeze(hint),
      ),
    );
  }

  window.HintManager = Object.freeze({
    buildHints,
    findDominantColor,
    findLargestMaskIndex,
  });
})();
