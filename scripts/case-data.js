(function () {
  "use strict";

  const REGION_COUNT = 16;
  const HIDDEN_REGION_COUNT = 3;
  const CHAPTER_COLUMNS = 2;
  const CHAPTER_ROWS = 2;
  const MAX_STAGES_PER_CHAPTER = CHAPTER_COLUMNS * CHAPTER_ROWS;
  const DIFFICULTIES = Object.freeze(["easy", "normal", "hard"]);
  const MASTER_IMAGE_STATUSES = Object.freeze(["ready", "placeholder"]);

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
    const clipPrompts = Array.from(definition.clipPrompts || [])
      .map((prompt) => cleanText(prompt, 240))
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
      clipPrompts.length === HIDDEN_REGION_COUNT &&
        new Set(clipPrompts).size === HIDDEN_REGION_COUNT &&
        clipPrompts.every((prompt) => /[A-Za-z]/.test(prompt)),
      `${id}: 가림 구역과 대응하는 서로 다른 영문 CLIP 문장 3개가 필요합니다.`,
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
      clipPrompts: Object.freeze(clipPrompts),
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

  function createCropDefinition(crop, contextId) {
    const column = Number(crop?.column);
    const row = Number(crop?.row);
    assert(
      Number.isInteger(column) &&
        column >= 0 &&
        column < CHAPTER_COLUMNS &&
        Number.isInteger(row) &&
        row >= 0 &&
        row < CHAPTER_ROWS,
      `${contextId}: 조각 위치는 2×2 범위 안에 있어야 합니다.`,
    );
    return Object.freeze({ column, row });
  }

  function createDeductionQuestion(question, contextId) {
    if (question === undefined || question === null) return null;
    const prompt = cleanText(question.prompt, 160);
    const options = Array.from(question.options || [])
      .map((option) => cleanText(option, 80))
      .filter(Boolean);
    const answerIndex = Number(question.answerIndex);
    const explanation = cleanText(question.explanation, 240);
    assert(prompt.length > 0, `${contextId}: 추리 질문이 필요합니다.`);
    assert(
      options.length >= 2 &&
        options.length <= 4 &&
        new Set(options).size === options.length,
      `${contextId}: 서로 다른 추리 선택지 2~4개가 필요합니다.`,
    );
    assert(
      Number.isInteger(answerIndex) &&
        answerIndex >= 0 &&
        answerIndex < options.length,
      `${contextId}: 추리 정답 번호가 올바르지 않습니다.`,
    );
    return Object.freeze({
      prompt,
      options: Object.freeze(options),
      answerIndex,
      explanation,
    });
  }

  function createStageDefinition(definition, chapterId, order) {
    const baseDefinition = createCaseDefinition(definition);
    const summary = cleanText(
      definition.summary || baseDefinition.imageAlt,
      140,
    );
    const hints = Array.from(definition.hints || [])
      .map((hint) => cleanText(hint, 140))
      .filter(Boolean)
      .slice(0, 4);
    const crop = createCropDefinition(
      definition.crop || { column: 0, row: 0 },
      baseDefinition.id,
    );
    const deductionQuestion = createDeductionQuestion(
      definition.deductionQuestion,
      baseDefinition.id,
    );

    assert(summary.length > 0, `${baseDefinition.id}: 단계 설명이 필요합니다.`);
    assert(
      Number.isInteger(order) &&
        order >= 1 &&
        order <= MAX_STAGES_PER_CHAPTER,
      `${baseDefinition.id}: 단계 순서가 올바르지 않습니다.`,
    );

    return Object.freeze({
      ...baseDefinition,
      chapterId,
      order,
      summary,
      crop,
      hints: Object.freeze(hints),
      deductionQuestion,
    });
  }

  function createChapterDefinition(definition) {
    const id = cleanText(definition.id, 40);
    const title = cleanText(definition.title, 60);
    const summary = cleanText(definition.summary, 180);
    const masterImageSrc = cleanText(definition.masterImageSrc, 240);
    const masterImageAlt = cleanText(definition.masterImageAlt, 120);
    const masterImageStatus = cleanText(
      definition.masterImageStatus || "ready",
      20,
    );
    const stageDefinitions = Array.from(definition.stages || []);

    assert(
      /^[a-z0-9-]+$/.test(id),
      "대형 사건 ID는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.",
    );
    assert(title.length > 0, `${id}: 대형 사건명이 필요합니다.`);
    assert(summary.length > 0, `${id}: 대형 사건 설명이 필요합니다.`);
    assert(masterImageSrc.length > 0, `${id}: 대형 사건 이미지가 필요합니다.`);
    assert(masterImageAlt.length > 0, `${id}: 대형 사건 이미지 설명이 필요합니다.`);
    assert(
      MASTER_IMAGE_STATUSES.includes(masterImageStatus),
      `${id}: 대형 사건 이미지 상태가 올바르지 않습니다.`,
    );
    assert(
      stageDefinitions.length >= 1 &&
        stageDefinitions.length <= MAX_STAGES_PER_CHAPTER,
      `${id}: 세부 사건은 1~4개가 필요합니다.`,
    );

    const stages = stageDefinitions.map((stage, index) =>
      createStageDefinition(stage, id, index + 1),
    );
    const stageIds = stages.map((stage) => stage.id);
    const cropKeys = stages.map(
      (stage) => `${stage.crop.column}:${stage.crop.row}`,
    );
    assert(new Set(stageIds).size === stageIds.length, `${id}: 세부 사건 ID가 중복되었습니다.`);
    assert(new Set(cropKeys).size === cropKeys.length, `${id}: 세부 사건 조각 위치가 중복되었습니다.`);

    return Object.freeze({
      id,
      title,
      summary,
      masterImageSrc,
      masterImageAlt,
      masterImageStatus,
      layout: Object.freeze({
        columns: CHAPTER_COLUMNS,
        rows: CHAPTER_ROWS,
      }),
      stages: Object.freeze(stages),
      finalDeduction: createDeductionQuestion(
        definition.finalDeduction,
        id,
      ),
    });
  }

  function validateChapterDefinitions(definitions) {
    const chapters = definitions.map(createChapterDefinition);
    const chapterIds = chapters.map((chapter) => chapter.id);
    const stageIds = chapters.flatMap((chapter) =>
      chapter.stages.map((stage) => stage.id),
    );
    assert(new Set(chapterIds).size === chapterIds.length, "대형 사건 ID가 중복되었습니다.");
    assert(new Set(stageIds).size === stageIds.length, "전체 세부 사건 ID가 중복되었습니다.");
    return Object.freeze(chapters);
  }

  const legacyCaseDefinitions = [
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
      clipPrompts: [
        "A bright full moon shining through a shattered museum window with sharp glass fragments.",
        "A large faceted red gemstone lying among broken glass on a dark museum floor.",
        "A long dark human-shaped shadow stretching across a blue tiled museum floor.",
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
      clipPrompts: [
        "Rows of yellow and red snack packages stacked on a convenience store shelf.",
        "The upper half of a bright blue product display near a glass entrance door.",
        "A toppled bright blue display with colorful snack packages scattered on the floor.",
      ],
      hiddenRegions: [3, 8, 12],
      difficulty: "easy",
      passingScore: 60,
    },
  ];

  const cases = validateCaseDefinitions(legacyCaseDefinitions);
  const chapterSummaries = Object.freeze({
    "museum-robbery":
      "깨진 창문부터 사라진 보석까지 전시실에 남은 증거를 차례로 복원합니다.",
    "convenience-store-theft":
      "심야 편의점에 남은 진열대와 바닥의 흔적을 따라 절도 사건을 조사합니다.",
  });
  const museumStageDefinitions = [
    {
      id: "museum-robbery-stage-1",
      title: "깨진 창문 조사",
      imageSrc: "./assets/cases/museum-robbery-master-dark-color.png",
      imageAlt: "달빛이 비치는 박물관의 깨진 창문",
      summary: "침입 흔적이 남은 창문 주변을 복원합니다.",
      witnesses: [
        "둥근 달빛 아래 깨진 유리 조각이 번쩍였습니다.",
        "창문 한쪽에는 붉은 천이 길게 걸려 있었습니다.",
        "푸른빛이 창틀과 바닥 사이로 비쳤습니다.",
      ],
      clipPrompts: [
        "A bright round moon above a shattered museum window.",
        "A long red curtain hanging beside a broken window.",
        "Cool blue moonlight falling across a museum window frame.",
      ],
      hiddenRegions: [0, 5, 10],
      difficulty: "easy",
      passingScore: 55,
      crop: { column: 0, row: 0 },
      hints: ["달과 창틀의 큰 형태부터 맞춰 보세요."],
    },
    {
      id: "museum-robbery-stage-2",
      title: "비어 있는 전시대",
      imageSrc: "./assets/cases/museum-robbery-master-dark-color.png",
      imageAlt: "비어 있는 박물관 전시대와 붉은 경보등",
      summary: "도난품이 사라진 전시 구역을 복원합니다.",
      witnesses: [
        "밝은 전시대 여러 개가 비어 있었습니다.",
        "벽 가까이 붉은 경보등이 켜져 있었습니다.",
        "오른쪽에는 어두운 아치형 문이 보였습니다.",
      ],
      clipPrompts: [
        "Several illuminated empty display cases inside a museum.",
        "A glowing red alarm light near museum display cases.",
        "A dark arched doorway beside a museum exhibition hall.",
      ],
      hiddenRegions: [2, 7, 11],
      difficulty: "normal",
      passingScore: 60,
      crop: { column: 1, row: 0 },
      hints: ["밝은 전시대와 어두운 문을 구분하세요."],
    },
    {
      id: "museum-robbery-stage-3",
      title: "남겨진 발자국",
      imageSrc: "./assets/cases/museum-robbery-master-dark-color.png",
      imageAlt: "박물관 바닥의 발자국과 넘어진 안내판",
      summary: "범인의 이동 경로가 남은 바닥을 복원합니다.",
      witnesses: [
        "검은 발자국이 바닥을 가로질러 이어졌습니다.",
        "통로 옆 안내판 하나가 비스듬히 쓰러져 있었습니다.",
        "바닥 일부에 푸른 달빛이 길게 번졌습니다.",
      ],
      clipPrompts: [
        "A trail of dark footprints crossing a museum floor.",
        "A fallen museum sign lying at an angle on the floor.",
        "A long patch of cool blue moonlight across museum tiles.",
      ],
      hiddenRegions: [4, 9, 13],
      difficulty: "normal",
      passingScore: 65,
      crop: { column: 0, row: 1 },
      hints: ["발자국이 이어지는 방향을 먼저 찾으세요."],
    },
    {
      id: "museum-robbery-stage-4",
      title: "보석함과 그림자",
      imageSrc: "./assets/cases/museum-robbery-master-dark-color.png",
      imageAlt: "부서진 보석함과 바닥에 드리운 긴 그림자",
      summary: "도주 직전의 결정적인 흔적을 복원합니다.",
      witnesses: [
        "열린 보석함 주변에 유리 조각이 흩어져 있었습니다.",
        "사람 모양의 긴 검은 그림자가 바닥에 드리웠습니다.",
        "상자 가까이에 붉은 천 조각이 놓여 있었습니다.",
      ],
      clipPrompts: [
        "An open broken jewel case with glass fragments around it.",
        "A long human-shaped dark shadow across a museum floor.",
        "A piece of red fabric lying beside an open jewel box.",
      ],
      hiddenRegions: [3, 10, 15],
      difficulty: "hard",
      passingScore: 70,
      crop: { column: 1, row: 1 },
      hints: ["보석함, 그림자, 붉은 천의 위치를 따로 확인하세요."],
    },
  ];
  const convenienceCase = legacyCaseDefinitions[1];
  const chapters = validateChapterDefinitions([
    {
      id: "museum-robbery",
      title: legacyCaseDefinitions[0].title,
      summary: chapterSummaries["museum-robbery"],
      masterImageSrc: "./assets/cases/museum-robbery-master-dark-color.png",
      masterImageStatus: "ready",
      masterImageAlt: "박물관 절도 사건의 전체 현장",
      stages: museumStageDefinitions,
      finalDeduction: {
        prompt:
          "복원된 전체 현장을 볼 때 범인의 침입 경로로 가장 타당한 곳은 어디입니까?",
        options: ["깨진 창문", "정문", "지하 보관실"],
        answerIndex: 0,
        explanation:
          "깨진 창문 아래의 유리 조각과 실내로 이어진 흔적이 침입 방향을 보여줍니다.",
      },
    },
    {
      id: convenienceCase.id,
      title: convenienceCase.title,
      summary: chapterSummaries[convenienceCase.id],
      masterImageSrc: convenienceCase.imageSrc,
      masterImageStatus: "placeholder",
      masterImageAlt: convenienceCase.imageAlt,
      stages: [
        {
          ...convenienceCase,
          id: `${convenienceCase.id}-stage-1`,
          title: "흐트러진 진열대 조사",
          summary: convenienceCase.imageAlt,
          crop: { column: 0, row: 0 },
          hints: [],
        },
      ],
    },
  ]);

  window.CaseData = Object.freeze({
    REGION_COUNT,
    HIDDEN_REGION_COUNT,
    CHAPTER_COLUMNS,
    CHAPTER_ROWS,
    MAX_STAGES_PER_CHAPTER,
    DIFFICULTIES,
    MASTER_IMAGE_STATUSES,
    createCaseDefinition,
    createStageDefinition,
    createChapterDefinition,
    validateCaseDefinitions,
    validateChapterDefinitions,
    chapters,
    cases,
  });
})();
