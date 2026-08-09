(function (global) {
  "use strict";

  const quests = Object.create(null);
  const HEX_COLOR = /^#[0-9a-f]{6}$/i;

  function assert(condition, message) {
    if (!condition) throw new Error(`작업대 설정 오류: ${message}`);
  }

  function validate(config) {
    assert(config && typeof config === "object", "설정 객체가 필요합니다.");
    assert(typeof config.id === "string" && config.id, "퀘스트 ID가 필요합니다.");
    assert(typeof config.title === "string" && config.title, `${config.id} 제목이 필요합니다.`);
    assert(Number.isInteger(config.gridSize) && config.gridSize > 0,
      `${config.id} 해상도는 양의 정수여야 합니다.`);
    assert(typeof config.lineSource === "string" && config.lineSource,
      `${config.id} 선화 이미지가 필요합니다.`);
    assert(typeof config.targetSource === "string" && config.targetSource,
      `${config.id} 완성 이미지가 필요합니다.`);
    assert(config.maskMode === "closed-regions",
      `${config.id}에서 지원하지 않는 마스크 생성 방식입니다.`);
    assert(Number.isFinite(config.outlineLuminanceThreshold) &&
      config.outlineLuminanceThreshold >= 0 && config.outlineLuminanceThreshold <= 255,
    `${config.id} 윤곽선 밝기 기준은 0~255여야 합니다.`);
    assert(Number.isInteger(config.historyLimit) && config.historyLimit > 0,
      `${config.id} 작업 이력 수는 양의 정수여야 합니다.`);
    assert(!config.completionCutscene || typeof config.completionCutscene === "string",
      `${config.id} 완료 컷신 ID가 올바르지 않습니다.`);
    assert(!config.afterPassUrl || typeof config.afterPassUrl === "string",
      `${config.id} 통과 후 이동 주소가 올바르지 않습니다.`);
    assert(Array.isArray(config.palette) && config.palette.length > 0,
      `${config.id} 팔레트가 필요합니다.`);
    assert(config.palette.length <= 8,
      `${config.id} 팔레트는 공통 화면에서 최대 8색까지 표시할 수 있습니다.`);

    const paletteColors = new Set();
    config.palette.forEach((entry, index) => {
      assert(entry && typeof entry.name === "string" && entry.name,
        `${config.id} 팔레트 ${index + 1}번 이름이 필요합니다.`);
      assert(HEX_COLOR.test(entry.hex),
        `${config.id} 팔레트 ${entry.name}의 색상 형식이 올바르지 않습니다.`);
      const normalized = entry.hex.toLowerCase();
      assert(!paletteColors.has(normalized),
        `${config.id} 팔레트에 중복 색상 ${entry.hex}이 있습니다.`);
      paletteColors.add(normalized);
    });
    assert(paletteColors.has(String(config.activeColor).toLowerCase()),
      `${config.id} 기본 색상이 팔레트에 없습니다.`);

    assert(Array.isArray(config.quotes) && config.quotes.length > 0,
      `${config.id} 목격자 힌트가 필요합니다.`);
    config.quotes.forEach((quote, index) => {
      assert(quote && quote.speaker && quote.text,
        `${config.id} ${index + 1}번 힌트의 화자와 문장이 필요합니다.`);
    });

    assert(Array.isArray(config.regions) && config.regions.length > 0,
      `${config.id} 부위 설정이 필요합니다.`);
    const regionIds = new Set();
    let weightTotal = 0;
    config.regions.forEach((region) => {
      assert(region.id && region.label, `${config.id} 부위 ID와 이름이 필요합니다.`);
      assert(!regionIds.has(region.id), `${config.id} 부위 ID ${region.id}가 중복됩니다.`);
      regionIds.add(region.id);
      assert(Number.isFinite(region.weight) && region.weight > 0,
        `${config.id} ${region.label} 점수 비중이 올바르지 않습니다.`);
      weightTotal += region.weight;
      assert(Array.isArray(region.seeds) && region.seeds.length > 0,
        `${config.id} ${region.label} 기준점이 필요합니다.`);
      region.seeds.forEach((seed) => {
        const [x, y] = seed || [];
        assert(Number.isInteger(x) && Number.isInteger(y) &&
          x >= 0 && y >= 0 && x < config.gridSize && y < config.gridSize,
        `${config.id} ${region.label} 기준점이 작업대 범위를 벗어났습니다.`);
      });
      assert(Array.isArray(region.paletteIndexes) && region.paletteIndexes.length > 0,
        `${config.id} ${region.label} 목표 색상이 필요합니다.`);
      region.paletteIndexes.forEach((index) => {
        assert(Number.isInteger(index) && index >= 0 && index < config.palette.length,
          `${config.id} ${region.label} 팔레트 번호가 올바르지 않습니다.`);
      });
    });
    assert(Math.abs(weightTotal - 1) < 0.000001,
      `${config.id} 부위별 점수 비중의 합은 1이어야 합니다.`);

    const scoring = config.scoring || {};
    assert(Number.isFinite(scoring.passingScore) &&
      scoring.passingScore >= 0 && scoring.passingScore <= 100,
    `${config.id} 전체 통과 점수는 0~100이어야 합니다.`);
    assert(Number.isFinite(scoring.minimumRegionScore) &&
      scoring.minimumRegionScore >= 0 && scoring.minimumRegionScore <= 100,
    `${config.id} 부위 통과 점수는 0~100이어야 합니다.`);
    assert(Number.isFinite(scoring.minimumRegionCoverage) &&
      scoring.minimumRegionCoverage >= 0 && scoring.minimumRegionCoverage <= 1,
    `${config.id} 최소 채색률은 0~1이어야 합니다.`);
    assert(scoring.scoreWeights &&
      ["color", "edge", "structure", "palette"].every(
        (key) => Number.isFinite(scoring.scoreWeights[key]) && scoring.scoreWeights[key] >= 0,
      ), `${config.id} 유사도 점수 비중이 올바르지 않습니다.`);
    const scoreWeightTotal = Object.values(scoring.scoreWeights)
      .reduce((sum, value) => sum + value, 0);
    assert(Math.abs(scoreWeightTotal - 1) < 0.000001,
      `${config.id} 유사도 점수 비중의 합은 1이어야 합니다.`);
    return config;
  }

  function register(config) {
    validate(config);
    assert(!quests[config.id], `${config.id}가 이미 등록되어 있습니다.`);
    quests[config.id] = config;
    return config;
  }

  global.WorkbenchQuestConfig = Object.freeze({
    defaultQuestId: "Q0_MONTAGE",
    register,
    validate,
    get(questId) {
      return quests[questId] || null;
    },
    list() {
      return Object.freeze(Object.values(quests));
    },
  });
})(window);
