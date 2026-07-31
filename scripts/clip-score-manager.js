(function () {
  "use strict";

  function create({ analyzer } = {}) {
    const clipAnalyzer =
      analyzer || window.CLIPAnalyzer.createAnalyzer();
    const referenceCache = new Map();

    function preload(onProgress) {
      return clipAnalyzer.load(onProgress);
    }

    async function evaluate(options) {
      const {
        referenceCanvas,
        restoredCanvas,
        hiddenRegions,
        clipPrompts,
        visualScore,
        regionsPerSide = 4,
        combinedWeights,
        referenceCacheKey,
        onProgress,
      } = options;
      const pairs = window.CLIPRegionPreparer.prepareRegionPairs({
        referenceCanvas,
        restoredCanvas,
        hiddenRegions,
        clipPrompts,
        regionsPerSide,
      });
      const regionScores = [];
      const cacheKey = referenceCacheKey
        ? `${referenceCacheKey}\u0000${clipPrompts.join("\u0000")}`
        : null;
      let cachedReferences = cacheKey
        ? referenceCache.get(cacheKey)
        : null;
      if (!cachedReferences && cacheKey) {
        cachedReferences = new Map();
        referenceCache.set(cacheKey, cachedReferences);
      }

      for (let index = 0; index < pairs.length; index++) {
        const pair = pairs[index];
        let reference = cachedReferences?.get(pair.regionIndex);
        if (!reference) {
          onProgress?.({
            status: "reference",
            regionIndex: pair.regionIndex,
            current: index + 1,
            total: pairs.length,
            message:
              `구역 ${index + 1}/${pairs.length} 원본을 분석 중입니다.`,
          });
          reference = await clipAnalyzer.compareImageToPrompts(
            pair.referenceCanvas,
            clipPrompts,
            onProgress,
          );
          cachedReferences?.set(pair.regionIndex, reference);
        }

        onProgress?.({
          status: "restored",
          regionIndex: pair.regionIndex,
          current: index + 1,
          total: pairs.length,
          message:
            `구역 ${index + 1}/${pairs.length} 복원 결과를 분석 중입니다.`,
        });
        const restored = await clipAnalyzer.compareImageToPrompts(
          pair.restoredCanvas,
          clipPrompts,
          onProgress,
        );

        regionScores.push(
          window.CLIPScoreNormalizer.normalizeRegionScore({
            regionIndex: pair.regionIndex,
            prompt: pair.prompt,
            referenceRankings: reference.rankings,
            restoredRankings: restored.rankings,
          }),
        );
      }

      const clip =
        window.CLIPScoreNormalizer.aggregateRegionScores(regionScores);
      const combined = window.ScoreManager.combineWithClip(
        visualScore,
        clip,
        combinedWeights,
      );
      if (!combined.available) {
        throw new Error(combined.reason);
      }

      return Object.freeze({
        visualScore,
        clip,
        combined,
      });
    }

    return Object.freeze({ evaluate, preload });
  }

  window.CLIPScoreManager = Object.freeze({ create });
})();
