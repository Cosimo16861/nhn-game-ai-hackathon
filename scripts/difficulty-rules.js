(function () {
  "use strict";

  const RULES = Object.freeze({
    easy: Object.freeze({
      id: "easy",
      label: "쉬움",
      maskInsetBase: 0.12,
      maskInsetVariation: 0.08,
      labelMinimumBlankRatio: 0.25,
      maxHints: 3,
      shortDescription: "손상 적음 · 힌트 3회",
    }),
    normal: Object.freeze({
      id: "normal",
      label: "보통",
      maskInsetBase: 0.06,
      maskInsetVariation: 0.1,
      labelMinimumBlankRatio: 0.55,
      maxHints: 2,
      shortDescription: "표준 손상 · 힌트 2회",
    }),
    hard: Object.freeze({
      id: "hard",
      label: "어려움",
      maskInsetBase: 0.02,
      maskInsetVariation: 0.06,
      labelMinimumBlankRatio: 0.8,
      maxHints: 1,
      shortDescription: "손상 많음 · 힌트 1회",
    }),
  });

  function get(difficulty) {
    const rules = RULES[difficulty];
    if (!rules) {
      throw new Error(`지원하지 않는 난이도입니다: ${difficulty}`);
    }
    return rules;
  }

  window.DifficultyRules = Object.freeze({
    RULES,
    get,
  });
})();
