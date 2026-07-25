(function () {
  "use strict";

  const REGION_COUNT = 16;
  const HIDDEN_REGION_COUNT = 3;
  const DIFFICULTIES = Object.freeze(["easy", "normal", "hard"]);

  function cleanText(value, maximumLength) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maximumLength);
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  function createCaseDefinition(definition) {
    const id = cleanText(definition.id, 40);
    const title = cleanText(definition.title, 60);
    const imageSrc = cleanText(definition.imageSrc, 240);
    const imageAlt = cleanText(definition.imageAlt, 100);
    const difficulty = cleanText(definition.difficulty || "normal", 10);
    const passingScore = Number(definition.passingScore ?? 60);
    const witnesses = Array.from(definition.witnesses || [])
      .map((witness) => cleanText(witness, 120))
      .filter(Boolean);
    const hiddenRegions = Array.from(definition.hiddenRegions || []);

    assert(
      /^[a-z0-9-]+$/.test(id),
      "사건 ID는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.",
    );
    assert(title.length > 0, `${id}: 사건명이 필요합니다.`);
    assert(imageSrc.length > 0, `${id}: 원본 이미지 경로가 필요합니다.`);
    assert(imageAlt.length > 0, `${id}: 이미지 설명이 필요합니다.`);
    assert(
      witnesses.length === HIDDEN_REGION_COUNT,
      `${id}: 가림 구역과 대응하는 목격담 3개가 필요합니다.`,
    );
    assert(
      hiddenRegions.length === HIDDEN_REGION_COUNT &&
        new Set(hiddenRegions).size === HIDDEN_REGION_COUNT &&
        hiddenRegions.every(
          (region) =>
            Number.isInteger(region) && region >= 0 && region < REGION_COUNT,
        ),
      `${id}: 0~15 사이의 서로 다른 가림 구역 3개를 지정해야 합니다.`,
    );
    assert(
      DIFFICULTIES.includes(difficulty),
      `${id}: 난이도는 easy, normal, hard 중 하나여야 합니다.`,
    );
    assert(
      Number.isFinite(passingScore) &&
        passingScore >= 0 &&
        passingScore <= 100,
      `${id}: 통과 점수는 0~100 사이여야 합니다.`,
    );

    return Object.freeze({
      id,
      title,
      imageSrc,
      imageAlt,
      witnesses: Object.freeze(witnesses),
      hiddenRegions: Object.freeze(hiddenRegions),
      difficulty,
      passingScore,
    });
  }

  function validateCaseDefinitions(definitions) {
    const cases = definitions.map(createCaseDefinition);
    const ids = cases.map((caseDefinition) => caseDefinition.id);

    assert(new Set(ids).size === ids.length, "사건 ID가 중복되었습니다.");
    return Object.freeze(cases);
  }

  const cases = validateCaseDefinitions([
    {
      id: "museum-robbery",
      title: "박물관 절도 사건",
      imageSrc: "./assets/cases/museum-robbery.png",
      imageAlt: "박물관 전시실의 모습",
      witnesses: [
        "왼쪽 위에서 둥근 흰빛 사이로 깨진 유리 조각이 번쩍였습니다.",
        "그 아래쪽에는 붉고 각진 물체가 바닥 가까이 놓여 있었습니다.",
        "오른쪽 아래로 사람을 닮은 길고 검은 그림자가 이어졌습니다.",
      ],
      hiddenRegions: [0, 4, 15],
      difficulty: "normal",
      passingScore: 65,
    },
    {
      id: "convenience-store-theft",
      title: "심야 편의점 절도 사건",
      imageSrc: "./assets/cases/convenience-store-theft.png",
      imageAlt: "심야 편의점 계산대 주변의 모습",
      witnesses: [
        "오른쪽 위 선반에는 노란색과 붉은색 물건이 층층이 보였습니다.",
        "왼쪽 아래 출입문 근처에서 파란 진열대의 윗부분을 봤습니다.",
        "그보다 아래에는 쓰러진 파란 선반과 흩어진 물건이 있었습니다.",
      ],
      hiddenRegions: [3, 8, 12],
      difficulty: "easy",
      passingScore: 60,
    },
  ]);

  window.CaseData = Object.freeze({
    REGION_COUNT,
    HIDDEN_REGION_COUNT,
    DIFFICULTIES,
    createCaseDefinition,
    validateCaseDefinitions,
    cases,
  });
})();
